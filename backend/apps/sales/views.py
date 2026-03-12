from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.mixins import AuditLogMixin
from apps.core.views import TenantViewSet

from .models import CashierSession, PaymentEntry, Sale, SaleItem
from .serializers import (
    CashierSessionSerializer,
    CloseSessionSerializer,
    ReturnSaleSerializer,
    SaleCreateSerializer,
    SaleSerializer,
    VoidSaleSerializer,
)


class SaleViewSet(AuditLogMixin, TenantViewSet):
    queryset = Sale.objects.prefetch_related("items", "payments").all()
    serializer_class = SaleSerializer
    filterset_fields = ["user_id", "session_id", "customer_id", "status"]
    ordering_fields = ["sale_date", "total", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager", "cashier"],
    }

    def get_serializer_class(self):
        if self.action == "create":
            return SaleCreateSerializer
        return SaleSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            sale = serializer.save(
                store_id=self.request.store_id,
                user_id=self.request.user.id,
            )
            # Deduct stock for each item
            for item in sale.items.all():
                product = item.product
                product.stock_quantity -= item.quantity
                product.save(update_fields=["stock_quantity"])

    @action(detail=True, methods=["post"], url_path="void")
    def void_sale(self, request, pk=None):
        sale = self.get_object()
        if sale.status != Sale.Status.COMPLETED:
            return Response(
                {"detail": "Only completed sales can be voided.", "code": "invalid_status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VoidSaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Restore stock
            for item in sale.items.all():
                product = item.product
                product.stock_quantity += item.quantity
                product.save(update_fields=["stock_quantity"])

            sale.status = Sale.Status.VOIDED
            sale.save(update_fields=["status", "updated_at"])

        return Response(SaleSerializer(sale).data)

    void_sale.role_permissions = {"POST": ["owner", "manager"]}

    @action(detail=True, methods=["post"], url_path="return")
    def return_sale(self, request, pk=None):
        sale = self.get_object()
        if sale.status != Sale.Status.COMPLETED:
            return Response(
                {"detail": "Only completed sales can be returned.", "code": "invalid_status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReturnSaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            return_type = serializer.validated_data["return_type"]
            items_to_return = serializer.validated_data.get("items", [])

            if return_type == "full":
                items_to_return = [
                    {"sale_item_id": str(item.id), "quantity": item.quantity}
                    for item in sale.items.all()
                ]

            return_total = Decimal("0")
            return_items = []
            for ri in items_to_return:
                original_item = SaleItem.objects.get(id=ri["sale_item_id"], sale=sale)
                qty = ri["quantity"]
                item_total = original_item.unit_price * qty
                return_total += item_total

                return_items.append(
                    SaleItem(
                        store_id=sale.store_id,
                        product=original_item.product,
                        product_name=original_item.product_name,
                        quantity=qty,
                        unit_price=original_item.unit_price,
                        total=item_total,
                    )
                )

                # Restore stock
                product = original_item.product
                product.stock_quantity += qty
                product.save(update_fields=["stock_quantity"])

            return_sale = Sale.objects.create(
                store_id=sale.store_id,
                user_id=request.user.id,
                session_id=sale.session_id,
                customer_id=sale.customer_id,
                customer_name=sale.customer_name,
                total=-return_total,
                subtotal=-return_total,
                status=Sale.Status.RETURNED,
                original_sale=sale,
                return_type=return_type,
            )
            for ri in return_items:
                ri.sale = return_sale
            SaleItem.objects.bulk_create(return_items)

            PaymentEntry.objects.create(
                store_id=sale.store_id,
                sale=return_sale,
                method=PaymentEntry.Method.CASH,
                amount=-return_total,
            )

            if return_type == "full":
                sale.status = Sale.Status.RETURNED
                sale.save(update_fields=["status", "updated_at"])

        return Response(SaleSerializer(return_sale).data, status=status.HTTP_201_CREATED)

    return_sale.role_permissions = {"POST": ["owner", "manager"]}


class CashierSessionViewSet(AuditLogMixin, TenantViewSet):
    queryset = CashierSession.objects.all()
    serializer_class = CashierSessionSerializer
    filterset_fields = ["cashier_id", "status"]
    ordering_fields = ["login_time", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager", "cashier"],
    }

    def perform_create(self, serializer):
        serializer.save(store_id=self.request.store_id, cashier_id=self.request.user.id)

    @action(detail=True, methods=["patch"], url_path="close")
    def close_session(self, request, pk=None):
        session = self.get_object()
        if session.status != CashierSession.Status.ACTIVE:
            return Response(
                {"detail": "Only active sessions can be closed.", "code": "invalid_status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CloseSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        closing_cash = serializer.validated_data["closing_cash"]
        # Calculate expected cash from session sales
        session_sales = Sale.objects.filter(
            session=session, status=Sale.Status.COMPLETED
        )
        cash_total = Decimal("0")
        for sale in session_sales:
            cash_payments = sale.payments.filter(method=PaymentEntry.Method.CASH)
            for p in cash_payments:
                cash_total += p.amount - p.change_amount

        expected = session.opening_cash + cash_total

        session.closing_cash = closing_cash
        session.expected_cash = expected
        session.cash_difference = closing_cash - expected
        session.status = CashierSession.Status.CLOSED
        session.logout_time = timezone.now()
        session.notes = serializer.validated_data.get("notes", "")
        session.save()

        return Response(CashierSessionSerializer(session).data)
