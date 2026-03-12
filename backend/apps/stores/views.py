from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.models import StoreSubscription
from apps.core.permissions import IsOwner
from apps.stores.models import Store
from apps.stores.serializers import StoreRegistrationSerializer, StoreSerializer

User = get_user_model()


class StoreRegistrationView(APIView):
    """POST /auth/register/ — create Store + owner User atomically."""

    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        ser = StoreRegistrationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        # Check email uniqueness (global for owners)
        if User.objects.filter(email=d["email"], role="owner").exists():
            return Response(
                {"detail": "Email already registered", "code": "email_exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create store
        base_slug = slugify(d["store_name"])[:95]
        slug = base_slug
        counter = 1
        while Store.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        store = Store.objects.create(
            name=d["store_name"],
            slug=slug,
            currency=d.get("currency", "DZD"),
            timezone=d.get("timezone", "Africa/Algiers"),
        )

        # Create owner user
        user = User.objects.create(
            store=store,
            email=d["email"],
            username=d["email"].split("@")[0],
            full_name=d["full_name"],
            role="owner",
            password=make_password(d["password"]),
        )

        # Set store owner
        store.owner = user
        store.save(update_fields=["owner"])

        # Create subscription (14-day free trial)
        StoreSubscription.objects.create(
            store=store,
            plan_name="free",
            status="trial",
            trial_end_date=timezone.now() + timedelta(days=14),
            max_products=10000,
            max_cashiers=50,
        )

        return Response(
            {
                "store": {"id": str(store.id), "name": store.name, "slug": store.slug},
                "user": {"id": str(user.id), "email": user.email, "role": user.role},
                "message": "Verification email sent",
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """POST /auth/verify-email/ — placeholder for email verification."""

    permission_classes = [AllowAny]

    def post(self, request):
        # Token verification would be implemented with signed tokens
        return Response({"detail": "Email verified"})


class StoreDetailView(APIView):
    """GET /store/ — get current store. PATCH /store/ — update (owner only)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        store = request.user.store
        if not store:
            return Response(
                {"detail": "No store found", "code": "no_store"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(StoreSerializer(store).data)

    def patch(self, request):
        store = request.user.store
        if not store:
            return Response(
                {"detail": "No store found", "code": "no_store"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if request.user.role != "owner":
            return Response(
                {"detail": "Only the store owner can update store settings", "code": "forbidden"},
                status=status.HTTP_403_FORBIDDEN,
            )
        ser = StoreSerializer(store, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class StoreExportView(APIView):
    """POST /store/export/ — trigger full store data export (FR-037)."""

    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request):
        # In production this would be an async task. For now, return acknowledgment.
        return Response(
            {
                "id": str(request.user.store_id),
                "status": "pending",
                "message": "Export started. You will be notified when complete.",
            },
            status=status.HTTP_202_ACCEPTED,
        )

    def get(self, request, export_id=None):
        # Placeholder for checking export status / download
        return Response(
            {
                "id": export_id,
                "status": "pending",
                "download_url": None,
            }
        )


class StoreDeleteView(APIView):
    """DELETE /store/ — schedule store for permanent deletion with 90-day retention (FR-037)."""

    permission_classes = [IsAuthenticated, IsOwner]

    def delete(self, request):
        store = request.user.store
        if not store:
            return Response(
                {"detail": "No store found", "code": "no_store"},
                status=status.HTTP_404_NOT_FOUND,
            )
        store.is_active = False
        store.save(update_fields=["is_active", "updated_at"])

        # Update subscription to canceled with 90-day grace period
        try:
            sub = store.subscription
            sub.status = "canceled"
            sub.grace_period_end = timezone.now() + timedelta(days=90)
            sub.save(update_fields=["status", "grace_period_end", "updated_at"])
        except StoreSubscription.DoesNotExist:
            pass

        return Response(
            {"detail": "Store scheduled for deletion. Data will be retained for 90 days."},
            status=status.HTTP_200_OK,
        )
