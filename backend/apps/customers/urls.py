from rest_framework.routers import DefaultRouter

from .views import CustomerTransactionViewSet, CustomerViewSet

router = DefaultRouter()
router.register("customers", CustomerViewSet)
router.register("customer-transactions", CustomerTransactionViewSet)

urlpatterns = router.urls
