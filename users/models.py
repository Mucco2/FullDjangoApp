import uuid

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


INDUSTRY_CHOICES = [
    ('', 'Not specified'),
    ('tech', 'Technology / IT'),
    ('finance', 'Finance / Banking'),
    ('healthcare', 'Healthcare'),
    ('education', 'Education'),
    ('retail', 'Retail / E-commerce'),
    ('manufacturing', 'Manufacturing'),
    ('construction', 'Construction'),
    ('hospitality', 'Hospitality / Travel'),
    ('media', 'Media / Entertainment'),
    ('government', 'Government / Public sector'),
    ('nonprofit', 'Non-profit'),
    ('other', 'Other'),
]


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, default='')
    avatar_url = models.URLField(blank=True, default='')
    industry = models.CharField(
        max_length=32, choices=INDUSTRY_CHOICES, blank=True, default=''
    )
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} Profile'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='email_verification_tokens'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Email verification for {self.user.username}'


class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='password_reset_tokens'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    def __str__(self):
        return f'Password reset for {self.user.username}'
