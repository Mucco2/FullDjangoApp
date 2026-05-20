from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import EmailVerificationToken, PasswordResetToken
from .serializers import (
    ChangePasswordSerializer,
    ChangeUsernameSerializer,
    ConfirmPasswordResetSerializer,
    RegisterSerializer,
    RequestPasswordResetSerializer,
    UpdateProfileSerializer,
    UserSerializer,
)

PASSWORD_RESET_EXPIRY_HOURS = 1


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

    # Send email verification
    verification = EmailVerificationToken.objects.create(user=user)
    verify_url = f'{settings.FRONTEND_URL}/verify-email/{verification.token}'
    send_mail(
        subject='Verify your email address',
        message=(
            f'Hi {user.username},\n\n'
            f'Click the link below to verify your email address:\n\n'
            f'{verify_url}\n\n'
            f'This link does not expire.\n'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )

    return Response(
        {
            'message': 'Account created. Check your email to verify your address.',
            'user': UserSerializer(user).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    serializer = UpdateProfileSerializer(
        instance=request.user.profile,
        data=request.data,
        partial=True,
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(
        {
            'message': 'Profile updated successfully.',
            'user': UserSerializer(request.user).data,
        }
    )


@api_view(['GET'])
def verify_email_view(request, token):
    try:
        record = EmailVerificationToken.objects.select_related('user__profile').get(
            token=token
        )
    except EmailVerificationToken.DoesNotExist:
        return Response(
            {'error': 'Invalid or expired verification link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    profile = record.user.profile
    if not profile.email_verified:
        profile.email_verified = True
        profile.save(update_fields=['email_verified'])

    # Keep the token record so repeat clicks (refresh, back button) stay idempotent.
    return Response({'message': 'Email verified successfully.'})


@api_view(['POST'])
def request_password_reset_view(request):
    serializer = RequestPasswordResetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']

    try:
        user = User.objects.get(email=email)
        reset_token = PasswordResetToken.objects.create(user=user)
        reset_url = f'{settings.FRONTEND_URL}/reset-password/{reset_token.token}'
        send_mail(
            subject='Reset your password',
            message=(
                f'Hi {user.username},\n\n'
                f'Click the link below to reset your password:\n\n'
                f'{reset_url}\n\n'
                f'This link expires in {PASSWORD_RESET_EXPIRY_HOURS} hour(s).\n'
                f'If you did not request a password reset, ignore this email.\n'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except User.DoesNotExist:
        # Don't reveal whether the email exists
        pass

    return Response(
        {'message': 'If an account with that email exists, a reset link has been sent.'}
    )


@api_view(['POST'])
def confirm_password_reset_view(request):
    serializer = ConfirmPasswordResetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    token_value = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']

    try:
        record = PasswordResetToken.objects.select_related('user').get(
            token=token_value, used=False
        )
    except PasswordResetToken.DoesNotExist:
        return Response(
            {'error': 'Invalid or already used reset link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    expiry = record.created_at + timedelta(hours=PASSWORD_RESET_EXPIRY_HOURS)
    if timezone.now() > expiry:
        record.delete()
        return Response(
            {'error': 'This reset link has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = record.user
    user.set_password(new_password)
    user.save(update_fields=['password'])

    record.used = True
    record.save(update_fields=['used'])

    return Response({'message': 'Password reset successfully. You can now log in.'})
