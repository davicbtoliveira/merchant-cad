from django.db import models


class Merchant(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_ANALYSIS = "pending_analysis", "Pending analysis"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        BLOCKED = "blocked", "Blocked"

    cnpj = models.CharField(max_length=14, unique=True)
    legal_name = models.CharField(max_length=255)
    trade_name = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.DRAFT,
        editable=False,
    )

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return self.legal_name


class MerchantEvent(models.Model):
    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="events",
    )
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self) -> str:
        return self.message
