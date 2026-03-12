from django.db import models

from apps.core.models import TenantModel


class Customer(TenantModel):
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    loyalty_points = models.IntegerField(default=0)
    total_debt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class CustomerTransaction(TenantModel):
    class Type(models.TextChoices):
        DEBT = "debt", "Debt"
        PAYMENT = "payment", "Payment"

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="transactions")
    type = models.CharField(max_length=10, choices=Type.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    reference_type = models.CharField(max_length=50, blank=True, null=True)
    reference_id = models.UUIDField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["store", "customer"]),
        ]
        ordering = ["-created_at"]
