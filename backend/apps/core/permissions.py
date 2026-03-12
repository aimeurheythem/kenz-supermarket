from rest_framework.permissions import BasePermission


class StoreIsolationPermission(BasePermission):
    """Validates that the requested object belongs to the user's store."""

    def has_object_permission(self, request, view, obj):
        store_id = getattr(request, "store_id", None)
        obj_store_id = getattr(obj, "store_id", None)
        if store_id is None or obj_store_id is None:
            return False
        return str(obj_store_id) == str(store_id)


class IsOwner(BasePermission):
    """Only store owners."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "owner"
        )


class IsOwnerOrManager(BasePermission):
    """Store owners or managers."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("owner", "manager")
        )


class IsAuthenticated(BasePermission):
    """Any authenticated store user."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class RoleBasedPermission(BasePermission):
    """Configurable role-based permission.

    Set `role_permissions` on the view:
        role_permissions = {
            "GET": ["owner", "manager", "cashier"],
            "POST": ["owner", "manager"],
            "PUT": ["owner", "manager"],
            "PATCH": ["owner", "manager"],
            "DELETE": ["owner", "manager"],
        }
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role_permissions = getattr(view, "role_permissions", None)
        if role_permissions is None:
            return True
        allowed_roles = role_permissions.get(request.method, [])
        return request.user.role in allowed_roles
