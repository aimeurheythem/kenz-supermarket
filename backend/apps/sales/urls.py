from rest_framework.routers import DefaultRouter

from .views import CashierSessionViewSet, SaleViewSet

router = DefaultRouter()
router.register("sales", SaleViewSet)
router.register("cashier-sessions", CashierSessionViewSet)

urlpatterns = router.urls
