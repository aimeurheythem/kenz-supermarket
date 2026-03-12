from django.db import models

from apps.core.models import TenantModel


class StockMovement(TenantModel):
    product = models.ForeignKey(
        "inventory.Product", on_delete=models.CASCADE, related_name="stock_movements"
    )
    type = models.CharField(max_length=50)  # purchase, sale, adjustment, return
    quantity = models.IntegerField()
    previous_stock = models.IntegerField()
    new_stock = models.IntegerField()
    reason = models.TextField(blank=True, default="")
    reference_id = models.UUIDField(null=True, blank=True)
    reference_type = models.CharField(max_length=50, blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["store", "product"]),
        ]
        ordering = ["-created_at"]
