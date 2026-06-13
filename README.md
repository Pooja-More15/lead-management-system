# Mini Lead Management System (Waanee CRM)

An enterprise-grade, production-ready Full Stack Mini Lead Management CRM built using Node.js, Express, PostgreSQL, Prisma ORM, React (Vite), Tailwind CSS, Framer Motion, and WebSockets (Socket.io).

---

## Table of Contents
1. [Key Features](#key-features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Folder Structure](#folder-structure)
5. [Prerequisites](#prerequisites)
6. [Environment Variables](#environment-variables)
7. [Database Setup & Design](#database-setup--design)
8. [Local Setup Guide](#local-setup-guide)
9. [Docker Compose Guide](#docker-compose-guide)
10. [API Documentation](#api-documentation)
11. [Assumptions Made](#assumptions-made)
12. [Tradeoffs Considered](#tradeoffs-considered)

---

## Key Features
- **JWT Rotation & Security:** Rotates refresh tokens on every request to prevent cookie hijacking/token reuse attacks. Access tokens are stored safely in memory.
- **Least-Loaded Auto-Assignment:** Assigns leads to the active sales agent with the minimum count of open leads using a `Serializable` Prisma transaction for concurrency safety.
- **Realtime Notifications:** Socket.io emits assignment toasts, badge counts, and dashboard analytics refreshes in real-time.
- **Soft Deletes:** Prevents data loss by soft-deleting leads (`is_deleted` flag).
- **Lead Status History:** Full audit trails of status updates.
- **External Enrichment:** Automatically fetches profile photos and domain data from randomuser.me on lead creation.
- **Theme Persistence:** Stores user theme settings (Dark/Light mode) in localStorage.

---

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, React Hook Form, Zod, Framer Motion, Recharts, Axios, Socket.io-client.
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL, Winston Logger, Morgan HTTP logger, Helmet security, Express rate-limiter, Nodemailer.

---

## Architecture Overview
The system follows a classic **MVC (Model-View-Controller)** pattern combined with a service-based architecture:
```
  [ React Client ]  <--->  [ Socket.io Server ]
        |
        v (HTTP / HTTPS)
  [ Express App ]  --->  [ Middlewares (Auth, RBAC, Rate Limit) ]
        |
        v
  [ Controllers (V1) ]  --->  [ Services (Assignment, Mail, Enrichment) ]
        |
        v
  [ Prisma Client ]  <--->  [ PostgreSQL DB ]
```

---

## Folder Structure
```
├── backend/
│   ├── prisma/             # Schema, migrations, seeder
│   ├── src/
│   │   ├── config/         # db, winston logger, nodemailer config
│   │   ├── controllers/    # Express controllers
│   │   ├── services/       # Lead assignment, enrichment, mail
│   │   ├── routes/         # Express routes (V1)
│   │   ├── middlewares/    # Auth, RBAC, audit, validate, rate-limiter
│   │   ├── validations/    # Zod validation schemas
│   │   ├── utils/          # ApiError, Response formatter, async wrappers
│   │   ├── constants/      # Roles and permissions mapping
│   │   ├── helpers/        # JWT helpers, token signers
│   │   ├── sockets/        # Socket.io event triggers
│   │   └── tests/          # Jest unit tests
│   ├── server.js           # Express + Socket.io Server boot
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios interceptor configs
│   │   ├── components/     # Buttons, inputs, modals, layout parts
│   │   ├── context/        # Auth, Theme, WebSockets contexts
│   │   ├── pages/          # Login, Register, Dashboard, Leads...
│   │   ├── hooks/          # useDebounce, useTheme
│   │   ├── layouts/        # Dashboard view wrappers
│   │   └── App.jsx         # App router and permissions guards
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Docker & Docker Compose (optional for container setup)

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL=postgresql://postgres:1234@localhost:5432/lead_management_system
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_refresh_secret
EMAIL_USER=example@gmail.com
EMAIL_PASS=app_password
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## Database Setup & Design

### Database Design Explanation
The database consists of five primary tables in a PostgreSQL schema managed via Prisma ORM:

```
                  +-------------------+
                  |       users       |
                  +-------------------+
                  | id (UUID, PK)     |
                  | name              |
                  | email (UQ)        |
                  | password          |
                  | role (Enum)       |
                  | is_active         |
                  | created_by (FK)   |
                  | last_login        |
                  | created_at        |
                  | updated_at        |
                  +---------+---------+
                            |
         +------------------+------------------+
         | 1-to-Many        | 1-to-Many        | 1-to-Many
         v                  v                  v
+--------+--------+  +------+------+  +--------+--------+
| refresh_tokens  |  |    leads    |  |  activity_logs  |
+-----------------+  +-------------+  +-----------------+
| id (UUID, PK)   |  | id (PK)     |  | id (UUID, PK)   |
| user_id (FK)    |  | name        |  | user_id (FK)    |
| token (UQ)      |  | email       |  | lead_id (FK)    |
| expires_at      |  | phone       |  | target_user(FK) |
| created_at      |  | source      |  | action          |
+-----------------+  | status(Enum)|  | description     |
                     | priority(En)|  | ip_address      |
                     | notes       |  | user_agent      |
                     | assigned(FK)|  | created_at      |
                     | created(FK) |  +-----------------+
                     | is_deleted  |
                     | deleted_at  |
                     | created_at  |
                     | updated_at  |
                     +------+------+
                            | 1-to-Many
                            v
                 +----------+----------+
                 | lead_status_history |
                 +---------------------+
                 | id (UUID, PK)       |
                 | lead_id (FK)        |
                 | old_status (Enum)   |
                 | new_status (Enum)   |
                 | changed_by (FK)     |
                 | changed_at          |
                 +---------------------+
```

#### 1. Users Table (`users`)
Stores user profiles and credentials.
- `role`: Enum mapping to `ADMIN`, `MANAGER`, or `AGENT`.
- `is_active`: Boolean flag allowing soft deletion (deactivation) of users.
- `createdBy`: Relates back to `users.id` representing the administrator who registered the account.

#### 2. Leads Table (`leads`)
Holds lead details.
- `status`: Enum mapping to `NEW`, `CONTACTED`, `QUALIFIED`, or `LOST`.
- `priority`: Enum mapping to `LOW`, `MEDIUM`, `HIGH`, or `URGENT`.
- `isDeleted` and `deletedAt`: Support soft deletion.
- `assignedTo`: FK pointing to `users.id` (null if unassigned).
- `createdBy`: FK pointing to `users.id`.

#### 3. Refresh Tokens Table (`refresh_tokens`)
Manages active sessions for JWT Refresh Token Rotation security.
- `token`: Unique token string hash.
- `userId`: FK pointing to `users.id`.
- `expiresAt`: Expiry timestamp.

#### 4. Activity Logs Table (`activity_logs`)
Captures all critical operations (Lead Creation, Status Change, Assignment, Login) for audit trails.
- Includes IP address and User-Agent tracking.

#### 5. Lead Status History Table (`lead_status_history`)
Maintains a state transition history for leads to analyze conversion times.

### Database Index Decisions
- **`users(email)`**: Unique index for extremely fast O(1) login credentials matching.
- **`leads(email, source, status, assignedTo, priority)`**: Indexes applied on search, filter, and assignment fields to ensure optimal performance when handling large datasets.

---

## Local Setup Guide

### 1. PostgreSQL Database Initialization
Make sure PostgreSQL is running on port 5432, connect, and run the following command to create the database:
```sql
CREATE DATABASE lead_management_system;
```

### 2. Backend Installation
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```
*The database will seed with default credentials:*
- **Admin:** `admin@example.com` / `password123`
- **Manager:** `manager@example.com` / `password123`
- **Agent:** `agent@example.com` / `password123`
- **Agent 2:** `agent2@example.com` / `password123`

### 3. Frontend Installation
```bash
cd ../frontend
npm install
npm run dev
```

---

## Docker Compose Guide
To boot the entire full stack (Postgre, Backend API, Frontend React App) in isolated containers:
```bash
docker-compose up --build
```
This initializes:
- Frontend on `http://localhost:5173`
- Backend API on `http://localhost:5000`
- PostgreSQL on port `5432`

---

## API Documentation

### 1. Authentication Endpoints (`/api/v1/auth`)

#### `POST /register`
Creates a user profile (defaults to `AGENT` role).
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": { "id": "uuid", "name": "John Doe", "email": "john@example.com", "role": "AGENT" }
  }
  ```

#### `POST /login`
Authenticates a user, returns a short-lived Access Token, and sets a secure `HTTPOnly` Refresh Cookie.
- **Body:**
  ```json
  {
    "email": "admin@example.com",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": "uuid", "name": "Admin User", "email": "admin@example.com", "role": "ADMIN" },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### `POST /refresh`
Rotates the session token, generating a new Access Token and new Refresh Cookie.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
  ```

---

### 2. Lead Management Endpoints (`/api/v1/leads`)

#### `POST /`
Creates a new lead. Auto-assigns the lead to the least-loaded active Agent.
- **Permissions:** `ADMIN`, `MANAGER`
- **Body:**
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "9876543210",
    "source": "Google Search",
    "priority": "HIGH",
    "notes": "Interested in premium subscription"
  }
  ```
- **Response (210 Created):** Returns lead data and assignee details.

#### `GET /`
Fetches a list of leads (paginated, filterable, searchable).
- **Permissions:** `ADMIN`, `MANAGER`
- **Query Params:** `page`, `limit`, `status`, `source`, `priority`, `assignedTo`, `search`, `sortBy`, `sortOrder`

#### `GET /my-leads`
Fetches leads assigned exclusively to the authenticated Agent.
- **Permissions:** `AGENT`

#### `GET /:id`
Fetches a single lead by ID. (Verifies Agent boundaries if role is `AGENT`).
- **Response (200 OK):** Returns lead record, status history, and activity logs.

#### `PUT /:id`
Updates lead properties.
- **Permissions:** `ADMIN`, `MANAGER`, `AGENT` (Agents can only update `status` and `notes`).

#### `PATCH /:id/assign`
Manually assigns a lead to an active agent.
- **Permissions:** `ADMIN`, `MANAGER`
- **Body:**
  ```json
  {
    "assignedTo": "agent-uuid-here"
  }
  ```

#### `DELETE /:id`
Soft deletes a lead (sets `is_deleted = true`).
- **Permissions:** `ADMIN`

---

### 3. User Management Endpoints (`/api/v1/users`)

#### `GET /agents`
Fetches a list of active agents (used to populate assignment selectors).
- **Permissions:** `ADMIN`, `MANAGER`

#### `POST /`
Registers a new user with a specified role.
- **Permissions:** `ADMIN`
- **Body:** `{ "name": "Jane", "email": "jane@example.com", "password": "pass", "role": "MANAGER" }`

#### `PATCH /:id/status`
Toggles the `isActive` flag (soft delete/deactivation) of a user account.
- **Permissions:** `ADMIN`

---

### 4. Dashboard & Analytics (`/api/v1/dashboard`)

#### `GET /`
Provides aggregated statistics (Lead Count by Status, Source distribution, Conversion Rate, and Agent Performance charts).
- **Permissions:** `ADMIN`, `MANAGER` (Agent-restricted version returns only the agent's individual metrics).

---

## Assumptions Made
1. **Agent Self-Sufficiency:** Agents are only allowed to see leads explicitly assigned to them. They cannot view other agents' leads, general company metrics, or user list dashboards.
2. **Auto-Assignment Eligibility:** Leads can only be assigned to users with the role of `AGENT` who are currently marked `is_active = true`. Admins and Managers are not eligible to be assigned leads.
3. **External Domain/Profile Photo Fetching:** The background lookup retrieves a random avatar representation from `randomuser.me` based on the email domain prefix. If the server is offline, the operation degrades gracefully with a default fallback avatar.
4. **Soft Deletion Constraints:** When a lead is soft-deleted, it is omitted from metrics, counts, and lists. However, audit records and status history references are preserved for historical record-keeping.

---

## Tradeoffs Considered

### 1. Database Lock Level for Auto-Assignment
- **Alternative:** Running standard `prisma.user.findMany` followed by standard `prisma.lead.create` (Read-then-Write).
- **Tradeoff:** Leads to race conditions under load, resulting in double-assignment anomalies or incorrect least-loaded counts.
- **Decision:** Used a database transaction with `Serializable` isolation level. Although it incurs slight transaction overhead, it ensures absolute mathematical correctness during high concurrent lead spikes.

### 2. Session Management Strategy (JWT Rotation vs DB Sessions)
- **Alternative:** Stateless JWTs or server-side Redis sessions.
- **Tradeoff:** Stateless JWTs cannot be invalidated easily, whereas Redis sessions introduce additional operational cache overhead.
- **Decision:** Implemented **Refresh Token Rotation (RTR)**. Access tokens remain stateless in memory, while refresh tokens are stored in the database. If a refresh token is reused, all sessions for that user are terminated immediately, offering high security with minimal database query impact.

### 3. Custom Regex UUID Validation vs `uuid` NPM Library
- **Alternative:** Standard package `require('uuid').validate`.
- **Tradeoff:** Using the latest ES-Module compiled dependencies (like `uuid` v14) can trigger import conflicts in Node.js CommonJS Jest suites.
- **Decision:** Implemented a custom regex validator `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` within the route middleware and controller checks. This delivers identical validation accuracy while eliminating ES-Module compilation dependencies in the test environment.
