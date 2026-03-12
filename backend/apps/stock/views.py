from django.db import transaction
from rest_framework import status as http_status
from rest_framework.response import Response

from apps.core.mixins import AuditLogMixin
from apps.core.views import TenantViewSet
from apps.inventory.models import Product

from .models import StockMovement
from .serializers import StockMovementSerializer


class StockMovementViewSet(AuditLogMixin, TenantViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    filterset_fields = ["product_id", "type"]
    ordering_fields = ["created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }

    @transaction.atomic
    def perform_create(self, serializer):
        product = Product.objects.select_for_update().get(
            id=serializer.validated_data["product"].id,
            store_id=self.request.store_id,
        )
        previous_stock = product.stock_quantity
        new_stock = previous_stock + serializer.validated_data["quantity"]
        product.stock_quantity = new_stock
        product.save(update_fields=["stock_quantity", "updated_at"])
        instance = serializer.save(
            store_id=self.request.store_id,
            previous_stock=previous_stock,
            new_stock=new_stock,
        )
        self._log_action("create", instance)
