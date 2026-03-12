import uuid

from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Immutable action log. Append-only — no update or delete operations."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="audit_logs",
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    user_name = models.CharField(max_length=255, blank=True, default="")
    action = models.CharField(max_length=100)  # create, update, delete, read_pii
    entity = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100, blank=True, default="")
    details = models.TextField(blank=True, default="")
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["store", "entity", "created_at"]),
            models.Index(fields=["store", "user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.action} {self.entity} by {self.user_name}"
