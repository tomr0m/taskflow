# TaskFlow Phase 1 - Complete Setup Guide

This guide will walk you through setting up TaskFlow from scratch and running the end-to-end auth flow.

---

## 🎯 What You'll Build

**Phase 1 includes:**
- User registration (email, password, name)
- User login with JWT authentication
- Protected dashboard page
- Logout functionality
- Dark mode UI with minimalist design

**NOT included (future phases):**
- Boards, tasks, projects
- Calendar views
- Team collaboration
- Real-time features

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** — [Download](https://nodejs.org/)
  ```bash
  node --version  # Should be v18.0.0 or higher
  npm --version   # Should be v9.0.0 or higher
  ```

- **Git** — [Download](https://git-scm.com/)
  ```bash
  git --version
  ```

- **MySQL 8.0+** — See installation steps below
- **Code editor** — VS Code, WebStorm, or similar
- **Terminal** — macOS Terminal, Windows PowerShell, or similar

---

## 🐬 Step 1: Install MySQL

Choose **one** installation method:

### Option A: macOS with Homebrew (Recommended)

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Verify installation
mysql --version
```

**Note:** Default credentials are `root` (no password)

To stop MySQL later:
```bash
brew services stop mysql
```

---

### Option B: macOS with Docker (Alternative)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop)

```bash
# Start MySQL container
docker run --name taskflow-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=taskflow \
  -p 3306:3306 \
  -d mysql:8.0

# Verify it's running
docker ps | grep taskflow-mysql
```

Use credentials: `root` / `password`

To stop MySQL:
```bash
docker stop taskflow-mysql
```

---

### Option C: Windows with MySQL Installer

1. Download [MySQL Installer](https://dev.mysql.com/downloads/installer/)
2. Run installer, follow setup wizard
3. Choose "MySQL Server 8.0"
4. Default port: 3306
5. Configure as Windows Service (auto-start)
6. Set root password during setup

---

### Option D: Windows with Docker (Alternative)

```bash
docker run --name taskflow-mysql ^
  -e MYSQL_ROOT_PASSWORD=password ^
  -e MYSQL_DATABASE=taskflow ^
  -p 3306:3306 ^
  -d mysql:8.0
```

---

## 📊 Step 2: Create Database

Once MySQL is running, create the TaskFlow database:

```bash
# Connect to MySQL
mysql -u root -p

# Leave password blank (Homebrew) or enter your password
# You should see: mysql>

# Create database
CREATE DATABASE taskflow;

# Verify creation
SHOW DATABASES;

# Exit MySQL
EXIT;
```

Expected output:
```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| taskflow           |
+--------------------+
```

---

## 📂 Step 3: Set Up Backend Environment

Navigate to the backend directory and configure environment variables:

```bash
cd /path/to/taskflow/backend

# Copy example file
cp .env.example .env

# Edit .env file (use your editor)
```

**Edit `backend/.env`:**

```env
# Database connection (adjust if using Docker or different credentials)
DATABASE_URL="mysql://root:password@localhost:3306/taskflow"

# JWT secret (generate something unique)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

JWT_EXPIRES_IN="7d"
NODE_ENV="development"
API_PORT=5000
FRONTEND_URL="http://localhost:5173"
```

**Notes:**
- If using Homebrew MySQL: `DATABASE_URL="mysql://root@localhost:3306/taskflow"` (no password)
- If using Docker with password: `DATABASE_URL="mysql://root:password@localhost:3306/taskflow"`
- Change `JWT_SECRET` to something random and unique

---

## 🎨 Step 4: Set Up Frontend Environment

Navigate to the frontend directory and configure environment variables:

```bash
cd /path/to/taskflow/frontend

# Copy example file
cp .env.example .env

# The defaults should work (frontend connects to http://localhost:5000 for API)
```

**`frontend/.env`** (defaults are fine):
```env
VITE_API_URL="http://localhost:5000"
```

---

## 📦 Step 5: Install Dependencies & Set Up Database

From the **root** `taskflow/` directory:

```bash
# Navigate to root
cd /path/to/taskflow

# Install dependencies for backend and frontend
npm install

# This may take 2-3 minutes on first install
```

Once installation completes, initialize the database:

```bash
# Create migrations and set up database schema
npx prisma migrate dev

# You'll be prompted:
# ✔ Enter a name for the new migration › init

# Type: init
# Press Enter

# Prisma will:
# - Run migrations
# - Generate Prisma Client
# - Create User table in database
```

Expected output:
```
✔ Your database has been successfully initialized!

The following migration(s) have been created and applied:

migrations/
  └─ 20240101000000_init/
    └─ migration.sql
```

---

## 🚀 Step 6: Run the Application

From the **root** `taskflow/` directory, start both frontend and backend:

```bash
npm run dev
```

You should see:
```
> backend: starting...
> frontend: starting...
✅ TaskFlow API running on http://localhost:5000
✔️ VITE v5.0.8 ready in 123 ms
➜  Local: http://localhost:5173/
```

**Keep this terminal running!** The application runs with hot reload enabled.

---

## 🧪 Step 7: Test the Authentication Flow

### Test 1: Sign Up (Create New Account)

1. Open browser to **http://localhost:5173**
   - Auto-redirects to login page (not authenticated)

2. Click **"Sign up"** link or navigate to `/signup`

3. Fill in the form:
   - **Name:** `John Developer`
   - **Email:** `john@example.com`
   - **Password:** `SecurePass123` (min 8 characters)

4. Click **"Sign Up"**

5. Expected result:
   - ✅ Account created
   - ✅ Automatically logged in
   - ✅ Redirected to **Dashboard**
   - ✅ Dashboard shows "Welcome, John Developer!"

---

### Test 2: Dashboard Access

On the dashboard, verify:

- ✅ "Welcome, {name}" message at top
- ✅ User email displayed
- ✅ User ID displayed
- ✅ "Authenticated" status shown
- ✅ **Logout** button in top-right

---

### Test 3: Logout & Login

1. Click **"Logout"** button

2. Expected result:
   - ✅ Redirected to login page
   - ✅ User session cleared

3. On login page, fill in:
   - **Email:** `john@example.com`
   - **Password:** `SecurePass123`

4. Click **"Login"**

5. Expected result:
   - ✅ Logged in successfully
   - ✅ Redirected to dashboard
   - ✅ Same user details displayed

---

### Test 4: Protected Routes

Test that unauthenticated users can't access dashboard:

1. Logout (if logged in)

2. Try to access **http://localhost:5173/dashboard**

3. Expected result:
   - ✅ Automatically redirected to `/login`
   - ❌ Cannot view dashboard without token

---

### Test 5: Invalid Credentials

Test error handling:

1. On login page, try:
   - **Email:** `john@example.com`
   - **Password:** `WrongPassword`

2. Expected result:
   - ✅ Error message: "Invalid email or password"
   - ✅ Not redirected
   - ✅ Can retry

---

### Test 6: Duplicate Email

Test signup validation:

1. Go to signup page

2. Try to sign up with same email: `john@example.com`

3. Expected result:
   - ✅ Error message: "Email already registered"
   - ✅ Account not created

---

### Test 7: Password Validation

Test validation rules:

1. Go to signup page

2. Try to sign up with:
   - **Name:** `Jane`
   - **Email:** `jane@example.com`
   - **Password:** `short` (less than 8 characters)

3. Expected result:
   - ✅ Error message: "Password must be at least 8 characters"
   - ✅ Account not created

---

## 🔍 Debugging Tips

### If app won't start:

**Check MySQL is running:**
```bash
# macOS Homebrew
brew services list | grep mysql

# Should show: mysql started

# If not running, start it:
brew services start mysql
```

**Check database connection:**
```bash
# Test MySQL connection
mysql -u root -p taskflow -e "SELECT 1;"

# If error, verify DATABASE_URL in backend/.env
```

**Check ports aren't in use:**
```bash
# Frontend port 5173
lsof -i :5173

# Backend port 5000
lsof -i :5000

# If occupied, kill the process or change port in config
```

---

### If authentication fails:

**Check tokens in browser:**
1. Open browser DevTools (F12)
2. Go to **Application** → **Local Storage**
3. Should see `token` key with JWT value
4. If missing, auth failed

**Check backend logs:**
- Terminal should show API requests
- Look for errors in response

---

### If frontend can't reach backend:

**Verify CORS:**
- `FRONTEND_URL` in `backend/.env` must match where frontend is running
- Default: `http://localhost:5173`

**Verify API URL:**
- `VITE_API_URL` in `frontend/.env` must match backend location
- Default: `http://localhost:5000`

---

## 📂 Database Management

### View your data with Prisma Studio:

```bash
# From root directory
npx prisma studio

# Opens GUI at http://localhost:5555
# Browse users, create test data, etc.
```

### Reset database (⚠️ deletes all data):

```bash
npx prisma migrate reset

# This will:
# - Drop all tables
# - Re-run all migrations
# - Delete all user data
# - Reseed database
```

---

## 🛑 Stopping the Application

Press `Ctrl+C` in the terminal running `npm run dev`

This stops both backend and frontend servers.

---

## ✅ What You've Built

Congratulations! You now have:

- ✅ **Secure authentication** with JWT tokens
- ✅ **User database** with hashed passwords
- ✅ **API endpoints** for signup/login/logout
- ✅ **React frontend** with auth flows
- ✅ **Protected routes** that require authentication
- ✅ **Error handling** with user-friendly messages
- ✅ **Dark mode UI** with clean design

---

## 🚀 Next Steps

### To continue development:

1. **Backend changes?**
   ```bash
   # Edit files in backend/src/
   # Dev server auto-restarts (hot reload)
   ```

2. **Frontend changes?**
   ```bash
   # Edit files in frontend/src/
   # Dev server auto-updates in browser
   ```

3. **Database schema changes?**
   ```bash
   # Edit backend/prisma/schema.prisma
   # Run: npx prisma migrate dev
   ```

4. **Add new routes?**
   ```bash
   # Create in backend/src/routes/
   # Import in backend/src/server.ts
   ```

---

## 📚 Useful Commands Reference

```bash
# Root directory commands
npm run dev              # Start backend + frontend
npm run build            # Build for production
npm run backend          # Backend only
npm run frontend         # Frontend only

# Backend directory commands
npm run dev              # Start dev server
npx prisma studio       # Open database GUI
npx prisma migrate dev  # Create new migration
npx prisma migrate reset # Reset database

# Frontend directory commands
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run lint             # Run ESLint
```

---

## 🆘 Need Help?

- Check the main [README.md](/README.md) for architecture overview
- Check backend error logs if API requests fail
- Use Prisma Studio to debug database issues
- Verify all `.env` files are correctly configured
- Ensure MySQL is running and database exists

---

**You're all set! 🎉 Enjoy building TaskFlow Phase 1!**
