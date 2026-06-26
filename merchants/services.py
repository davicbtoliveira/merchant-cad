from django.db import transaction

from merchants.exceptions import BusinessRuleViolation
from merchants.models import Merchant, MerchantEvent

SUBMIT_FOR_ANALYSIS_MESSAGE = "Merchant enviado para análise"
APPROVE_MERCHANT_MESSAGE = "Merchant aprovado"
REJECT_MERCHANT_MESSAGE = "Merchant rejeitado: {}"
BLOCK_MERCHANT_MESSAGE = "Merchant bloqueado: {}"


def ensure_can_update_registration_data(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.DRAFT:
        raise BusinessRuleViolation(
            {
                "status": (
                    "Merchant registration data can only be updated while in draft."
                )
            }
        )


def ensure_can_submit_for_analysis(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.DRAFT:
        raise BusinessRuleViolation(
            {"status": "Merchant can only be submitted for analysis from draft."}
        )


def ensure_can_approve_merchant(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.PENDING_ANALYSIS:
        raise BusinessRuleViolation(
            {"status": "Merchant can only be approved from pending_analysis."}
        )


@transaction.atomic
def submit_for_analysis(merchant: Merchant) -> Merchant:
    ensure_can_submit_for_analysis(merchant)

    merchant.status = Merchant.Status.PENDING_ANALYSIS
    merchant.save(update_fields=["status"])
    MerchantEvent.objects.create(
        merchant=merchant,
        message=SUBMIT_FOR_ANALYSIS_MESSAGE,
    )

    return merchant


@transaction.atomic
def approve_merchant(merchant: Merchant) -> Merchant:
    ensure_can_approve_merchant(merchant)

    merchant.status = Merchant.Status.APPROVED
    merchant.save(update_fields=["status"])
    MerchantEvent.objects.create(
        merchant=merchant,
        message=APPROVE_MERCHANT_MESSAGE,
    )

    return merchant


def ensure_can_reject_merchant(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.PENDING_ANALYSIS:
        raise BusinessRuleViolation(
            {"status": "Merchant can only be rejected from pending_analysis."}
        )


@transaction.atomic
def reject_merchant(merchant: Merchant, reason: str) -> Merchant:
    ensure_can_reject_merchant(merchant)

    merchant.status = Merchant.Status.REJECTED
    merchant.save(update_fields=["status"])
    MerchantEvent.objects.create(
        merchant=merchant,
        message=REJECT_MERCHANT_MESSAGE.format(reason),
    )

    return merchant


def ensure_can_block_merchant(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.APPROVED:
        raise BusinessRuleViolation(
            {"status": "Merchant can only be blocked from approved."}
        )


@transaction.atomic
def block_merchant(merchant: Merchant, reason: str) -> Merchant:
    ensure_can_block_merchant(merchant)

    merchant.status = Merchant.Status.BLOCKED
    merchant.save(update_fields=["status"])
    MerchantEvent.objects.create(
        merchant=merchant,
        message=BLOCK_MERCHANT_MESSAGE.format(reason),
    )

    return merchant
