from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import (
    ChangePasswordSerializer,
    ChangeUsernameSerializer,
    RegisterSerializer,
    UserSerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def secret_view(request):
    return Response(
        {
            'message': 'You are logged in.',
            'username': request.user.username,
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_username_view(request):
    serializer = ChangeUsernameSerializer(
        data=request.data,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    return Response(
        {
            'message': 'Username updated successfully.',
            'user': UserSerializer(user).data,
        }
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response({'message': 'Password updated successfully.'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account_view(request):
    request.user.delete()
    return Response({'message': 'Account deleted successfully.'})


@api_view(['POST'])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.save()

    return Response(
        {
            'message': 'User created successfully.',
            'user': UserSerializer(user).data,
        },
        status=status.HTTP_201_CREATED,
    )
