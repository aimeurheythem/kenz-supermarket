from rest_framework import serializers

from .models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = [
            "id", "store_id", "product_id", "type", "quantity",
            "previous_stock", "new_stock", "reason", "reference_id",
            "reference_type", "created_at",
        ]
        read_only_fields = ["store_id", "previous_stock", "new_stock", "created_at"]
