import uuid

from django.conf import settings
from django.db import models


class Store(models.Model):
    """Tenant root entity. Every other entity belongs to exactly one store."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_stores",
        null=True,
        blank=True,
    )
    currency = models.CharField(max_length=10, default="DZD")
    timezone = models.CharField(max_length=50, default="Africa/Algiers")
    phone = models.CharField(max_length=20, blank=True, default="")
    email = models.EmailField(max_length=255, blank=True, default="")
    address = models.TextField(blank=True, default="")
    logo_url = models.CharField(max_length=500, blank=True, default="")
    is_active = models.BooleanField(default=True)
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
