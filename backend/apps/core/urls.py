"""
Core URL router — includes all app API URLs under /api/v1/.
"""

from django.urls import include, path

urlpatterns = [
    # Auth
    path("auth/", include("apps.accounts.urls")),
    # Store
    path("", include("apps.stores.urls")),
    # Entity CRUD endpoints
    path("", include("apps.inventory.urls")),
    path("", include("apps.stock.urls")),
    path("", include("apps.purchasing.urls")),
    path("", include("apps.customers.urls")),
    path("", include("apps.sales.urls")),
    path("", include("apps.expenses.urls")),
    path("", include("apps.promotions.urls")),
    path("", include("apps.audit.urls")),
    path("", include("apps.settings_app.urls")),
    path("", include("apps.reports.urls")),
]
