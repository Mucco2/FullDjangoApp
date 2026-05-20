# Admin Panel

## Folder structure

```text
users/
  admin_serializers.py
  admin_urls.py
  admin_views.py
  permissions.py
frontend/src/
  adminApi.js
  components/admin/
    AdminLogin.jsx
    AdminDashboard.jsx
    UserTable.jsx
    EditUserModal.jsx
  styles/admin.css
Request.http
.env.example
frontend/.env.example
```

## Backend endpoints

All admin user endpoints require `Authorization: Bearer <access-token>`.
Only authenticated users with `is_staff=True` or `is_superuser=True` can use them.

```text
POST   /api/admin/login/
GET    /api/admin/users/
GET    /api/admin/users/<id>/
PUT    /api/admin/users/<id>/
PATCH  /api/admin/users/<id>/
DELETE /api/admin/users/<id>/
```

`POST /api/admin/login/` accepts:

```json
{
  "username": "admin",
  "password": "ChangeMe123!"
}
```

It returns SimpleJWT `access` and `refresh` tokens plus the logged-in admin user.

## Example environment values

Root `.env`:

```env
SECRET_KEY=django-insecure-change-me
DEBUG=True
FRONTEND_URL=http://localhost:5173
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

`frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Run it

Create an admin user if you do not already have one:

```powershell
python manage.py createsuperuser
```

Start Django:

```powershell
python manage.py runserver
```

Start React:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173/admin/login
```

## Test it

Use `Request.http` from VS Code REST Client.

1. Run `Admin-only JWT login`.
2. Copy the returned `access` token into the `@access` variable.
3. Run the list, detail, patch, put, and delete requests.

You can also test the frontend by logging in at `/admin/login`, editing a user,
and deleting a non-current user after the browser confirmation prompt.
