from rest_framework import serializers

from apps.stores.models import Store


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = [
            "id", "name", "slug", "currency", "timezone", "phone", "email",
            "address", "logo_url", "is_active", "onboarding_completed", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "is_active", "created_at", "updated_at"]


class StoreRegistrationSerializer(serializers.Serializer):
    store_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=255)
    currency = serializers.CharField(max_length=10, default="DZD")
    timezone = serializers.CharField(max_length=50, default="Africa/Algiers")
