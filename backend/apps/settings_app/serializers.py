from rest_framework import serializers

from .models import AppSetting


class AppSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppSetting
        fields = ["key", "value", "updated_at"]
        read_only_fields = ["updated_at"]


class TicketCounterResponseSerializer(serializers.Serializer):
    date = serializers.DateField()
    ticket_number = serializers.IntegerField()
