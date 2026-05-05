# TaskFlow Phase 1 - Quick Reference

## 📁 What's Been Created

A complete, production-ready authentication system with:

```
taskflow/
├── backend/               # Express.js + TypeScript API
│   ├── src/
│   │   ├── routes/auth.ts           # Auth endpoints
│   │   ├── controllers/authController.ts
│   │   ├── middleware/auth.ts       # JWT verification
│   │   ├── lib/jwt.ts, password.ts
│   │   └── server.ts                # Express app
│   └── prisma/schema.prisma         # Database schema
├── frontend/              # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/Login.tsx, Signup.tsx, Dashboard.tsx
│   │   ├── components/Button, Input, ProtectedRoute
│   │   ├── lib/AuthContext.tsx, apiClient.ts
│   │   └── App.tsx
│   └── vite.config.ts
├── README.md             # Full documentation
├── SETUP_GUIDE.md        # Detailed setup instructions
└── package.json          # Workspace config (concurrent dev)
```

---

## ⚡ Quick Start (5 minutes)

### 1. Install MySQL

**macOS:**
```bash
brew install mysql && brew services start mysql
```

**Windows/Docker:**
```bash
docker run --name mysql -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 -d mysql:8.0
```

### 2. Create Database

```bash
mysql -u root -p -e "CREATE DATABASE taskflow;"
```

### 3. Set Up .env Files

```bash
cd taskflow/backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

cd ../frontend
cp .env.example .env
# Defaults are fine
```

### 4. Install & Run

```bash
cd /path/to/taskflow
npm install
npx prisma migrate dev  # Creates tables
npm run dev             # Starts both backend + frontend
```

### 5. Test It

- Open **http://localhost:5173**
- Sign up with email/password/name
- See dashboard
- Logout → Login again
- Done! ✅

---

## 🔐 API Endpoints

| Method | Route | What It Does |
|--------|-------|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login with email+password |
| GET | `/api/auth/me` | Get current user (requires token) |

All responses: `{ user, token }` or `{ error: { message, code } }`

---

## 🎨 Frontend Routes

| Route | Purpose | Protected? |
|-------|---------|---|
| `/` | Redirects to dashboard or login | No |
| `/login` | Login form | No |
| `/signup` | Registration form | No |
| `/dashboard` | User dashboard | ✅ Yes |

---

## 🛠 Key Files

**Backend Authentication:**
- [backend/src/controllers/authController.ts](backend/src/controllers/authController.ts) — Login/signup logic
- [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts) — JWT verification
- [backend/src/lib/jwt.ts](backend/src/lib/jwt.ts) — Token generation
- [backend/src/lib/password.ts](backend/src/lib/password.ts) — Password hashing

**Frontend Authentication:**
- [frontend/src/lib/AuthContext.tsx](frontend/src/lib/AuthContext.tsx) — User state management
- [frontend/src/lib/apiClient.ts](frontend/src/lib/apiClient.ts) — Axios config with interceptors
- [frontend/src/components/ProtectedRoute.tsx](frontend/src/components/ProtectedRoute.tsx) — Protected route wrapper

**Database:**
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) — User model

---

## 📊 Useful Commands

```bash
# From root directory
npm run dev              # Both servers (hot reload)
npm run backend          # Backend only
npm run frontend         # Frontend only
npm run build            # Build for production

# Backend only
npx prisma studio       # Database GUI
npx prisma migrate dev  # Create new migration

# Frontend only
npm run lint             # Run ESLint
npm run type-check       # TypeScript check
```

---

## 🔍 Debugging

**Backend won't start?**
```bash
npm run backend  # Check logs for errors
brew services start mysql  # Ensure MySQL is running
```

**Frontend won't load?**
```bash
npm run frontend  # Check terminal for compilation errors
# Open http://localhost:5173 in browser
```

**Auth not working?**
```bash
# 1. Check browser DevTools → Application → Local Storage (token present?)
# 2. Check .env files match (DATABASE_URL, JWT_SECRET, VITE_API_URL)
# 3. Check MySQL is running
# 4. Check backend logs for API errors
```

---

## 📋 What's Included

✅ **Security:**
- bcryptjs password hashing (10 rounds)
- JWT tokens (7-day expiry)
- Rate limiting (5 requests per 15 min)
- CORS configured
- Helmet security headers

✅ **Frontend:**
- React Context for auth state
- Protected routes
- Error handling
- Loading states
- Dark mode UI
- Responsive design

✅ **Backend:**
- Express.js server
- Prisma ORM with MySQL
- Zod validation
- Centralized error handling
- TypeScript strict mode

✅ **Developer Experience:**
- Concurrent dev script (backend + frontend together)
- Hot reload on both ends
- ESLint + Prettier configured
- TypeScript for type safety

---

## ❌ What's NOT Included (Phase 2+)

- Boards, projects, tasks
- Calendar views
- Team members/sharing
- Real-time collaboration
- Advanced animations

---

## 🚀 Next Steps

### Immediate (to get running):
1. Install MySQL (see Quick Start)
2. Copy `.env.example` → `.env` files
3. Run `npm install && npx prisma migrate dev && npm run dev`
4. Test signup → login → dashboard

### After confirming it works:
1. Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed explanations
2. Explore backend code in [backend/src/](backend/src/)
3. Explore frontend code in [frontend/src/](frontend/src/)
4. Try modifying components and see hot reload in action

### To add features later:
1. **New API endpoint?** Add to [backend/src/routes/](backend/src/routes/)
2. **New page?** Add to [frontend/src/pages/](frontend/src/pages/)
3. **Database change?** Edit [backend/prisma/schema.prisma](backend/prisma/schema.prisma) then run `npx prisma migrate dev`

---

## 📞 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| **"Cannot connect to database"** | Run `mysql` command, check DATABASE_URL in .env |
| **"Port 5000/5173 already in use"** | Kill process: `lsof -i :5000`, then kill it |
| **"ENOENT: no such file or directory, .env"** | Run `cp .env.example .env` in backend/ and frontend/ |
| **"Token invalid or expired"** | Clear localStorage, log back in |
| **"Email already exists"** | Sign up with different email or delete user from database |

---

## ✨ Architecture Overview

```
User (Browser)
      ↓
   React App
   (http://localhost:5173)
      ↓ (API calls)
  Axios Client
  (Bearer token in header)
      ↓
Express Server
(http://localhost:5000)
      ↓
Prisma ORM
      ↓
   MySQL Database
```

**Auth Flow:**
```
Signup/Login
    ↓
Hash password (bcrypt)
    ↓
Create/verify user in DB
    ↓
Generate JWT token
    ↓
Return {user, token} to frontend
    ↓
Frontend stores token in localStorage
    ↓
Axios interceptor adds "Authorization: Bearer {token}" to all requests
    ↓
Backend verifies token on protected routes
```

---

## 📝 File Count

- **Backend:** 10 source files (controllers, routes, middleware, libs, schemas)
- **Frontend:** 11 source files (pages, components, libs, hooks)
- **Config:** 15 config files (package.json, tsconfig, .env.example, etc.)
- **Total:** ~36 files, ~3,000 lines of code

All from scratch, ready to extend!

---

## 🎓 Learning Resources

- [Express.js Docs](https://expressjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [JWT.io](https://jwt.io)
- [Tailwind CSS](https://tailwindcss.com)

---

**Ready to build! 🚀**

Next: Follow [SETUP_GUIDE.md](SETUP_GUIDE.md) for step-by-step setup instructions.
