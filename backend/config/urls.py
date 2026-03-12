"""
URL configuration for the Kenz SaaS backend.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.core.urls")),
    path("stripe/", include("djstripe.urls", namespace="djstripe")),
]
