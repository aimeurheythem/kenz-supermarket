from django.urls import path

from . import views

urlpatterns = [
    path("auth/register/", views.StoreRegistrationView.as_view(), name="store_register"),
    path("auth/verify-email/", views.VerifyEmailView.as_view(), name="verify_email"),
    path("store/", views.StoreDetailView.as_view(), name="store_detail"),
    path("store/export/", views.StoreExportView.as_view(), name="store_export"),
    path("store/export/<uuid:export_id>/", views.StoreExportView.as_view(), name="store_export_detail"),
    path("store/delete/", views.StoreDeleteView.as_view(), name="store_delete"),
]
