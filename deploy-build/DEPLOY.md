# Nepal Film OS — cPanel Deployment Guide

**Live site:** https://filmos.kitetool.com  
**API:** https://filmos.kitetool.com/api

## Quick Deploy (after each git push)

On the server (SSH or cPanel Terminal):

```bash
cd ~/repository/nepal-film-os   # or wherever the repo is cloned

# If you get "local changes would be overwritten by merge":
# git stash

git pull origin main

# Copy frontend build to public_html
cp -r deploy-build/* ~/public_html/
# or: rsync -a deploy-build/* ~/public_html/
```

If you stashed, restore your changes afterward:
```bash
git stash pop
```

---

## Overview

```
filmos.kitetool.com
│
├── public_html/           ← React build (deploy-build/*)
│   ├── index.html
│   ├── assets/
│   ├── .htaccess          ← React routing (provided)
│   │
│   └── api/               ← Laravel backend (backend/)
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

---

## Step 1 — Prepare Backend

### 1a. Database
In cPanel **MySQL® Databases**:
- Create a database (e.g., `nepalfilm_os`)
- Create a user with password
- Add user to database with **All Privileges**

### 1b. Upload + Configure
1. Upload the entire `backend/` folder to `public_html/api/`
2. cPanel handles `filmos.kitetool.com/api` automatically (no subdomain needed)
3. Rename `public_html/api/.env.example` to `.env` and edit:

```
APP_NAME="Nepal Film OS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://filmos.kitetool.com

FRONTEND_URL=https://filmos.kitetool.com
SANCTUM_STATEFUL_DOMAINS=filmos.kitetool.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=nepalfilm_os
DB_USERNAME=nepalfilm_user
DB_PASSWORD=your_strong_password

SESSION_DRIVER=file
SESSION_DOMAIN=.filmos.kitetool.com

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
VITE_API_BASE_URL=https://filmos.kitetool.com/api
```

Run:
```bash
cd frontend
npm run build
```

### 2b. Deploy via git (recommended)
```bash
cp -r deploy-build/* ~/public_html/
```

Your `public_html/` should now contain:
```
public_html/
├── assets/
├── index.html
├── .htaccess    ← (create this — see step 3)
└── api/         ← Laravel backend
```

---

## Step 3 — Create .htaccess Files

> **Already provided** in `deploy-build/.htaccess` — it's copied over with the deploy step above.

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
    'allowed_origins' => [env('FRONTEND_URL', 'https://filmos.kitetool.com')],
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
| `https://filmos.kitetool.com` | React app loads (Landing page) |
| `https://filmos.kitetool.com/login` | Login page (React routed) |
| `https://filmos.kitetool.com/api/login` | JSON: `{ "token": "...", "user": {...} }` |
| `https://filmos.kitetool.com/api/me` | JSON with auth error (no token) → correct |

---

## Troubleshooting

**Blank page / 404 on refresh**
→ Check `public_html/.htaccess` exists with the rewrite rules above

**API returns 500**
→ Check `public_html/api/storage/logs/laravel.log`
→ Ensure `.env` has correct DB credentials
→ Run `php artisan config:clear` and `php artisan cache:clear`

**CORS errors in browser**
→ Confirm `FRONTEND_URL` in `.env` matches your domain (`https://filmos.kitetool.com`)
→ Confirm `config/cors.php` has `'supports_credentials' => true`

**Git pull says "local changes would be overwritten by merge"**
→ Run `git stash` before `git pull`, then `git stash pop` after
→ Or run `git checkout deploy-build/index.html` to discard the local change

**Storage files not loading (images, uploads)**
→ Run `php artisan storage:link` in cPanel terminal
→ Verify the symlink exists at `public_html/api/public/storage`

**cPanel doesn't have Terminal/SSH**
→ Run these commands locally before uploading:
  - `php artisan key:generate`
  - `php artisan migrate --force`
  - `php artisan storage:link`
  Then upload. But you'll need to run migration on the production DB — you can do that via PHPMyAdmin's SQL tab if needed (run the SQL from `database/migrations/` files).
