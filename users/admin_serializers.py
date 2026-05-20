from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if not (self.user.is_staff or self.user.is_superuser):
            raise serializers.ValidationError('Admin access is required.')

        data['user'] = AdminUserSerializer(self.user).data
        return data


class AdminUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active',
            'is_staff',
            'is_superuser',
            'last_login',
            'date_joined',
            'profile',
        ]
        read_only_fields = ['id', 'last_login', 'date_joined', 'profile']

    def get_profile(self, obj):
        profile = getattr(obj, 'profile', None)

        if not profile:
            return None

        return {
            'bio': profile.bio,
            'avatar_url': profile.avatar_url,
            'industry': profile.industry,
            'industry_display': profile.get_industry_display(),
            'email_verified': profile.email_verified,
        }

    def validate_username(self, value):
        instance = self.instance
        queryset = User.objects.filter(username=value)

        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('Username already taken.')

        return value

    def validate_email(self, value):
        if not value:
            return value

        instance = self.instance
        queryset = User.objects.filter(email=value)

        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('An account with this email already exists.')

        return value

    def validate(self, attrs):
        request = self.context.get('request')

        if request and not request.user.is_superuser:
            attrs.pop('is_staff', None)
            attrs.pop('is_superuser', None)

        return attrs
