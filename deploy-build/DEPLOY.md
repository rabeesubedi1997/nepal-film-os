# Nepal Film OS — cPanel Deployment Guide

## Overview

```
yourdomain.com
│
├── public_html/           ← React build (frontend/dist/*)
│   ├── index.html
│   ├── assets/
│   ├── .htaccess          ← React routing (provided)
│   │
│   └── api/               ← Laravel backend
│       ├── app/
│       ├── bootstrap/
│       ├── config/
│       ├── database/
│       ├── public/
│       │   ├── .htaccess  ← Laravel routing (already exists)
│       │   ├── index.php
│       │   └── storage/   ← symlink to ../storage/app/public
│       ├── routes/
│       ├── storage/
│       ├── vendor/
│       ├── .env           ← production DB credentials
│       └── ...
```

**Subdomain (recommended):** `api.yourdomain.com` → `public_html/api/public`

---

## Step 1 — Prepare Backend

### 1a. Database
In cPanel **MySQL® Databases**:
- Create a database (e.g., `nepalfilm_os`)
- Create a user with password
- Add user to database with **All Privileges**

### 1b. Upload + Configure
1. Upload the entire `backend/` folder to `public_html/api/`
2. In cPanel **Subdomains**, create: `api.yourdomain.com` → `public_html/api/public`
3. Or use cPanel **Aliases** if you want `yourdomain.com/api` instead
4. Rename `public_html/api/.env.example` to `.env` and edit:

```
APP_NAME="Nepal Film OS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

FRONTEND_URL=https://yourdomain.com
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=nepalfilm_os
DB_USERNAME=nepalfilm_user
DB_PASSWORD=your_strong_password

SESSION_DRIVER=file
SESSION_DOMAIN=.yourdomain.com

CACHE_STORE=file
QUEUE_CONNECTION=sync

LOG_LEVEL=warning
```

5. In cPanel **Terminal** or **SSH**:
```bash
cd public_html/api
php artisan key:generate
php artisan migrate --force
php artisan storage:link
```

6. Set permissions:
```
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs storage/app/public
```

---

## Step 2 — Prepare Frontend

### 2a. Build locally
Create `frontend/.env.production`:
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Run:
```bash
cd frontend
npm run build
```

### 2b. Upload
Upload everything inside `frontend/dist/` to `public_html/`.

Your `public_html/` should now contain:
```
public_html/
├── assets/
├── index.html
├── .htaccess    ← (create this — see step 3)
└── api/         ← Laravel (already uploaded)
```

---

## Step 3 — Create .htaccess Files

### 3a. `public_html/.htaccess` (React routing)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Block access to hidden files
  RewriteRule ^\.(.*) - [F,L]

  # Don't rewrite api/ requests — let Laravel handle them
  RewriteRule ^api/ - [L]

  # Don't rewrite existing files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Route everything else to index.html (React SPA)
  RewriteRule ^ index.html [L]
</IfModule>
```

### 3b. `public_html/api/public/.htaccess` (already exists from Laravel)
It's already there. It should look like:
```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

---

## Step 4 — Update Laravel CORS

Edit `public_html/api/config/cors.php`:
```php
<?php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'https://yourdomain.com')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

---

## Step 5 — Verify

| URL | Expected Result |
|---|---|
| `https://yourdomain.com` | React app loads (Landing page) |
| `https://yourdomain.com/login` | Login page (React routed) |
| `https://api.yourdomain.com/api/login` | JSON: `{ "token": "...", "user": {...} }` |
| `https://api.yourdomain.com/api/me` | JSON with auth error (no token) → correct |

---

## Troubleshooting

**Blank page / 404 on refresh**
→ Check `public_html/.htaccess` exists with the rewrite rules above

**API returns 500**
→ Check `public_html/api/storage/logs/laravel.log`
→ Ensure `.env` has correct DB credentials
→ Run `php artisan config:clear` and `php artisan cache:clear`

**CORS errors in browser**
→ Confirm `FRONTEND_URL` in `.env` matches your domain
→ Confirm `config/cors.php` has `'supports_credentials' => true`

**Storage files not loading (images, uploads)**
→ Run `php artisan storage:link` in cPanel terminal
→ Verify the symlink exists at `public_html/api/public/storage`

**cPanel doesn't have Terminal/SSH**
→ Run these commands locally before uploading:
  - `php artisan key:generate`
  - `php artisan migrate --force`
  - `php artisan storage:link`
  Then upload. But you'll need to run migration on the production DB — you can do that via PHPMyAdmin's SQL tab if needed (run the SQL from `database/migrations/` files).
