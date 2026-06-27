from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase

from merchants.models import Merchant, MerchantEvent
from merchants.services import (
    APPROVE_MERCHANT_MESSAGE,
    BLOCK_MERCHANT_MESSAGE,
    REJECT_MERCHANT_MESSAGE,
    REOPEN_MERCHANT_MESSAGE,
    SUBMIT_FOR_ANALYSIS_MESSAGE,
    UNBLOCK_MERCHANT_MESSAGE,
)


class MerchantApiTestCase(APITestCase):
    def create_merchant(
        self,
        *,
        cnpj="11.222.333/0001-81",
        legal_name="Acme Pagamentos LTDA",
        contact_email="ops@acme.example",
    ):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": cnpj,
                "legal_name": legal_name,
                "contact_email": contact_email,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response


class MerchantCreationTests(MerchantApiTestCase):
    def test_creates_merchant_in_draft_and_normalizes_cnpj(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Acme Pagamentos LTDA",
                "trade_name": "Acme Pay",
                "contact_email": "ops@acme.example",
                "phone": "11999990000",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["cnpj"], "11222333000181")
        self.assertEqual(response.data["status"], "draft")
        self.assertEqual(response.data["legal_name"], "Acme Pagamentos LTDA")
        self.assertEqual(response.data["trade_name"], "Acme Pay")
        self.assertEqual(response.data["contact_email"], "ops@acme.example")
        self.assertEqual(response.data["phone"], "11999990000")
        self.assertIn("created_at", response.data)

        detail = self.client.get(
            reverse("merchant-detail", kwargs={"pk": response.data["id"]}),
            format="json",
        )

        self.assertEqual(detail.data["cnpj"], "11222333000181")
        self.assertEqual(detail.data["status"], "draft")

    def test_requires_cnpj_legal_name_and_contact_email(self):
        payload = {
            "cnpj": "11222333000181",
            "legal_name": "Acme Pagamentos LTDA",
            "contact_email": "ops@acme.example",
        }

        for field in ["cnpj", "legal_name", "contact_email"]:
            with self.subTest(field=field):
                response = self.client.post(
                    reverse("merchant-list"),
                    {key: value for key, value in payload.items() if key != field},
                    format="json",
                )

                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)

    def test_trade_name_and_phone_are_optional(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11222333000181",
                "legal_name": "Acme Pagamentos LTDA",
                "contact_email": "ops@acme.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["trade_name"], "")
        self.assertEqual(response.data["phone"], "")

    def test_rejects_duplicate_cnpj_after_normalization(self):
        first = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Acme Pagamentos LTDA",
                "contact_email": "ops@acme.example",
            },
            format="json",
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11222333000181",
                "legal_name": "Outro Merchant LTDA",
                "contact_email": "ops@outro.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", response.data)


