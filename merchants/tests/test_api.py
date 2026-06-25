from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class MerchantApiTests(APITestCase):
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
        self.client.post(
            reverse("merchant-list"),
            {
                "cnpj": "12.345.678/0001-90",
                "legal_name": "Acme Pagamentos LTDA",
                "contact_email": "ops@acme.example",
            },
            format="json",
        )

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
