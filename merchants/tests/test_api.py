from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from merchants.models import Merchant, MerchantEvent
from merchants.services import (
    APPROVE_MERCHANT_MESSAGE,
    BLOCK_MERCHANT_MESSAGE,
    REJECT_MERCHANT_MESSAGE,
    REOPEN_MERCHANT_MESSAGE,
    SUBMIT_FOR_ANALYSIS_MESSAGE,
)


class MerchantApiTestCase(APITestCase):
    def create_merchant(
        self,
        *,
        cnpj="12.345.678/0001-90",
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
                "cnpj": "12.345.678/0001-90",
                "legal_name": "Acme Pagamentos LTDA",
                "trade_name": "Acme Pay",
                "contact_email": "ops@acme.example",
                "phone": "+55 11 99999-0000",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["cnpj"], "12345678000190")
        self.assertEqual(response.data["status"], "draft")
        self.assertEqual(response.data["legal_name"], "Acme Pagamentos LTDA")
        self.assertEqual(response.data["trade_name"], "Acme Pay")
        self.assertEqual(response.data["contact_email"], "ops@acme.example")
        self.assertEqual(response.data["phone"], "+55 11 99999-0000")
        self.assertIn("created_at", response.data)

        detail = self.client.get(
            reverse("merchant-detail", kwargs={"pk": response.data["id"]}),
            format="json",
        )

        self.assertEqual(detail.data["cnpj"], "12345678000190")
        self.assertEqual(detail.data["status"], "draft")

    def test_requires_cnpj_legal_name_and_contact_email(self):
        payload = {
            "cnpj": "12345678000190",
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
                "cnpj": "12345678000190",
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
                "cnpj": "12.345.678/0001-90",
                "legal_name": "Acme Pagamentos LTDA",
                "contact_email": "ops@acme.example",
            },
            format="json",
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "12345678000190",
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
                "cnpj": "12.345.678/0001-90",
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
        self.assertEqual(response.data["cnpj"], "12345678000190")
        self.assertEqual(response.data["legal_name"], "Acme Pagamentos LTDA")
        self.assertEqual(response.data["contact_email"], "ops@acme.example")
        self.assertEqual(response.data["status"], "draft")

    def test_lists_merchants_without_embedded_timeline(self):
        first = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "12.345.678/0001-90",
                "legal_name": "Acme Pagamentos LTDA",
                "contact_email": "ops@acme.example",
            },
            format="json",
        )
        second = self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "98.765.432/0001-10",
                "legal_name": "Beta Comercio LTDA",
                "contact_email": "ops@beta.example",
            },
            format="json",
        )

        response = self.client.get(reverse("merchant-list"), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [merchant["id"] for merchant in response.data],
            [first.data["id"], second.data["id"]],
        )

        for merchant in response.data:
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

    def test_filters_merchants_by_status(self):
        for index, merchant_status in enumerate(Merchant.Status.values, start=1):
            Merchant.objects.create(
                cnpj=f"1234567800019{index}",
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
                self.assertEqual(len(response.data), 1)
                self.assertEqual(response.data[0]["status"], merchant_status)
                self.assertEqual(
                    response.data[0]["legal_name"],
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
                "phone": "+55 11 98888-7777",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["legal_name"], "Acme Solucoes Financeiras LTDA")
        self.assertEqual(response.data["trade_name"], "Acme Solucoes")
        self.assertEqual(response.data["contact_email"], "analise@acme.example")
        self.assertEqual(response.data["phone"], "+55 11 98888-7777")
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
            cnpj="98.765.432/0001-10",
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
            message="Merchant de outro cadastro",
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
            {"reason": "Merchant regularizou documentação"},
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
                REOPEN_MERCHANT_MESSAGE.format("Merchant regularizou documentação"),
            ],
        )

    def test_does_not_alter_registration_data_on_reopen(self):
        created = self.create_merchant(
            cnpj="98.765.432/0001-10",
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
        self.assertEqual(response.data["cnpj"], "98765432000110")

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
