from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['bio', 'avatar_url', 'email_verified', 'created_at', 'updated_at']
        read_only_fields = ['email_verified', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Passwords do not match.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        return User.objects.create_user(**validated_data)


class ChangeUsernameSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)

    def validate_username(self, value):
        user = self.context['request'].user

        if value == user.username:
            raise serializers.ValidationError('Choose a different username.')

        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')

        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.username = self.validated_data['username']
        user.save(update_fields=['username'])
        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')

        return value

    def validate(self, attrs):
        user = self.context['request'].user

        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Passwords do not match.'}
            )

        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError(
                {'new_password': 'Choose a new password.'}
            )

        validate_password(attrs['new_password'], user)
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['bio', 'avatar_url']


class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # We don't raise an error if the email doesn't exist — that would leak info.
        return value


class ConfirmPasswordResetSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Passwords do not match.'}
            )
        validate_password(attrs['new_password'])
        return attrs
