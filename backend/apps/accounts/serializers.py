from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    pin_code = serializers.CharField(write_only=True, required=False, min_length=4, max_length=6)

    class Meta:
        model = User
        fields = [
            "id", "store_id", "email", "username", "full_name", "role",
            "is_active", "last_login", "password", "pin_code",
            "created_at", "updated_at",
        ]
        read_only_fields = ["store_id", "last_login", "created_at", "updated_at"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        pin_code = validated_data.pop("pin_code", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        if pin_code:
            user.pin_length = len(pin_code)
            user.pin_code = make_password(pin_code)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        pin_code = validated_data.pop("pin_code", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        if pin_code:
            instance.pin_length = len(pin_code)
            instance.pin_code = make_password(pin_code)
        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Injects store_id and role into the JWT payload."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["store_id"] = str(user.store_id) if user.store_id else None
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": str(self.user.id),
            "email": self.user.email,
            "full_name": self.user.full_name,
            "role": self.user.role,
            "store_id": str(self.user.store_id) if self.user.store_id else None,
            "store_name": self.user.store.name if self.user.store else None,
        }
        return data
