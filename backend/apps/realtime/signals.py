import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone

logger = logging.getLogger(__name__)

# All tenant models that should broadcast changes
BROADCAST_MODELS = []


def register_broadcast_models():
    """Register models for real-time broadcasting. Called from apps.py ready()."""
    from apps.customers.models import Customer, CustomerTransaction
    from apps.expenses.models import Expense
    from apps.inventory.models import Category, POSQuickAccess, Product, ProductBatch
    from apps.promotions.models import Promotion
    from apps.purchasing.models import PurchaseOrder, Supplier
    from apps.sales.models import CashierSession, Sale
    from apps.settings_app.models import AppSetting
    from apps.stock.models import StockMovement

    models = [
        Category, Product, ProductBatch, Supplier, PurchaseOrder,
        Customer, CustomerTransaction, Sale, CashierSession,
        Expense, Promotion, StockMovement, POSQuickAccess, AppSetting,
    ]
    for model in models:
        post_save.connect(broadcast_entity_change, sender=model)
        post_delete.connect(broadcast_entity_delete, sender=model)


def _get_entity_name(instance):
    return instance.__class__.__name__.lower()


def broadcast_entity_change(sender, instance, created, **kwargs):
    """Broadcast entity create/update to the store's WebSocket channel group."""
    store_id = getattr(instance, "store_id", None)
    if not store_id:
        return

    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    group_name = f"store_{store_id}"
    action = "created" if created else "updated"

    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "entity_change",
                "entity": _get_entity_name(instance),
                "action": action,
                "data": {"id": str(instance.pk)},
                "changed_by": None,
                "timestamp": timezone.now().isoformat(),
            },
        )
    except Exception:
        logger.exception("Failed to broadcast entity change")


def broadcast_entity_delete(sender, instance, **kwargs):
    """Broadcast entity deletion to the store's WebSocket channel group."""
    store_id = getattr(instance, "store_id", None)
    if not store_id:
        return

    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    group_name = f"store_{store_id}"

    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "entity_change",
                "entity": _get_entity_name(instance),
                "action": "deleted",
                "data": {"id": str(instance.pk)},
                "changed_by": None,
                "timestamp": timezone.now().isoformat(),
            },
        )
    except Exception:
        logger.exception("Failed to broadcast entity delete")
