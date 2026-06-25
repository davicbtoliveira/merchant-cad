from django.db import transaction

from merchants.models import Merchant, MerchantEvent


SUBMIT_FOR_ANALYSIS_MESSAGE = "Merchant enviado para análise"
APPROVE_MERCHANT_MESSAGE = "Merchant aprovado"


class BusinessRuleViolation(Exception):
    def __init__(self, detail):
        self.detail = detail
        super().__init__("Business rule violation")


def ensure_can_update_registration_data(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.DRAFT:
        raise BusinessRuleViolation(
            {
                "status": (
                    "Merchant registration data can only be updated while in draft."
                )
            }
        )


@transaction.atomic
def submit_for_analysis(merchant: Merchant) -> Merchant:
    if merchant.status != Merchant.Status.DRAFT:
        raise BusinessRuleViolation(
            {"status": "Merchant can only be submitted for analysis from draft."}
        )

    merchant.status = Merchant.Status.PENDING_ANALYSIS
    merchant.save(update_fields=["status"])
    MerchantEvent.objects.create(
        merchant=merchant,
        message=SUBMIT_FOR_ANALYSIS_MESSAGE,
    )

    return merchant


@transaction.atomic
def approve_merchant(merchant: Merchant) -> Merchant:
    if merchant.status != Merchant.Status.PENDING_ANALYSIS:
        raise BusinessRuleViolation(
            {"status": "Merchant can only be approved from pending_analysis."}
        )

    merchant.status = Merchant.Status.APPROVED
    merchant.save(update_fields=["status"])
    MerchantEvent.objects.create(
        merchant=merchant,
        message=APPROVE_MERCHANT_MESSAGE,
    )

    return merchant
