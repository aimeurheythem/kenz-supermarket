from datetime import date

from django.db import transaction
from django.db.models import F
from rest_framework import serializers as drf_serializers
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import RoleBasedPermission, StoreIsolationPermission

from .models import AppSetting, TicketCounter
from .serializers import AppSettingSerializer, TicketCounterResponseSerializer


class AppSettingView(APIView):
    """GET /settings/ — list all; PUT /settings/{key}/ — upsert."""

    permission_classes = [RoleBasedPermission, StoreIsolationPermission]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "PUT": ["owner", "manager"],
    }

    def get(self, request):
        settings = AppSetting.objects.filter(store_id=request.store_id)
        return Response({"results": AppSettingSerializer(settings, many=True).data})

    def put(self, request, key=None):
        if not key:
            return Response(
                {"detail": "Setting key is required.", "code": "missing_key"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        value = request.data.get("value")
        setting, _ = AppSetting.objects.update_or_create(
            store_id=request.store_id,
            key=key,
            defaults={"value": value},
        )
        return Response(AppSettingSerializer(setting).data)


class TicketCounterView(APIView):
    """POST /ticket-counter/next/ — atomically get next ticket number."""

    permission_classes = [RoleBasedPermission, StoreIsolationPermission]
    role_permissions = {
        "POST": ["owner", "manager", "cashier"],
    }

    def post(self, request):
        counter_date = request.data.get("date", str(date.today()))
        try:
            counter_date = date.fromisoformat(counter_date)
        except (ValueError, TypeError):
            return Response(
                {"detail": "Invalid date format.", "code": "invalid_date"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            counter, created = TicketCounter.objects.select_for_update().get_or_create(
                store_id=request.store_id,
                date=counter_date,
                defaults={"last_number": 1},
            )
            if not created:
                counter.last_number = F("last_number") + 1
                counter.save(update_fields=["last_number"])
                counter.refresh_from_db()

        return Response(
            TicketCounterResponseSerializer(
                {"date": counter.date, "ticket_number": counter.last_number}
            ).data
        )
