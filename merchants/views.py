from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from merchants import services
from merchants.models import Merchant
from merchants.serializers import (
    MerchantEventSerializer,
    MerchantRejectSerializer,
    MerchantSerializer,
)


class MerchantViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        status_filter = self.request.query_params.get("status")
        if self.action == "list" and status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def partial_update(self, request, *args, **kwargs):
        merchant = self.get_object()
        services.ensure_can_update_registration_data(merchant)
        serializer = self.get_serializer(merchant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="submit-for-analysis")
    def submit_for_analysis(self, request, *args, **kwargs):
        merchant = services.submit_for_analysis(self.get_object())
        serializer = self.get_serializer(merchant)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def approve(self, request, *args, **kwargs):
        merchant = services.approve_merchant(self.get_object())
        serializer = self.get_serializer(merchant)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, *args, **kwargs):
        serializer = MerchantRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        merchant = services.reject_merchant(
            self.get_object(),
            reason=serializer.validated_data["reason"],
        )
        response_serializer = self.get_serializer(merchant)

        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def block(self, request, *args, **kwargs):
        serializer = MerchantRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        merchant = services.block_merchant(
            self.get_object(),
            reason=serializer.validated_data["reason"],
        )
        response_serializer = self.get_serializer(merchant)

        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def timeline(self, request, *args, **kwargs):
        merchant = self.get_object()
        serializer = MerchantEventSerializer(merchant.events.all(), many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
