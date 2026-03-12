from rest_framework import serializers

from .models import CashierSession, PaymentEntry, Sale, SaleItem


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = [
            "id", "store_id", "sale_id", "product_id", "product_name", "quantity",
            "unit_price", "discount", "total", "manual_discount_type",
            "manual_discount_value", "manual_discount_amount",
            "promotion_id", "promotion_name",
        ]
        read_only_fields = ["store_id"]


class PaymentEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentEntry
        fields = ["id", "store_id", "sale_id", "method", "amount", "change_amount", "created_at"]
        read_only_fields = ["store_id", "created_at"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, required=False)
    payments = PaymentEntrySerializer(many=True, required=False)

    class Meta:
        model = Sale
        fields = [
            "id", "store_id", "user_id", "session_id", "customer_id",
            "sale_date", "subtotal", "tax_amount", "discount_amount", "total",
            "payment_method", "customer_name", "status", "ticket_number",
            "original_sale_id", "return_type",
            "cart_discount_type", "cart_discount_value", "cart_discount_amount",
            "synced_at", "client_id",
            "items", "payments", "created_at",
        ]
        read_only_fields = ["store_id", "sale_date", "created_at"]


class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    payments = PaymentEntrySerializer(many=True)

    class Meta:
        model = Sale
        fields = [
            "id", "session_id", "customer_id", "subtotal", "tax_amount",
            "discount_amount", "total", "payment_method", "customer_name",
            "ticket_number", "cart_discount_type", "cart_discount_value",
            "cart_discount_amount", "items", "payments",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        payments_data = validated_data.pop("payments", [])
        sale = Sale.objects.create(**validated_data)
        store_id = sale.store_id
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, store_id=store_id, **item_data)
        for payment_data in payments_data:
            PaymentEntry.objects.create(sale=sale, store_id=store_id, **payment_data)
        return sale


class VoidSaleSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, default="")


class ReturnSaleSerializer(serializers.Serializer):
    return_type = serializers.ChoiceField(choices=["full", "partial"], default="full")
    items = serializers.ListField(child=serializers.DictField(), required=False, default=list)


class CashierSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashierSession
        fields = [
            "id", "store_id", "cashier_id", "login_time", "logout_time",
            "opening_cash", "closing_cash", "expected_cash", "cash_difference",
            "status", "notes", "created_at",
        ]
        read_only_fields = [
            "store_id", "cashier_id", "login_time", "logout_time",
            "expected_cash", "cash_difference", "status", "created_at",
        ]


class CloseSessionSerializer(serializers.Serializer):
    closing_cash = serializers.DecimalField(max_digits=12, decimal_places=2)
    notes = serializers.CharField(required=False, default="")
