from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import EmailVerificationToken, PasswordResetToken, Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    fields = ['bio', 'avatar_url', 'email_verified']


class CustomUserAdmin(UserAdmin):
    inlines = [ProfileInline]


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(EmailVerificationToken)
admin.site.register(PasswordResetToken)
