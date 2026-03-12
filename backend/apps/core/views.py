from rest_framework import viewsets

from .permissions import RoleBasedPermission, StoreIsolationPermission


class TenantViewSet(viewsets.ModelViewSet):
    """Base viewset that scopes all queries to the current user's store.

    Subclasses should set:
      - `serializer_class`
      - `queryset` (used for model resolution; overridden by get_queryset)
      - `role_permissions` dict mapping HTTP method → allowed roles
    """

    permission_classes = [RoleBasedPermission, StoreIsolationPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        store_id = getattr(self.request, "store_id", None)
        if store_id is not None:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(store_id=self.request.store_id)

    def perform_update(self, serializer):
        serializer.save()
