import uuid

from django.db import models


class AppSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        "stores.Store", on_delete=models.CASCADE, related_name="settings", db_index=True
    )
    key = models.CharField(max_length=255)
    value = models.TextField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["store", "key"], name="unique_store_setting_key"),
        ]
        ordering = ["key"]

    def __str__(self):
        return f"{self.key}={self.value}"


class TicketCounter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        "stores.Store", on_delete=models.CASCADE, related_name="ticket_counters", db_index=True
    )
    date = models.DateField()
    last_number = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["store", "date"], name="unique_store_ticket_date"),
        ]

    def __str__(self):
        return f"{self.date}: #{self.last_number}"
