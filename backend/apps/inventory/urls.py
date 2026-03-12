from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("products", views.ProductViewSet, basename="product")
router.register("product-batches", views.ProductBatchViewSet, basename="product-batch")
router.register("pos-quick-access", views.POSQuickAccessViewSet, basename="pos-quick-access")

urlpatterns = [
    path("", include(router.urls)),
]
