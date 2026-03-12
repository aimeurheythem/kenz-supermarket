from django.apps import AppConfig


class CustomersConfig(AppConfig):
    default_auto_field = "django.db.models.UUIDField"
    name = "apps.customers"
