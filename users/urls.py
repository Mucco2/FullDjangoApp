from django.urls import path

from .views import (
    change_password_view,
    confirm_password_reset_view,
    delete_account_view,
    me_view,
    register_view,
    request_password_reset_view,
    secret_view,
    update_profile_view,
    update_username_view,
    verify_email_view,
)

urlpatterns = [
    # Auth / info
    path('secret/', secret_view),
    path('me/', me_view),
    path('register/', register_view),

    # Account management
    path('account/', delete_account_view),
    path('account/username/', update_username_view),
    path('account/password/', change_password_view),
    path('account/profile/', update_profile_view),

    # Email verification
    path('verify-email/<uuid:token>/', verify_email_view),

    # Password reset
    path('password-reset/request/', request_password_reset_view),
    path('password-reset/confirm/', confirm_password_reset_view),
]
