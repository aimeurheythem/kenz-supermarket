from rest_framework import mixins, viewsets

from apps.core.permissions import RoleBasedPermission, StoreIsolationPermission

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only viewset for audit logs. No create/update/delete via API."""

    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [RoleBasedPermission, StoreIsolationPermission]
    filterset_fields = ["user_id", "action", "entity"]
    ordering_fields = ["created_at"]
    role_permissions = {
        "GET": ["owner", "manager"],
    }

    def get_queryset(self):
        qs = super().get_queryset()
        store_id = getattr(self.request, "store_id", None)
        if store_id is not None:
            qs = qs.filter(store_id=store_id)
        return qs
