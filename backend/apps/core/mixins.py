from apps.audit.models import AuditLog


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class AuditLogMixin:
    """Mixin for ModelViewSet that auto-creates AuditLog entries on CUD operations."""

    def perform_create(self, serializer):
        instance = serializer.save(store_id=self.request.store_id)
        self._log_action("create", instance)

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_data = {f.name: str(getattr(old_instance, f.name, "")) for f in old_instance._meta.fields}
        instance = serializer.save()
        new_data = {f.name: str(getattr(instance, f.name, "")) for f in instance._meta.fields}
        changed = {k: new_data[k] for k in new_data if old_data.get(k) != new_data[k]}
        if changed:
            self._log_action(
                "update",
                instance,
                old_value={k: old_data[k] for k in changed},
                new_value=changed,
            )

    def perform_destroy(self, instance):
        self._log_action("delete", instance)
        instance.delete()

    def _log_action(self, action, instance, old_value=None, new_value=None):
        request = self.request
        user = request.user if request.user.is_authenticated else None
        store_id = getattr(request, "store_id", None)
        if store_id is None:
            return
        AuditLog.objects.create(
            store_id=store_id,
            user=user,
            user_name=getattr(user, "full_name", "") if user else "",
            action=action,
            entity=instance.__class__.__name__,
            entity_id=str(instance.pk),
            details=f"{action} {instance.__class__.__name__} {instance.pk}",
            old_value=old_value,
            new_value=new_value,
            ip_address=get_client_ip(request),
        )
