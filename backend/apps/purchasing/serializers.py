from rest_framework import serializers

from .models import PurchaseOrder, PurchaseOrderItem, Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id", "store_id", "name", "contact_person", "phone", "email",
            "address", "balance", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["store_id", "created_at", "updated_at"]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "store_id", "purchase_order_id", "product_id", "quantity", "unit_cost", "total_cost", "received_quantity"]
        read_only_fields = ["store_id"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id", "store_id", "supplier_id", "order_date", "expected_date",
            "status", "total_amount", "paid_amount", "notes", "items",
            "created_at", "updated_at",
        ]
        read_only_fields = ["store_id", "order_date", "created_at", "updated_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        order = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            item_data["total_cost"] = item_data["quantity"] * item_data["unit_cost"]
            PurchaseOrderItem.objects.create(
                purchase_order=order,
                store_id=order.store_id,
                **item_data,
            )
        return order


class ReceiveItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    received_quantity = serializers.IntegerField(min_value=0)
