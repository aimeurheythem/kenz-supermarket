from rest_framework import serializers

from .models import Category, POSQuickAccess, Product, ProductBatch


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "store_id", "name", "description", "color", "created_at", "updated_at"]
        read_only_fields = ["store_id", "created_at", "updated_at"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id", "store_id", "barcode", "name", "description", "category_id",
            "cost_price", "selling_price", "stock_quantity", "reorder_level",
            "unit", "image_url", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["store_id", "created_at", "updated_at"]


class ProductBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductBatch
        fields = [
            "id", "store_id", "product_id", "batch_number", "manufacture_date",
            "expiration_date", "quantity", "cost_price", "created_at",
        ]
        read_only_fields = ["store_id", "created_at"]


class POSQuickAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSQuickAccess
        fields = [
            "id", "store_id", "product_id", "display_name", "icon",
            "color", "bg_color", "options", "created_at", "updated_at",
        ]
        read_only_fields = ["store_id", "created_at", "updated_at"]
