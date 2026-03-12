from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id", "store_id", "user_id", "user_name", "action", "entity",
            "entity_id", "details", "old_value", "new_value", "ip_address",
            "created_at",
        ]
