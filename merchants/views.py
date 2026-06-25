from rest_framework import mixins, viewsets

from merchants.models import Merchant
from merchants.serializers import MerchantSerializer


class MerchantViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer

