from django.db import models

from apps.core.models import TenantModel


class Category(TenantModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    color = models.CharField(max_length=20, default="#6366f1")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["store", "name"], name="unique_store_category_name"),
        ]
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(TenantModel):
    barcode = models.CharField(max_length=255, blank=True, default="")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_quantity = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)
    unit = models.CharField(max_length=50, default="piece")
    image_url = models.CharField(max_length=500, blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["store", "barcode"]),
            models.Index(fields=["store", "category"]),
            models.Index(fields=["store", "name"]),
            models.Index(fields=["store", "is_active", "updated_at"]),
        ]
        ordering = ["name"]

    def __str__(self):
        return self.name


class ProductBatch(TenantModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="batches")
    batch_number = models.CharField(max_length=100)
    manufacture_date = models.DateField(null=True, blank=True)
    expiration_date = models.DateField(null=True, blank=True)
    quantity = models.IntegerField(default=0)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["store", "product"]),
            models.Index(fields=["store", "expiration_date"]),
        ]
        ordering = ["-created_at"]


class POSQuickAccess(TenantModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="quick_access")
    display_name = models.CharField(max_length=255)
    icon = models.CharField(max_length=50, default="shopping-bag")
    color = models.CharField(max_length=50, default="text-zinc-500")
    bg_color = models.CharField(max_length=50, default="bg-zinc-50")
    options = models.JSONField(default=list)

    class Meta:
        ordering = ["display_name"]
