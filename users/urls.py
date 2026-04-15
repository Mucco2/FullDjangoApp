from django.urls import path
from .views import secret_view, register_view

urlpatterns = [
    path('secret/', secret_view),
    path('register/', register_view),
]