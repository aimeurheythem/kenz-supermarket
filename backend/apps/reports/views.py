from datetime import timedelta

from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import RoleBasedPermission, StoreIsolationPermission
from apps.expenses.models import Expense
from apps.inventory.models import Product
from apps.sales.models import PaymentEntry, Sale, SaleItem


class SalesSummaryView(APIView):
    """GET /reports/sales-summary/ — daily/weekly/monthly aggregation."""

    permission_classes = [RoleBasedPermission, StoreIsolationPermission]
    role_permissions = {"GET": ["owner", "manager"]}

    def get(self, request):
        store_id = request.store_id
        period = request.query_params.get("period", "daily")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        qs = Sale.objects.filter(store_id=store_id, status=Sale.Status.COMPLETED)
        if date_from:
            qs = qs.filter(sale_date__gte=date_from)
        if date_to:
            qs = qs.filter(sale_date__lte=date_to)

        trunc_fn = {"daily": TruncDate, "weekly": TruncWeek, "monthly": TruncMonth}.get(
            period, TruncDate
        )

        summary = (
            qs.annotate(period=trunc_fn("sale_date"))
            .values("period")
            .annotate(
                total_sales=Count("id"),
                total_revenue=Sum("total"),
                total_discount=Sum("discount_amount"),
            )
            .order_by("period")
        )

        totals = qs.aggregate(
            total_sales=Count("id"),
            total_revenue=Sum("total"),
            total_discount=Sum("discount_amount"),
        )

        return Response({"period": period, "data": list(summary), "totals": totals})


class TopProductsView(APIView):
    """GET /reports/top-products/"""

    permission_classes = [RoleBasedPermission, StoreIsolationPermission]
    role_permissions = {"GET": ["owner", "manager"]}

    def get(self, request):
        store_id = request.store_id
        limit = int(request.query_params.get("limit", 10))
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        qs = SaleItem.objects.filter(
            store_id=store_id, sale__status=Sale.Status.COMPLETED
        )
        if date_from:
            qs = qs.filter(sale__sale_date__gte=date_from)
        if date_to:
            qs = qs.filter(sale__sale_date__lte=date_to)

        top = (
            qs.values("product_id", "product_name")
            .annotate(
                total_quantity=Sum("quantity"),
                total_revenue=Sum("total"),
            )
            .order_by("-total_revenue")[:limit]
        )

        return Response({"results": list(top)})


class StockAlertsView(APIView):
    """GET /reports/stock-alerts/ — products below reorder level."""

    permission_classes = [RoleBasedPermission, StoreIsolationPermission]
    role_permissions = {"GET": ["owner", "manager"]}

    def get(self, request):
        store_id = request.store_id
        alerts = Product.objects.filter(
            store_id=store_id,
            is_active=True,
            stock_quantity__lte=F("reorder_level"),
        ).values(
            "id", "name", "barcode", "stock_quantity", "reorder_level"
        ).order_by("stock_quantity")

        return Response({"results": list(alerts)})


class CashierPerformanceView(APIView):
    """GET /reports/cashier-performance/"""

    permission_classes = [RoleBasedPermission, StoreIsolationPermission]
    role_permissions = {"GET": ["owner", "manager"]}

    def get(self, request):
        store_id = request.store_id
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        qs = Sale.objects.filter(store_id=store_id, status=Sale.Status.COMPLETED)
        if date_from:
            qs = qs.filter(sale_date__gte=date_from)
        if date_to:
            qs = qs.filter(sale_date__lte=date_to)

        performance = (
            qs.values("user_id", user_name=F("user__full_name"))
            .annotate(
                total_sales=Count("id"),
                total_revenue=Sum("total"),
            )
            .order_by("-total_revenue")
        )

        return Response({"results": list(performance)})


class ExpenseSummaryView(APIView):
    """GET /reports/expense-summary/"""

    permission_classes = [RoleBasedPermission, StoreIsolationPermission]
    role_permissions = {"GET": ["owner", "manager"]}

    def get(self, request):
        store_id = request.store_id
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        qs = Expense.objects.filter(store_id=store_id)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        by_category = (
            qs.values("category")
            .annotate(
                count=Count("id"),
                total_amount=Sum("amount"),
            )
            .order_by("-total_amount")
        )

        totals = qs.aggregate(
            total_expenses=Count("id"),
            total_amount=Sum("amount"),
        )

        return Response({"data": list(by_category), "totals": totals})
