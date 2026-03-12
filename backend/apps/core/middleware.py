from django.utils.deprecation import MiddlewareMixin


class StoreContextMiddleware(MiddlewareMixin):
    """Extract store_id from JWT claims and inject into request.store_id."""

    def process_request(self, request):
        request.store_id = None
        if hasattr(request, "user") and request.user.is_authenticated:
            store = getattr(request.user, "store", None)
            if store:
                request.store_id = store.id
