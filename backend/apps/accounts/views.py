from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.core.mixins import AuditLogMixin
from apps.core.views import TenantViewSet

from .serializers import UserSerializer

User = get_user_model()


class UserViewSet(AuditLogMixin, TenantViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    search_fields = ["full_name", "email", "username"]
    filterset_fields = ["role", "is_active"]
    ordering_fields = ["full_name", "created_at"]
    role_permissions = {
        "GET": ["owner", "manager", "cashier"],
        "POST": ["owner", "manager"],
        "PUT": ["owner", "manager"],
        "PATCH": ["owner", "manager"],
        "DELETE": ["owner"],
    }

    def get_queryset(self):
        qs = super().get_queryset()
        # Cashiers can only see themselves
        if getattr(self.request.user, "role", None) == "cashier":
            qs = qs.filter(id=self.request.user.id)
        return qs

    def perform_create(self, serializer):
        # Managers can only create cashiers
        requesting_role = getattr(self.request.user, "role", None)
        new_role = serializer.validated_data.get("role", "cashier")
        if requesting_role == "manager" and new_role != "cashier":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Managers can only create cashier accounts.")
        serializer.save(store_id=self.request.store_id)


class CustomTokenObtainPairView(TokenObtainPairView):
    """POST /auth/token/ — obtain JWT pair."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class CustomTokenRefreshView(TokenRefreshView):
    """POST /auth/token/refresh/ — refresh access token."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class PinLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    pin = serializers.CharField()
    store_id = serializers.UUIDField()


class PinLoginView(APIView):
    """POST /auth/pin-login/ — quick POS login via PIN code."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        ser = PinLoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            user = User.objects.get(
                username=ser.validated_data["username"],
                store_id=ser.validated_data["store_id"],
                is_active=True,
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid credentials", "code": "invalid_credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.pin_code or not check_password(ser.validated_data["pin"], user.pin_code):
            return Response(
                {"detail": "Invalid credentials", "code": "invalid_credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        refresh = RefreshToken.for_user(user)
        refresh["store_id"] = str(user.store_id) if user.store_id else None
        refresh["role"] = user.role
        refresh["full_name"] = user.full_name
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "store_id": str(user.store_id) if user.store_id else None,
                    "store_name": user.store.name if user.store else None,
                },
            }
        )


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class ChangePasswordView(APIView):
    """POST /auth/change-password/ — change password."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if not request.user.check_password(ser.validated_data["old_password"]):
            return Response(
                {"detail": "Current password is incorrect", "code": "invalid_password"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(ser.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password changed. All sessions invalidated."})
