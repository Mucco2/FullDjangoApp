# Environment Variables

## Folder structure

```text
.
  .env                  # local only, ignored by Git
  .env.example          # safe placeholders for Django/backend
  .gitignore
  config/
    settings.py
  frontend/
    .env                # local only, ignored by Git
    .env.example        # safe placeholders for Vite/React
    src/
      api.js
      adminApi.js
```

## Install

```powershell
.\.venv\Scripts\python.exe -m pip install python-decouple
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd frontend
npm install
```

## Create local env files

Copy the examples, then replace placeholders in the ignored local files:

```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

Generate a new Django secret key without printing an existing secret:

```powershell
.\.venv\Scripts\python.exe -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## If `.env` was already tracked by Git

Check first:

```powershell
git ls-files .env
git ls-files frontend/.env
```

If either command prints a file path, remove it from Git tracking while keeping
the local file on disk:

```powershell
git rm --cached .env
git rm --cached frontend/.env
git commit -m "Stop tracking local environment files"
```

## Backend variables

```env
SECRET_KEY=django-insecure-replace-with-your-own-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
FRONTEND_URL=http://localhost:5174
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174

DB_ENGINE=mssql
DB_NAME=your_database_name
DB_HOST=(localdb)\MSSQLLocalDB
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_DRIVER=ODBC Driver 17 for SQL Server
DB_TRUSTED_CONNECTION=True

JWT_SIGNING_KEY=replace-with-a-separate-jwt-signing-key-or-use-secret-key
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=5
JWT_REFRESH_TOKEN_LIFETIME_DAYS=1
```

## Frontend variables

Vite only exposes variables prefixed with `VITE_` to React code:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APP_ENV=development
```

## Test

```powershell
.\.venv\Scripts\python.exe manage.py check
cd frontend
npm run lint
npm run build
```

Run the apps:

```powershell
.\.venv\Scripts\python.exe manage.py runserver
cd frontend
npm run dev
```

## Changed files

```text
.gitignore
.env.example
frontend/.env.example
requirements.txt
config/settings.py
ENVIRONMENT.md
```

Local ignored files were also created:

```text
.env
frontend/.env
```
