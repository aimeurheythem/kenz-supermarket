from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("users", views.UserViewSet)

urlpatterns = [
    path("token/", views.CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", views.CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("pin-login/", views.PinLoginView.as_view(), name="pin_login"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    path("", include(router.urls)),
]
