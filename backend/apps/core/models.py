import uuid

from django.db import models


class TenantModel(models.Model):
    """Abstract base class for all store-scoped entities.

    Provides UUID v4 primary key, store_id FK, and timestamp fields.
    All entity models should inherit from this.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
