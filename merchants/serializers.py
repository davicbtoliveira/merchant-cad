from rest_framework import serializers

from merchants.models import Merchant, MerchantEvent
from merchants.validators import CNPJValidator, PhoneValidator


class MerchantSerializer(serializers.ModelSerializer):
    cnpj = serializers.CharField(validators=[])

    class Meta:
        model = Merchant
        fields = [
            "id",
            "cnpj",
            "legal_name",
            "trade_name",
            "contact_email",
            "phone",
            "created_at",
            "status",
        ]
        read_only_fields = ["id", "created_at", "status"]

    def validate_cnpj(self, value: str) -> str:
        normalized_cnpj = CNPJValidator.validate(value)

        merchants = Merchant.objects.filter(cnpj=normalized_cnpj)
        if self.instance is not None:
            merchants = merchants.exclude(pk=self.instance.pk)

        if merchants.exists():
            raise serializers.ValidationError("Merchant with this CNPJ already exists.")

        return normalized_cnpj

    def validate_phone(self, value: str) -> str:
        return PhoneValidator.validate(value)


class MerchantEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantEvent
        fields = ["id", "message", "created_at"]
        read_only_fields = fields


class MerchantRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=200, allow_blank=False, allow_null=False)
