from django.urls import path

from .admin_views import AdminLoginView, AdminUserDetailView, AdminUserListView

urlpatterns = [
    path('login/', AdminLoginView.as_view()),
    path('users/', AdminUserListView.as_view()),
    path('users/<int:id>/', AdminUserDetailView.as_view()),
]
