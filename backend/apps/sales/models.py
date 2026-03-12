from django.db import models

from apps.core.models import TenantModel


class CashierSession(TenantModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CLOSED = "closed", "Closed"
        FORCE_CLOSED = "force_closed", "Force Closed"

    cashier = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="cashier_sessions"
    )
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    opening_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    closing_cash = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expected_cash = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cash_difference = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["store", "cashier"]),
            models.Index(fields=["store", "status"]),
        ]
        ordering = ["-created_at"]


class Sale(TenantModel):
    class Status(models.TextChoices):
        COMPLETED = "completed", "Completed"
        RETURNED = "returned", "Returned"
        VOIDED = "voided", "Voided"

    user = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="sales"
    )
    session = models.ForeignKey(
        CashierSession, on_delete=models.SET_NULL, null=True, blank=True, related_name="sales"
    )
    customer = models.ForeignKey(
        "customers.Customer", on_delete=models.SET_NULL, null=True, blank=True, related_name="sales"
    )
    sale_date = models.DateTimeField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=50, default="cash")
    customer_name = models.CharField(max_length=255, default="Walk-in Customer")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETED)
    ticket_number = models.IntegerField(null=True, blank=True)
    original_sale = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="returns"
    )
    return_type = models.CharField(max_length=50, null=True, blank=True)
    cart_discount_type = models.CharField(max_length=50, null=True, blank=True)
    cart_discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cart_discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    synced_at = models.DateTimeField(null=True, blank=True)
    client_id = models.UUIDField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["store", "sale_date"]),
            models.Index(fields=["store", "user"]),
            models.Index(fields=["store", "session"]),
        ]
        ordering = ["-sale_date"]


class SaleItem(TenantModel):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("inventory.Product", on_delete=models.CASCADE)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    manual_discount_type = models.CharField(max_length=50, null=True, blank=True)
    manual_discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    manual_discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    promotion = models.ForeignKey(
        "promotions.Promotion", on_delete=models.SET_NULL, null=True, blank=True
    )
    promotion_name = models.CharField(max_length=255, null=True, blank=True)


class PaymentEntry(TenantModel):
    class Method(models.TextChoices):
        CASH = "cash", "Cash"
        CARD = "card", "Card"
        MOBILE = "mobile", "Mobile"
        CREDIT = "credit", "Credit"

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="payments")
    method = models.CharField(max_length=20, choices=Method.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    change_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
