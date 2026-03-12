from rest_framework.routers import DefaultRouter

from .views import PurchaseOrderViewSet, SupplierViewSet

router = DefaultRouter()
router.register("suppliers", SupplierViewSet)
router.register("purchase-orders", PurchaseOrderViewSet)

urlpatterns = router.urls
