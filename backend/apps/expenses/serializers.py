from rest_framework import serializers

from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "id", "store_id", "description", "amount", "category",
            "date", "payment_method", "user_id", "created_at",
        ]
        read_only_fields = ["store_id", "user_id", "created_at"]
