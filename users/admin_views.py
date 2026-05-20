from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .admin_serializers import AdminTokenObtainPairSerializer, AdminUserSerializer
from .permissions import IsStaffOrSuperuser


class AdminLoginView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer


class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsStaffOrSuperuser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        return (
            User.objects.select_related('profile')
            .order_by('id')
        )


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsStaffOrSuperuser]
    serializer_class = AdminUserSerializer
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        return User.objects.select_related('profile')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.pk == request.user.pk:
            return Response(
                {'detail': 'You cannot delete your own admin account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(request, *args, **kwargs)
