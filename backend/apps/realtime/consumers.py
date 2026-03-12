import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken

logger = logging.getLogger(__name__)


class StoreSyncConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for real-time store updates.

    Authenticates via JWT token in query params, joins store-specific channel group.
    """

    async def connect(self):
        token = self.scope["query_string"].decode().split("token=")[-1] if b"token=" in self.scope["query_string"] else None

        if not token:
            await self.close(code=4001)
            return

        try:
            access_token = AccessToken(token)
            self.store_id = access_token.get("store_id")
            self.user_id = str(access_token.get("user_id", ""))
        except Exception:
            await self.close(code=4001)
            return

        if not self.store_id:
            await self.close(code=4003)
            return

        self.group_name = f"store_{self.store_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        msg_type = content.get("type")
        if msg_type == "sync_ack":
            # Client acknowledges sync — no server action needed
            pass

    # Handler for entity_change group messages
    async def entity_change(self, event):
        await self.send_json({
            "type": "entity_change",
            "entity": event["entity"],
            "action": event["action"],
            "data": event["data"],
            "changed_by": event.get("changed_by"),
            "timestamp": event.get("timestamp"),
        })

    # Handler for session_invalidated group messages
    async def session_invalidated(self, event):
        await self.send_json({
            "type": "session_invalidated",
            "reason": event.get("reason", "credentials_changed"),
            "message": event.get("message", "Your credentials have been changed. Please log in again."),
        })

    # Handler for plan_limit_warning group messages
    async def plan_limit_warning(self, event):
        await self.send_json({
            "type": "plan_limit_warning",
            "resource": event.get("resource"),
            "current": event.get("current"),
            "max": event.get("max"),
            "message": event.get("message"),
        })
