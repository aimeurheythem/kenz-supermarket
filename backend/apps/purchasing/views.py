from django.db import transaction
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.mixins import AuditLogMixin
from apps.core.views import TenantViewSet

from .models import PurchaseOrder, PurchaseOrderItem, Supplier
from .serializers import (
    PurchaseOrderSerializer,
    ReceiveItemSerializer,
    SupplierSerializer,
)


class SupplierViewSet(AuditLogMixin, TenantViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    search_fields = ["name", "contact_person", "phone", "email"]
    filterset_fields = ["is_active"]
    ordering_fields = ["name", "balance", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }


class PurchaseOrderViewSet(AuditLogMixin, TenantViewSet):
    queryset = PurchaseOrder.objects.prefetch_related("items").all()
    serializer_class = PurchaseOrderSerializer
    filterset_fields = ["supplier_id", "status"]
    ordering_fields = ["order_date", "total_amount", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }

    @action(detail=True, methods=["patch"], url_path="receive")
    def receive(self, request, pk=None):
        order = self.get_object()
        if order.status != PurchaseOrder.Status.PENDING:
            return Response(
                {"detail": "Only pending orders can be received.", "code": "invalid_status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReceiveItemSerializer(data=request.data.get("items", []), many=True)
        serializer.is_valid(raise_exception=True)

        items_map = {str(item["id"]): item["received_quantity"] for item in serializer.validated_data}

        with transaction.atomic():
            for item in order.items.select_for_update():
                received_qty = items_map.get(str(item.id))
                if received_qty is not None:
                    item.received_quantity = received_qty
                    item.save(update_fields=["received_quantity"])

                    # Update product stock
                    product = item.product
                    product.stock_quantity += received_qty
                    product.save(update_fields=["stock_quantity"])

            order.status = PurchaseOrder.Status.RECEIVED
            order.save(update_fields=["status", "updated_at"])

        return Response(self.get_serializer(order).data)
