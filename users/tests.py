from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class AuthApiTests(APITestCase):
    def test_register_creates_user(self):
        response = self.client.post(
            '/api/register/',
            {
                'username': 'react_user',
                'password': 'StrongPass123',
                'confirm_password': 'StrongPass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username='react_user').exists())

    def test_register_rejects_duplicate_username(self):
        User.objects.create_user(username='react_user', password='StrongPass123')

        response = self.client.post(
            '/api/register/',
            {
                'username': 'react_user',
                'password': 'StrongPass123',
                'confirm_password': 'StrongPass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)

    def test_me_returns_authenticated_user(self):
        User.objects.create_user(username='react_user', password='StrongPass123')

        token_response = self.client.post(
            '/api/token/',
            {
                'username': 'react_user',
                'password': 'StrongPass123',
            },
            format='json',
        )
        access_token = token_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get('/api/me/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'react_user')