class MerchantReadTests(MerchantApiTestCase):
    def test_retrieves_merchant_by_id(self):
        created = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Acme Pagamentos LTDA",
                "contact_email": "ops@acme.example",
            },
            format="json",
        )

        response = self.client.get(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], created.data["id"])
        self.assertEqual(response.data["cnpj"], "11222333000181")
        self.assertEqual(response.data["legal_name"], "Acme Pagamentos LTDA")
        self.assertEqual(response.data["contact_email"], "ops@acme.example")
        self.assertEqual(response.data["status"], "draft")

    def test_lists_merchants_without_embedded_timeline(self):
        first = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Acme Pagamentos LTDA",
                "contact_email": "ops@acme.example",
            },
            format="json",
        )
        second = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "98.765.432/0001-98",
                "legal_name": "Beta Comercio LTDA",
                "contact_email": "ops@beta.example",
            },
            format="json",
        )

        response = self.client.get(reverse("merchant-list"), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertIsNone(response.data["next"])
        self.assertIsNone(response.data["previous"])
        self.assertEqual(
            [merchant["id"] for merchant in response.data["results"]],
            [first.data["id"], second.data["id"]],
        )

        for merchant in response.data["results"]:
            self.assertEqual(
                set(merchant.keys()),
                {
                    "id",
                    "cnpj",
                    "legal_name",
                    "trade_name",
                    "contact_email",
                    "phone",
                    "created_at",
                    "status",
                },
            )
            self.assertNotIn("timeline", merchant)

    def test_paginates_merchants(self):
        cnpjs = [
            "12345678000195",
            "12345678000276",
            "12345678000357",
        ]
        for index, cnpj in enumerate(cnpjs, start=1):
            Merchant.objects.create(
                cnpj=cnpj,
                legal_name=f"Merchant {index}",
                contact_email=f"ops-{index}@merchant.example",
            )

        first_page = self.client.get(
            reverse("merchant-list"),
            {"page_size": 2},
            format="json",
        )

        self.assertEqual(first_page.status_code, status.HTTP_200_OK)
        self.assertEqual(first_page.data["count"], 3)
        self.assertEqual(len(first_page.data["results"]), 2)
        self.assertIsNotNone(first_page.data["next"])
        self.assertIsNone(first_page.data["previous"])
        self.assertEqual(
            [merchant["legal_name"] for merchant in first_page.data["results"]],
            ["Merchant 1", "Merchant 2"],
        )

        second_page = self.client.get(
            reverse("merchant-list"),
            {"page": 2, "page_size": 2},
            format="json",
        )

        self.assertEqual(second_page.status_code, status.HTTP_200_OK)
        self.assertEqual(second_page.data["count"], 3)
        self.assertEqual(len(second_page.data["results"]), 1)
        self.assertIsNone(second_page.data["next"])
        self.assertIsNotNone(second_page.data["previous"])
        self.assertEqual(second_page.data["results"][0]["legal_name"], "Merchant 3")

    def test_filters_merchants_by_status(self):
        valid_cnpjs = [
            "12345678000195",
            "12345678000276",
            "12345678000357",
            "12345678000438",
            "12345678000519",
        ]
        for index, merchant_status in enumerate(Merchant.Status.values, start=1):
            Merchant.objects.create(
                cnpj=valid_cnpjs[index - 1],
                legal_name=f"Merchant {merchant_status}",
                contact_email=f"ops-{index}@merchant.example",
                status=merchant_status,
            )

        for merchant_status in Merchant.Status.values:
            with self.subTest(status=merchant_status):
                response = self.client.get(
                    reverse("merchant-list"),
                    {"status": merchant_status},
                    format="json",
                )

                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["count"], 1)
                self.assertEqual(len(response.data["results"]), 1)
                self.assertEqual(
                    response.data["results"][0]["status"],
                    merchant_status,
                )
                self.assertEqual(
                    response.data["results"][0]["legal_name"],
                    f"Merchant {merchant_status}",
                )


