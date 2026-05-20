# Automatic Login After Signup

## Files changed

```text
users/views.py
frontend/src/App.jsx
config/settings.py
.env
.env.example
ENVIRONMENT.md
```

## Backend change

`POST /api/register/` now returns the created user plus JWT credentials:

```json
{
  "message": "Account created. Check your email to verify your address.",
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "newuser@example.com",
    "profile": {}
  }
}
```

Password hashing stays secure because registration still uses
`User.objects.create_user(...)` inside `RegisterSerializer`.

## Frontend change

The React register submit handler now uses the token response from
`registerUser(...)` directly. It no longer sends the plaintext password to
`/api/token/` after signup.

The same `completeLogin(...)` helper is used for login and signup, so tokens are
stored in `localStorage` under the existing `login-session` key, protected user
state is loaded, and the app immediately renders the authenticated dashboard.

## Test

Restart Django after env/settings changes:

```powershell
CTRL + C
python manage.py runserver
```

Run checks:

```powershell
.\.venv\Scripts\python.exe manage.py check
cd frontend
npm run lint
npm run build
```

Manual browser test:

1. Open the React app.
2. Go to Register.
3. Create a new user with a username/email that does not already exist.
4. After submit, the account dashboard should show immediately.
5. Refresh the page. The user should still be authenticated from `login-session`.

REST Client shape:

```http
POST http://127.0.0.1:8000/api/register/
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "ChangeMe123!",
  "confirm_password": "ChangeMe123!"
}
```
