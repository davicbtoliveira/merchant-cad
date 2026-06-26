from rest_framework import serializers

from merchants.models import Merchant, MerchantEvent
from merchants.validators import CNPJValidator


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
        normalized_cnpj = CNPJValidator.normalize(value)
        if not normalized_cnpj:
            raise serializers.ValidationError("This field may not be blank.")

        if not CNPJValidator.validate(normalized_cnpj):
            raise serializers.ValidationError("Invalid CNPJ.")

        merchants = Merchant.objects.filter(cnpj=normalized_cnpj)
        if self.instance is not None:
            merchants = merchants.exclude(pk=self.instance.pk)

        if merchants.exists():
            raise serializers.ValidationError("Merchant with this CNPJ already exists.")

        return normalized_cnpj


class MerchantEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantEvent
        fields = ["id", "message", "created_at"]
        read_only_fields = fields


class MerchantRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(allow_blank=False, allow_null=False)
