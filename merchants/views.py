from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from merchants import services
from merchants.models import Merchant
from merchants.serializers import MerchantEventSerializer, MerchantSerializer


class MerchantViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        status = self.request.query_params.get("status")
        if self.action == "list" and status:
            queryset = queryset.filter(status=status)

        return queryset

    def partial_update(self, request, *args, **kwargs):
        merchant = self.get_object()
        self._enforce_business_rule(
            services.ensure_can_update_registration_data,
            merchant,
        )
        serializer = self.get_serializer(merchant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="submit-for-analysis")
    def submit_for_analysis(self, request, pk=None):
        merchant = self._enforce_business_rule(
            services.submit_for_analysis,
            self.get_object(),
        )
        serializer = self.get_serializer(merchant)

        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        merchant = self.get_object()
        serializer = MerchantEventSerializer(merchant.events.all(), many=True)

        return Response(serializer.data)

    def _enforce_business_rule(self, function, *args, **kwargs):
        try:
            return function(*args, **kwargs)
        except services.BusinessRuleViolation as error:
            raise ValidationError(error.detail) from error
