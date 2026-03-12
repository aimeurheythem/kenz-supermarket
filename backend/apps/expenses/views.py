from apps.core.mixins import AuditLogMixin
from apps.core.views import TenantViewSet

from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(AuditLogMixin, TenantViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    search_fields = ["description"]
    filterset_fields = ["category", "payment_method"]
    ordering_fields = ["date", "amount", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }

    def perform_create(self, serializer):
        serializer.save(store_id=self.request.store_id, user_id=self.request.user.id)
