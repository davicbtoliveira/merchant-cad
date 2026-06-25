from rest_framework import mixins, viewsets

from merchants.models import Merchant
from merchants.serializers import MerchantSerializer


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
