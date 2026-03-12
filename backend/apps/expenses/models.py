from django.db import models

from apps.core.models import TenantModel


class Expense(TenantModel):
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=100)
    date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=50, default="cash")
    user = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses"
    )

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.description} ({self.amount})"
