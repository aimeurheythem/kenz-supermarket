from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/store/updates/$", consumers.StoreSyncConsumer.as_asgi()),
]
