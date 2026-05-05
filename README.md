# TaskFlow - Phase 1: Foundation + Authentication

A modern team project management app with calendar support. Built with **Node.js + Express**, **React + Vite**, **TypeScript**, **MySQL**, and **Prisma**.

**Phase 1 Focus:** User authentication and foundation. Future phases will add boards, tasks, calendar views, and real-time collaboration.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm 9+**
- **MySQL 8.0+** (local or Docker)
- Git

### 1. Install MySQL

**Option A: macOS with Homebrew**
```bash
brew install mysql
brew services start mysql
```

**Option B: Docker**
```bash
docker run --name mysql -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 -d mysql:8.0
```

### 2. Create Database

```bash
mysql -u root -p
# Enter password (or leave blank if using Homebrew)

CREATE DATABASE taskflow;
EXIT;
```

### 3. Set Up Environment Files

**Backend** — Copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/taskflow"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
API_PORT=5000
FRONTEND_URL="http://localhost:5173"
```

**Frontend** — Copy `.env.example` to `.env`:
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL="http://localhost:5000"
```

### 4. Install Dependencies & Initialize Database

```bash
# From root directory
npm install

# Run Prisma migrations
npx prisma migrate dev

# Start both backend and frontend
npm run dev
```

This will start:
- **Backend** on `http://localhost:5000`
- **Frontend** on `http://localhost:5173`

---

## 📋 Available Scripts

From the **root directory**:

- `npm run dev` — Start both backend and frontend (hot reload)
- `npm run build` — Build both backend and frontend for production
- `npm run backend` — Start backend only
- `npm run frontend` — Start frontend only

From the **backend** directory:

- `npm run dev` — Start TypeScript dev server
- `npm run build` — Compile TypeScript to JavaScript
- `npm start` — Run compiled server
- `npx prisma studio` — Open Prisma Studio (database GUI)
- `npx prisma migrate dev` — Create and apply migrations

From the **frontend** directory:

- `npm run dev` — Start Vite dev server with hot reload
- `npm run build` — Build for production
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint

---

## 🧪 Testing the Auth Flow

### 1. Open the App

Navigate to `http://localhost:5173` (redirects to login)

### 2. Sign Up

- Go to `/signup`
- Fill in name, email, password (min 8 chars)
- Click "Sign Up"
- You're automatically logged in and redirected to dashboard

### 3. Login

- Log out on dashboard
- Enter email and password
- Redirected to dashboard on success

### 4. Protected Route

- Try visiting `/dashboard` without logging in
- Redirected to `/login` (auth middleware works!)

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── controllers/      # Business logic
│   │   ├── middleware/       # Auth, error handling
│   │   ├── lib/             # Utils (JWT, DB, password)
│   │   ├── schemas/         # Zod validation schemas
│   │   └── server.ts        # Express setup
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Login, Signup, Dashboard
│   │   ├── components/      # Reusable UI (Button, Input, etc.)
│   │   ├── lib/            # API client, Auth context
│   │   ├── hooks/          # Custom React hooks
│   │   ├── App.tsx         # Main router
│   │   └── main.tsx        # Entry point
│   ├── .env.example
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── .gitignore
├── package.json             # Workspace config
└── README.md
```

---

## 🔐 Security Features (Phase 1)

- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ JWT tokens (7-day expiry)
- ✅ Bearer token authentication
- ✅ CORS configured for frontend origin only
- ✅ Helmet for security headers
- ✅ Rate limiting on auth routes (5 requests per 15 min)
- ✅ Input validation with Zod
- ✅ 401 interceptor redirects to login on token expiry
- ✅ No stack traces leaked in production

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express.js, TypeScript |
| Database | MySQL, Prisma ORM |
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, dark mode |
| Auth | JWT + bcryptjs |
| Validation | Zod |
| Animation | Framer Motion |
| HTTP Client | Axios with interceptors |

---

## 📌 API Endpoints (Phase 1)

### Authentication Routes

| Method | Endpoint | Auth | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/api/auth/signup` | ❌ | `{ email, password, name }` | `{ user, token }` |
| POST | `/api/auth/login` | ❌ | `{ email, password }` | `{ user, token }` |
| GET | `/api/auth/me` | ✅ | — | `{ user }` |
| GET | `/health` | ❌ | — | `{ status: 'ok' }` |

---

## 🎨 Design System

- **Colors:** Black, white, gray only (dark mode by default)
- **Font:** Inter sans-serif
- **Spacing:** Generous whitespace, clean layout
- **Animation:** Subtle Framer Motion fade-ins
- **Responsive:** Mobile-first, works on all screens

---

## 🚨 Troubleshooting

### "Cannot GET /api/auth/login"
- Backend not running. Try `npm run backend` from root.

### "ECONNREFUSED 127.0.0.1:5000"
- Backend not accessible. Ensure `FRONTEND_URL` in `.env` matches where backend is running.

### "MySQL connection refused"
- Database not running. Start with `brew services start mysql` or Docker.

### "Token invalid or expired"
- JWT_SECRET mismatch. Ensure same secret in backend `.env`.

### "Email already exists"
- User already registered. Sign up with different email or login.

---

## 📚 Next Steps (Phase 2+)

- [ ] Boards & projects
- [ ] Task management (create, update, delete, assign)
- [ ] Calendar view with events
- [ ] Team member invitations
- [ ] RBAC (Owner/Admin/Member/Viewer)
- [ ] Real-time updates with Socket.io
- [ ] Drag-and-drop task boards
- [ ] Advanced animations & notifications

---

## 📝 License

MIT

---

**Built with ❤️ for team collaboration**
