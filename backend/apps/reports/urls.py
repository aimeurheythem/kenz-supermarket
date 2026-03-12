from django.urls import path

from .views import (
    CashierPerformanceView,
    ExpenseSummaryView,
    SalesSummaryView,
    StockAlertsView,
    TopProductsView,
)

urlpatterns = [
    path("reports/sales-summary/", SalesSummaryView.as_view(), name="sales-summary"),
    path("reports/top-products/", TopProductsView.as_view(), name="top-products"),
    path("reports/stock-alerts/", StockAlertsView.as_view(), name="stock-alerts"),
    path("reports/cashier-performance/", CashierPerformanceView.as_view(), name="cashier-performance"),
    path("reports/expense-summary/", ExpenseSummaryView.as_view(), name="expense-summary"),
]
