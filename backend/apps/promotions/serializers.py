from rest_framework import serializers

from .models import Promotion, PromotionProduct


class PromotionProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionProduct
        fields = ["id", "store_id", "promotion_id", "product_id", "created_at"]
        read_only_fields = ["store_id", "created_at"]


class PromotionSerializer(serializers.ModelSerializer):
    product_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    products = PromotionProductSerializer(many=True, read_only=True)

    class Meta:
        model = Promotion
        fields = [
            "id", "store_id", "name", "type", "status", "start_date", "end_date",
            "config", "deleted_at", "product_ids", "products", "created_at", "updated_at",
        ]
        read_only_fields = ["store_id", "deleted_at", "created_at", "updated_at"]

    def create(self, validated_data):
        product_ids = validated_data.pop("product_ids", [])
        promotion = Promotion.objects.create(**validated_data)
        for pid in product_ids:
            PromotionProduct.objects.create(
                store_id=promotion.store_id,
                promotion=promotion,
                product_id=pid,
            )
        return promotion

    def update(self, instance, validated_data):
        product_ids = validated_data.pop("product_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if product_ids is not None:
            instance.products.all().delete()
            for pid in product_ids:
                PromotionProduct.objects.create(
                    store_id=instance.store_id,
                    promotion=instance,
                    product_id=pid,
                )

        return instance
