from django.utils import timezone
from rest_framework.response import Response

from apps.core.mixins import AuditLogMixin
from apps.core.views import TenantViewSet

from .models import Promotion
from .serializers import PromotionSerializer


class PromotionViewSet(AuditLogMixin, TenantViewSet):
    serializer_class = PromotionSerializer
    search_fields = ["name"]
    filterset_fields = ["type", "status"]
    ordering_fields = ["name", "start_date", "end_date", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }

    def get_queryset(self):
        return Promotion.objects.filter(
            store_id=self.request.store_id,
            deleted_at__isnull=True,
        )

    def destroy(self, request, *args, **kwargs):
        """Soft delete — set deleted_at instead of removing."""
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at", "updated_at"])
        return Response(status=204)
