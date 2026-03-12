from rest_framework import serializers

from .models import Customer, CustomerTransaction


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id", "store_id", "full_name", "phone", "email", "address",
            "loyalty_points", "total_debt", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["store_id", "total_debt", "created_at", "updated_at"]


class CustomerTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerTransaction
        fields = [
            "id", "store_id", "customer_id", "type", "amount", "balance_after",
            "reference_type", "reference_id", "description", "created_at",
        ]
        read_only_fields = ["store_id", "balance_after", "created_at"]