class MerchantUpdateTests(MerchantApiTestCase):
    def test_updates_registration_data_while_merchant_is_in_draft(self):
        created = self.create_merchant()

        response = self.client.patch(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            {
                "legal_name": "Acme Solucoes Financeiras LTDA",
                "trade_name": "Acme Solucoes",
                "contact_email": "analise@acme.example",
                "phone": "11988887777",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["legal_name"], "Acme Solucoes Financeiras LTDA")
        self.assertEqual(response.data["trade_name"], "Acme Solucoes")
        self.assertEqual(response.data["contact_email"], "analise@acme.example")
        self.assertEqual(response.data["phone"], "11988887777")
        self.assertEqual(response.data["status"], "draft")

    def test_does_not_allow_status_to_be_changed_by_regular_update(self):
        created = self.create_merchant()

        response = self.client.patch(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            {"status": "pending_analysis"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "draft")

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.DRAFT)
        self.assertEqual(MerchantEvent.objects.count(), 0)

    def test_does_not_update_registration_data_outside_draft(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.patch(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            {"legal_name": "Nome Alterado LTDA"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.legal_name, "Acme Pagamentos LTDA")


class MerchantWorkflowTests(MerchantApiTestCase):
    def test_submits_draft_merchant_for_analysis_and_creates_event(self):
        created = self.create_merchant()

        response = self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "pending_analysis")

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.PENDING_ANALYSIS)

        event = MerchantEvent.objects.get(merchant=merchant)
        self.assertEqual(event.message, SUBMIT_FOR_ANALYSIS_MESSAGE)

    def test_does_not_submit_merchant_for_analysis_outside_draft(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)
        self.assertEqual(MerchantEvent.objects.count(), 1)

    def test_approves_pending_analysis_merchant_and_creates_event(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-approve", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "approved")

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.APPROVED)

        timeline = self.client.get(
            reverse("merchant-timeline", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(timeline.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [event["message"] for event in timeline.data],
            [SUBMIT_FOR_ANALYSIS_MESSAGE, APPROVE_MERCHANT_MESSAGE],
        )

    def test_does_not_approve_merchant_outside_pending_analysis(self):
        created = self.create_merchant()

        response = self.client.post(
            reverse("merchant-approve", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.DRAFT)
        self.assertEqual(MerchantEvent.objects.count(), 0)


class MerchantRejectTests(MerchantApiTestCase):
    def test_rejects_pending_analysis_merchant_and_creates_event(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-reject", kwargs={"pk": created.data["id"]}),
            {"reason": "Documentação inconsistente"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "rejected")

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.REJECTED)

        timeline = self.client.get(
            reverse("merchant-timeline", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(timeline.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [event["message"] for event in timeline.data],
            [
                SUBMIT_FOR_ANALYSIS_MESSAGE,
                REJECT_MERCHANT_MESSAGE.format("Documentação inconsistente"),
            ],
        )

    def test_requires_reason_when_rejecting(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-reject", kwargs={"pk": created.data["id"]}),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.PENDING_ANALYSIS)
        self.assertEqual(MerchantEvent.objects.count(), 1)

    def test_rejects_empty_reason(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-reject", kwargs={"pk": created.data["id"]}),
            {"reason": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.PENDING_ANALYSIS)
        self.assertEqual(MerchantEvent.objects.count(), 1)

    def test_does_not_reject_merchant_outside_pending_analysis(self):
        created = self.create_merchant()

        response = self.client.post(
            reverse("merchant-reject", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.DRAFT)
        self.assertEqual(MerchantEvent.objects.count(), 0)


class MerchantBlockTests(MerchantApiTestCase):
    def test_blocks_approved_merchant_and_creates_event(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-approve", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-block", kwargs={"pk": created.data["id"]}),
            {"reason": "Fraude documental"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "blocked")

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.BLOCKED)

        timeline = self.client.get(
            reverse("merchant-timeline", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(timeline.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [event["message"] for event in timeline.data],
            [
                SUBMIT_FOR_ANALYSIS_MESSAGE,
                APPROVE_MERCHANT_MESSAGE,
                BLOCK_MERCHANT_MESSAGE.format("Fraude documental"),
            ],
        )

    def test_requires_reason_when_blocking(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-approve", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-block", kwargs={"pk": created.data["id"]}),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.APPROVED)
        self.assertEqual(MerchantEvent.objects.count(), 2)

    def test_rejects_empty_reason_when_blocking(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-approve", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-block", kwargs={"pk": created.data["id"]}),
            {"reason": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.APPROVED)
        self.assertEqual(MerchantEvent.objects.count(), 2)

    def test_does_not_block_merchant_outside_approved(self):
        created = self.create_merchant()

        response = self.client.post(
            reverse("merchant-block", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.DRAFT)
        self.assertEqual(MerchantEvent.objects.count(), 0)


class MerchantTimelineTests(MerchantApiTestCase):
    def test_timeline_starts_empty_for_new_draft_merchant(self):
        created = self.create_merchant()

        response = self.client.get(
            reverse("merchant-timeline", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
        self.assertEqual(MerchantEvent.objects.count(), 0)

    def test_timeline_returns_only_merchant_events_in_chronological_order(self):
        first = self.create_merchant()
        second = self.create_merchant(
            cnpj="98.765.432/0001-98",
            legal_name="Beta Comercio LTDA",
            contact_email="ops@beta.example",
        )
        first_merchant = Merchant.objects.get(pk=first.data["id"])
        second_merchant = Merchant.objects.get(pk=second.data["id"])
        first_event = MerchantEvent.objects.create(
            merchant=first_merchant,
            message=SUBMIT_FOR_ANALYSIS_MESSAGE,
        )
        second_event = MerchantEvent.objects.create(
            merchant=first_merchant,
            message=APPROVE_MERCHANT_MESSAGE,
        )
        MerchantEvent.objects.create(
            merchant=second_merchant,
            message="Cadastro de outro estabelecimento",
        )

        response = self.client.get(
            reverse("merchant-timeline", kwargs={"pk": first.data["id"]}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [event["id"] for event in response.data],
            [first_event.id, second_event.id],
        )
        self.assertEqual(
            [event["message"] for event in response.data],
            [SUBMIT_FOR_ANALYSIS_MESSAGE, APPROVE_MERCHANT_MESSAGE],
        )

        for event in response.data:
            self.assertEqual(set(event.keys()), {"id", "message", "created_at"})
            self.assertIn("created_at", event)


class MerchantReopenTests(MerchantApiTestCase):
    def _create_rejected_merchant(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-reject", kwargs={"pk": created.data["id"]}),
            {"reason": "Documentação inconsistente"},
            format="json",
        )
        return created

    def test_reopens_rejected_merchant_and_creates_event(self):
        created = self._create_rejected_merchant()

        response = self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {"reason": "Documentação regularizada"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "draft")

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.DRAFT)

        timeline = self.client.get(
            reverse("merchant-timeline", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.assertEqual(timeline.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [event["message"] for event in timeline.data],
            [
                SUBMIT_FOR_ANALYSIS_MESSAGE,
                REJECT_MERCHANT_MESSAGE.format("Documentação inconsistente"),
                REOPEN_MERCHANT_MESSAGE.format("Documentação regularizada"),
            ],
        )

    def test_does_not_alter_registration_data_on_reopen(self):
        created = self.create_merchant(
            cnpj="98.765.432/0001-98",
            legal_name="Beta Comercio LTDA",
            contact_email="ops@beta.example",
        )
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-reject", kwargs={"pk": created.data["id"]}),
            {"reason": "Revisão"},
            format="json",
        )

        response = self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {"reason": "Dados revisados"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["legal_name"], "Beta Comercio LTDA")
        self.assertEqual(response.data["cnpj"], "98765432000198")

    def test_requires_reason_when_reopening(self):
        created = self._create_rejected_merchant()

        response = self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.REJECTED)
        self.assertEqual(MerchantEvent.objects.count(), 2)

    def test_rejects_empty_reason_when_reopening(self):
        created = self._create_rejected_merchant()

        response = self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {"reason": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.REJECTED)
        self.assertEqual(MerchantEvent.objects.count(), 2)

    def test_does_not_reopen_merchant_in_draft(self):
        created = self.create_merchant()

        response = self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.DRAFT)
        self.assertEqual(MerchantEvent.objects.count(), 0)

    def test_does_not_reopen_merchant_in_pending_analysis(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.PENDING_ANALYSIS)
        self.assertEqual(MerchantEvent.objects.count(), 1)

    def test_does_not_reopen_merchant_in_approved(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-approve", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.APPROVED)
        self.assertEqual(MerchantEvent.objects.count(), 2)

    def test_does_not_reopen_merchant_in_blocked(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-approve", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-block", kwargs={"pk": created.data["id"]}),
            {"reason": "Fraude"},
            format="json",
        )

        response = self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.BLOCKED)
        self.assertEqual(MerchantEvent.objects.count(), 3)

    def test_reopened_merchant_can_update_registration_data(self):
        created = self._create_rejected_merchant()
        self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {"reason": "Dados revisados"},
            format="json",
        )

        response = self.client.patch(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            {
                "legal_name": "Acme Solucoes Financeiras LTDA",
                "trade_name": "Acme Solucoes",
                "contact_email": "analise@acme.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["legal_name"], "Acme Solucoes Financeiras LTDA"
        )
        self.assertEqual(response.data["trade_name"], "Acme Solucoes")
        self.assertEqual(response.data["contact_email"], "analise@acme.example")
        self.assertEqual(response.data["status"], "draft")

    def test_full_reject_reopen_edit_resubmit_flow(self):
        created = self._create_rejected_merchant()
        self.client.post(
            reverse("merchant-reopen", kwargs={"pk": created.data["id"]}),
            {"reason": "Dados revisados"},
            format="json",
        )
        self.client.patch(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            {"legal_name": "Acme Solucoes Financeiras LTDA"},
            format="json",
        )

        response = self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "pending_analysis")
        self.assertEqual(
            response.data["legal_name"], "Acme Solucoes Financeiras LTDA"
        )

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.PENDING_ANALYSIS)
        self.assertEqual(
            merchant.legal_name, "Acme Solucoes Financeiras LTDA"
        )


class MerchantUnblockTests(MerchantApiTestCase):
    def _create_blocked_merchant(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-approve", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-block", kwargs={"pk": created.data["id"]}),
            {"reason": "Fraude"},
            format="json",
        )
        return created

    def test_unblocks_blocked_merchant_and_creates_event(self):
        created = self._create_blocked_merchant()

        response = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {"reason": "Inocência comprovada"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "approved")

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.APPROVED)

        timeline = self.client.get(
            reverse("merchant-timeline", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.assertEqual(timeline.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [event["message"] for event in timeline.data],
            [
                SUBMIT_FOR_ANALYSIS_MESSAGE,
                APPROVE_MERCHANT_MESSAGE,
                BLOCK_MERCHANT_MESSAGE.format("Fraude"),
                UNBLOCK_MERCHANT_MESSAGE.format("Inocência comprovada"),
            ],
        )

    def test_requires_reason_when_unblocking(self):
        created = self._create_blocked_merchant()

        response = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.BLOCKED)
        self.assertEqual(MerchantEvent.objects.count(), 3)

    def test_rejects_empty_reason_when_unblocking(self):
        created = self._create_blocked_merchant()

        response = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {"reason": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.BLOCKED)
        self.assertEqual(MerchantEvent.objects.count(), 3)

    def test_does_not_unblock_merchant_in_draft(self):
        created = self.create_merchant()

        response = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.DRAFT)
        self.assertEqual(MerchantEvent.objects.count(), 0)

    def test_does_not_unblock_merchant_in_pending_analysis(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.PENDING_ANALYSIS)
        self.assertEqual(MerchantEvent.objects.count(), 1)

    def test_does_not_unblock_merchant_in_approved(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-approve", kwargs={"pk": created.data["id"]}),
            format="json",
        )

        response = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.APPROVED)
        self.assertEqual(MerchantEvent.objects.count(), 2)

    def test_does_not_unblock_merchant_in_rejected(self):
        created = self.create_merchant()
        self.client.post(
            reverse("merchant-submit-for-analysis", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.client.post(
            reverse("merchant-reject", kwargs={"pk": created.data["id"]}),
            {"reason": "Revisão"},
            format="json",
        )

        response = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {"reason": "Qualquer motivo"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("status", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.REJECTED)
        self.assertEqual(MerchantEvent.objects.count(), 2)

    def test_does_not_alter_registration_data_on_unblock(self):
        created = self._create_blocked_merchant()
        merchant = Merchant.objects.get(pk=created.data["id"])
        original_cnpj = merchant.cnpj
        original_legal_name = merchant.legal_name
        original_trade_name = merchant.trade_name
        original_contact_email = merchant.contact_email
        original_phone = merchant.phone

        response = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {"reason": "Documentos regularizados"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["cnpj"], original_cnpj)
        self.assertEqual(response.data["legal_name"], original_legal_name)
        self.assertEqual(response.data["trade_name"], original_trade_name)
        self.assertEqual(response.data["contact_email"], original_contact_email)
        self.assertEqual(response.data["phone"], original_phone)

        merchant.refresh_from_db()
        self.assertEqual(merchant.cnpj, original_cnpj)
        self.assertEqual(merchant.legal_name, original_legal_name)
        self.assertEqual(merchant.trade_name, original_trade_name)
        self.assertEqual(merchant.contact_email, original_contact_email)
        self.assertEqual(merchant.phone, original_phone)

    def test_multiple_block_unblock_cycles(self):
        created = self._create_blocked_merchant()

        first_unblock = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {"reason": "Primeiro desbloqueio"},
            format="json",
        )
        self.assertEqual(first_unblock.status_code, status.HTTP_200_OK)
        self.assertEqual(first_unblock.data["status"], "approved")

        second_block = self.client.post(
            reverse("merchant-block", kwargs={"pk": created.data["id"]}),
            {"reason": "Nova ocorrencia"},
            format="json",
        )
        self.assertEqual(second_block.status_code, status.HTTP_200_OK)
        self.assertEqual(second_block.data["status"], "blocked")

        second_unblock = self.client.post(
            reverse("merchant-unblock", kwargs={"pk": created.data["id"]}),
            {"reason": "Segundo desbloqueio"},
            format="json",
        )
        self.assertEqual(second_unblock.status_code, status.HTTP_200_OK)
        self.assertEqual(second_unblock.data["status"], "approved")

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.status, Merchant.Status.APPROVED)

        timeline = self.client.get(
            reverse("merchant-timeline", kwargs={"pk": created.data["id"]}),
            format="json",
        )
        self.assertEqual(timeline.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [event["message"] for event in timeline.data],
            [
                SUBMIT_FOR_ANALYSIS_MESSAGE,
                APPROVE_MERCHANT_MESSAGE,
                BLOCK_MERCHANT_MESSAGE.format("Fraude"),
                UNBLOCK_MERCHANT_MESSAGE.format("Primeiro desbloqueio"),
                BLOCK_MERCHANT_MESSAGE.format("Nova ocorrencia"),
                UNBLOCK_MERCHANT_MESSAGE.format("Segundo desbloqueio"),
            ],
        )


class MerchantCnpjValidationTests(MerchantApiTestCase):
    def test_accepts_numeric_cnpj_with_punctuation(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Numeric Punct LTDA",
                "contact_email": "numeric@punct.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["cnpj"], "11222333000181")

    def test_accepts_numeric_cnpj_with_whitespace(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11 222 333 0001 81",
                "legal_name": "Numeric Space LTDA",
                "contact_email": "numeric-space@cnpj.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["cnpj"], "11222333000181")

    def test_accepts_alphanumeric_cnpj_with_punctuation_and_uppercases(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "AB.345.678/000B-72",
                "legal_name": "Alpha Numeric LTDA",
                "contact_email": "alpha@numeric.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["cnpj"], "AB345678000B72")

    def test_accepts_lowercase_alphanumeric_cnpj_and_uppercases(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "ab.345.678/000b-72",
                "legal_name": "Lower Alpha LTDA",
                "contact_email": "lower@alpha.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["cnpj"], "AB345678000B72")

    def test_rejects_cnpj_with_wrong_dv1(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-71",
                "legal_name": "Wrong DV1 LTDA",
                "contact_email": "dv1@wrong.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", response.data)
        self.assertEqual(Merchant.objects.count(), 0)

    def test_rejects_cnpj_with_wrong_dv2(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-80",
                "legal_name": "Wrong DV2 LTDA",
                "contact_email": "dv2@wrong.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", response.data)
        self.assertEqual(Merchant.objects.count(), 0)

    def test_rejects_short_cnpj(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "1122233300018",
                "legal_name": "Short CNPJ LTDA",
                "contact_email": "short@cnpj.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", response.data)

    def test_rejects_long_cnpj(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "112223330001811",
                "legal_name": "Long CNPJ LTDA",
                "contact_email": "long@cnpj.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", response.data)

    def test_rejects_cnpj_with_invalid_character(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-8!",
                "legal_name": "Invalid Char LTDA",
                "contact_email": "invalid@char.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", response.data)

    def test_rejects_cnpj_with_all_equal_characters(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "00000000000000",
                "legal_name": "All Zero LTDA",
                "contact_email": "zero@all.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", response.data)

    def test_rejects_cnpj_with_letter_in_dv_positions(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "AB345678000B7A",
                "legal_name": "Letter DV LTDA",
                "contact_email": "letter@dv.example",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", response.data)

    def test_patch_in_draft_updates_cnpj_and_normalizes(self):
        created = self.create_merchant()

        response = self.client.patch(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            {"cnpj": "AB.345.678/000B-72"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["cnpj"], "AB345678000B72")

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.cnpj, "AB345678000B72")

    def test_patch_with_own_cnpj_does_not_flag_duplicate(self):
        created = self.create_merchant()

        response = self.client.patch(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            {
                "cnpj": "11.222.333/0001-81",
                "trade_name": "Acme Trade",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["cnpj"], "11222333000181")
        self.assertEqual(response.data["trade_name"], "Acme Trade")

    def test_patch_in_draft_with_invalid_cnpj_returns_400(self):
        created = self.create_merchant()

        response = self.client.patch(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            {"cnpj": "11.222.333/0001-00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.cnpj, "11222333000181")


class MerchantPhoneValidationTests(MerchantApiTestCase):
    def test_post_with_empty_phone_returns_201_with_empty_phone(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Empty Phone LTDA",
                "contact_email": "empty@phone.example",
                "phone": "",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["phone"], "")

    def test_post_with_phone_10_digits_returns_201(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Ten Digits LTDA",
                "contact_email": "ten@digits.example",
                "phone": "1191234567",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["phone"], "1191234567")

    def test_post_with_phone_11_digits_returns_201(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Eleven Digits LTDA",
                "contact_email": "eleven@digits.example",
                "phone": "11991234567",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["phone"], "11991234567")

    def test_post_with_phone_containing_letters_returns_400(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Letters Phone LTDA",
                "contact_email": "letters@phone.example",
                "phone": "abcdefgh",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)
        self.assertEqual(Merchant.objects.count(), 0)

    def test_post_with_phone_with_punctuation_returns_400(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Punct Phone LTDA",
                "contact_email": "punct@phone.example",
                "phone": "(11) 91234-5678",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)
        self.assertEqual(Merchant.objects.count(), 0)

    def test_post_with_phone_9_digits_returns_400_too_short(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Short Phone LTDA",
                "contact_email": "short@phone.example",
                "phone": "123456789",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)
        self.assertEqual(Merchant.objects.count(), 0)

    def test_post_with_phone_12_digits_returns_400_too_long(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Long Phone LTDA",
                "contact_email": "long@phone.example",
                "phone": "123456789012",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)
        self.assertEqual(Merchant.objects.count(), 0)

    def test_post_with_phone_special_characters_returns_400(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Special Phone LTDA",
                "contact_email": "special@phone.example",
                "phone": "119123!4567@",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)
        self.assertEqual(Merchant.objects.count(), 0)

    def test_patch_in_draft_with_valid_phone_returns_200(self):
        created = self.create_merchant()

        valid_phones = ["1191234567", "11991234567"]
        for valid_phone in valid_phones:
            with self.subTest(phone=valid_phone):
                response = self.client.patch(
                    reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
                    {"phone": valid_phone},
                    format="json",
                )

                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["phone"], valid_phone)
                self.assertEqual(response.data["status"], "draft")

                merchant = Merchant.objects.get(pk=created.data["id"])
                self.assertEqual(merchant.phone, valid_phone)

    def test_patch_in_draft_with_empty_phone_clears_field(self):
        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Clear Phone LTDA",
                "contact_email": "clear@phone.example",
                "phone": "1191234567",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.patch(
            reverse("merchant-detail", kwargs={"pk": response.data["id"]}),
            {"phone": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["phone"], "")

        merchant = Merchant.objects.get(pk=response.data["id"])
        self.assertEqual(merchant.phone, "")

    def test_patch_in_draft_with_invalid_phone_returns_400(self):
        created = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "11.222.333/0001-81",
                "legal_name": "Invalid Patch Phone LTDA",
                "contact_email": "invalid@patch.example",
                "phone": "1191234567",
            },
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)

        response = self.client.patch(
            reverse("merchant-detail", kwargs={"pk": created.data["id"]}),
            {"phone": "abcdefghij"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)

        merchant = Merchant.objects.get(pk=created.data["id"])
        self.assertEqual(merchant.phone, "1191234567")


class ValidatorStructureTests(SimpleTestCase):
    def test_validators_are_separate_classes_with_validate_methods(self):
        from merchants.validators import CNPJValidator, PhoneValidator

        self.assertNotEqual(PhoneValidator, CNPJValidator)
        self.assertTrue(hasattr(CNPJValidator, "validate"))
        self.assertTrue(callable(getattr(CNPJValidator, "validate")))
        self.assertTrue(hasattr(PhoneValidator, "validate"))
        self.assertTrue(callable(getattr(PhoneValidator, "validate")))

    def test_cnpj_validator_returns_normalized_cnpj(self):
        from merchants.validators import CNPJValidator

        self.assertEqual(
            CNPJValidator.validate("11 222 333 0001 81"),
            "11222333000181",
        )
        self.assertEqual(
            CNPJValidator.validate("ab.345.678/000b-72"),
            "AB345678000B72",
        )

    def test_cnpj_validator_raises_validation_error_for_invalid_values(self):
        from merchants.validators import CNPJValidator

        invalid_cnpjs = [
            "",
            "1122233300018",
            "112223330001811",
            "11.222.333/0001-8!",
            "00000000000000",
            "AB345678000B7A",
            None,
        ]
        for invalid_cnpj in invalid_cnpjs:
            with self.subTest(cnpj=invalid_cnpj):
                with self.assertRaises(ValidationError):
                    CNPJValidator.validate(invalid_cnpj)

    def test_phone_validator_accepts_blank_10_and_11_digit_strings(self):
        from merchants.validators import PhoneValidator

        self.assertEqual(PhoneValidator.validate(""), "")
        self.assertEqual(PhoneValidator.validate("1191234567"), "1191234567")
        self.assertEqual(PhoneValidator.validate("11991234567"), "11991234567")

    def test_phone_validator_raises_validation_error_for_invalid_values(self):
        from merchants.validators import PhoneValidator

        invalid_phones = [
            "123456789",
            "123456789012",
            "abcdefghij",
            "(11) 91234-5678",
            "119123!4567@",
            None,
        ]
        for invalid_phone in invalid_phones:
            with self.subTest(phone=invalid_phone):
                with self.assertRaises(ValidationError):
                    PhoneValidator.validate(invalid_phone)
