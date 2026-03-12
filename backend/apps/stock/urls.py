from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("stock-movements", views.StockMovementViewSet, basename="stock-movement")

urlpatterns = [
    path("", include(router.urls)),
]
