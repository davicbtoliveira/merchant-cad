from rest_framework.routers import SimpleRouter

from merchants.views import MerchantViewSet

router = SimpleRouter()
router.register("merchants", MerchantViewSet, basename="merchant")

urlpatterns = router.urls

