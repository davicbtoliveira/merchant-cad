from django.db import transaction

from merchants.exceptions import BusinessRuleViolation
from merchants.models import Merchant, MerchantEvent

SUBMIT_FOR_ANALYSIS_MESSAGE = "Merchant enviado para análise"
APPROVE_MERCHANT_MESSAGE = "Merchant aprovado"
REJECT_MERCHANT_MESSAGE = "Merchant rejeitado: {}"
BLOCK_MERCHANT_MESSAGE = "Merchant bloqueado: {}"
REOPEN_MERCHANT_MESSAGE = "Merchant reaberto: {}"
UNBLOCK_MERCHANT_MESSAGE = "Merchant desbloqueado: {}"


def ensure_can_update_registration_data(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.DRAFT:
        raise BusinessRuleViolation(
            {
                "status": (
                    "Dados cadastrais só podem ser atualizados enquanto o merchant "
                    "estiver em rascunho."
                )
            }
        )


def ensure_can_submit_for_analysis(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.DRAFT:
        raise BusinessRuleViolation(
            {
                "status": (
                    "Merchant só pode ser enviado para análise a partir de rascunho."
                )
            }
        )


def ensure_can_approve_merchant(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.PENDING_ANALYSIS:
        raise BusinessRuleViolation(
            {"status": "Merchant só pode ser aprovado quando estiver em análise."}
        )


@transaction.atomic
def submit_for_analysis(merchant: Merchant) -> Merchant:
    merchant = Merchant.objects.select_for_update().get(pk=merchant.pk)
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
    merchant = Merchant.objects.select_for_update().get(pk=merchant.pk)
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
            {"status": "Merchant só pode ser rejeitado quando estiver em análise."}
        )


@transaction.atomic
def reject_merchant(merchant: Merchant, reason: str) -> Merchant:
    merchant = Merchant.objects.select_for_update().get(pk=merchant.pk)
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
            {"status": "Merchant só pode ser bloqueado quando estiver aprovado."}
        )


@transaction.atomic
def block_merchant(merchant: Merchant, reason: str) -> Merchant:
    merchant = Merchant.objects.select_for_update().get(pk=merchant.pk)
    ensure_can_block_merchant(merchant)

    merchant.status = Merchant.Status.BLOCKED
    merchant.save(update_fields=["status"])
    MerchantEvent.objects.create(
        merchant=merchant,
        message=BLOCK_MERCHANT_MESSAGE.format(reason),
    )

    return merchant


def ensure_can_reopen_merchant(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.REJECTED:
        raise BusinessRuleViolation(
            {"status": "Merchant só pode ser reaberto quando estiver rejeitado."}
        )


@transaction.atomic
def reopen_merchant(merchant: Merchant, reason: str) -> Merchant:
    merchant = Merchant.objects.select_for_update().get(pk=merchant.pk)
    ensure_can_reopen_merchant(merchant)

    merchant.status = Merchant.Status.DRAFT
    merchant.save(update_fields=["status"])
    MerchantEvent.objects.create(
        merchant=merchant,
        message=REOPEN_MERCHANT_MESSAGE.format(reason),
    )

    return merchant


def ensure_can_unblock_merchant(merchant: Merchant) -> None:
    if merchant.status != Merchant.Status.BLOCKED:
        raise BusinessRuleViolation(
            {"status": "Merchant só pode ser desbloqueado quando estiver bloqueado."}
        )


@transaction.atomic
def unblock_merchant(merchant: Merchant, reason: str) -> Merchant:
    merchant = Merchant.objects.select_for_update().get(pk=merchant.pk)
    ensure_can_unblock_merchant(merchant)

    merchant.status = Merchant.Status.APPROVED
    merchant.save(update_fields=["status"])
    MerchantEvent.objects.create(
        merchant=merchant,
        message=UNBLOCK_MERCHANT_MESSAGE.format(reason),
    )

    return merchant
