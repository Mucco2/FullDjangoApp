from django.urls import path

from .views import me_view, register_view, secret_view

urlpatterns = [
    path('secret/', secret_view),
    path('me/', me_view),
    path('register/', register_view),
]
