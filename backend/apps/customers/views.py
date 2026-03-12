from django.db import transaction
from rest_framework import mixins, viewsets

from apps.core.mixins import AuditLogMixin
from apps.core.views import TenantViewSet

from .models import Customer, CustomerTransaction
from .serializers import CustomerSerializer, CustomerTransactionSerializer


class CustomerViewSet(AuditLogMixin, TenantViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    search_fields = ["full_name", "phone", "email"]
    ordering_fields = ["full_name", "total_debt", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager", "cashier"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner", "manager"],
    }


class CustomerTransactionViewSet(
    AuditLogMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    TenantViewSet,
):
    queryset = CustomerTransaction.objects.all()
    serializer_class = CustomerTransactionSerializer
    filterset_fields = ["customer_id", "type"]
    ordering_fields = ["created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager", "cashier"],
    }

    def perform_create(self, serializer):
        with transaction.atomic():
            customer = Customer.objects.select_for_update().get(
                id=serializer.validated_data["customer_id"],
                store_id=self.request.store_id,
            )
            tx_type = serializer.validated_data["type"]
            amount = serializer.validated_data["amount"]

            if tx_type == CustomerTransaction.Type.DEBT:
                customer.total_debt += amount
            else:
                customer.total_debt -= amount

            customer.save(update_fields=["total_debt", "updated_at"])
            serializer.save(store_id=self.request.store_id, balance_after=customer.total_debt)
