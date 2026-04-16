from django.urls import path

from .views import (
    change_password_view,
    delete_account_view,
    me_view,
    register_view,
    secret_view,
    update_username_view,
)

urlpatterns = [
    path('secret/', secret_view),
    path('me/', me_view),
    path('account/', delete_account_view),
    path('account/username/', update_username_view),
    path('account/password/', change_password_view),
    path('register/', register_view),
]
