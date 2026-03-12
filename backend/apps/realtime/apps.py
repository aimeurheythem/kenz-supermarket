from django.apps import AppConfig


class RealtimeConfig(AppConfig):
    default_auto_field = "django.db.models.UUIDField"
    name = "apps.realtime"

    def ready(self):
        from apps.realtime.signals import register_broadcast_models
        register_broadcast_models()
