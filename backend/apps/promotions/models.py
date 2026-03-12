from django.db import models

from apps.core.models import TenantModel


class Promotion(TenantModel):
    class Type(models.TextChoices):
        PRICE_DISCOUNT = "price_discount", "Price Discount"
        QUANTITY_DISCOUNT = "quantity_discount", "Quantity Discount"
        PACK_DISCOUNT = "pack_discount", "Pack Discount"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    config = models.JSONField(default=dict)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["store", "type"]),
            models.Index(fields=["store", "status"]),
            models.Index(fields=["store", "start_date", "end_date"]),
            models.Index(fields=["store", "deleted_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class PromotionProduct(TenantModel):
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, related_name="products")
    product = models.ForeignKey("inventory.Product", on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["store", "promotion", "product"],
                name="unique_store_promotion_product",
            ),
        ]
