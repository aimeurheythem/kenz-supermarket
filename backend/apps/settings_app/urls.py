from django.urls import path

from .views import AppSettingView, TicketCounterView

urlpatterns = [
    path("settings/", AppSettingView.as_view(), name="settings-list"),
    path("settings/<str:key>/", AppSettingView.as_view(), name="settings-detail"),
    path("ticket-counter/next/", TicketCounterView.as_view(), name="ticket-counter-next"),
]
