from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.mixins import AuditLogMixin
from apps.core.views import TenantViewSet

from .models import Category, POSQuickAccess, Product, ProductBatch
from .serializers import (
    CategorySerializer,
    POSQuickAccessSerializer,
    ProductBatchSerializer,
    ProductSerializer,
)


class CategoryViewSet(AuditLogMixin, TenantViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }


class ProductViewSet(AuditLogMixin, TenantViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    search_fields = ["name", "barcode"]
    filterset_fields = ["category_id", "is_active"]
    ordering_fields = ["name", "selling_price", "stock_quantity", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }

    @action(detail=False, methods=["get"], url_path="by-barcode/(?P<barcode>[^/]+)")
    def by_barcode(self, request, barcode=None):
        product = self.get_queryset().filter(barcode=barcode).first()
        if not product:
            return Response({"detail": "Product not found", "code": "not_found"}, status=404)
        return Response(self.get_serializer(product).data)


class ProductBatchViewSet(AuditLogMixin, TenantViewSet):
    queryset = ProductBatch.objects.all()
    serializer_class = ProductBatchSerializer
    filterset_fields = ["product_id"]
    ordering_fields = ["expiration_date", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }


class POSQuickAccessViewSet(AuditLogMixin, TenantViewSet):
    queryset = POSQuickAccess.objects.all()
    serializer_class = POSQuickAccessSerializer
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }
