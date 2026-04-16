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

    def test_change_username_updates_authenticated_user(self):
        user = User.objects.create_user(username='react_user', password='StrongPass123')

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
        response = self.client.post(
            '/api/account/username/',
            {'username': 'renamed_user'},
            format='json',
        )

        user.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['username'], 'renamed_user')
        self.assertEqual(user.username, 'renamed_user')

    def test_change_username_rejects_duplicate_username(self):
        User.objects.create_user(username='taken_name', password='StrongPass123')
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
        response = self.client.post(
            '/api/account/username/',
            {'username': 'taken_name'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)

    def test_change_password_updates_login_credentials(self):
        user = User.objects.create_user(username='react_user', password='StrongPass123')

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
        response = self.client.post(
            '/api/account/password/',
            {
                'current_password': 'StrongPass123',
                'new_password': 'EvenStronger456',
                'confirm_password': 'EvenStronger456',
            },
            format='json',
        )

        user.refresh_from_db()
        login_response = self.client.post(
            '/api/token/',
            {
                'username': 'react_user',
                'password': 'EvenStronger456',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(user.check_password('EvenStronger456'))
        self.assertEqual(login_response.status_code, 200)

    def test_change_password_rejects_wrong_current_password(self):
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
        response = self.client.post(
            '/api/account/password/',
            {
                'current_password': 'WrongPassword123',
                'new_password': 'EvenStronger456',
                'confirm_password': 'EvenStronger456',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)

    def test_delete_account_removes_authenticated_user(self):
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
        response = self.client.delete('/api/account/')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(username='react_user').exists())
