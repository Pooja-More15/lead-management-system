# AI Usage Disclosure - Mini Lead Management System

This document outlines the collaborative engineering boundaries and details of AI and manual development in building, debugging, and auditing this CRM Lead Management System.

---

## 1. AI Tools & Models Used
- **Primary AI Agent:** Antigravity (Google DeepMind agentic framework).
- **Core LLM Engine:** Gemini 3.5 Flash (High).
- **Tooling Scope:** Codebase generation, Prisma schema configurations, React component structuring, real-time WebSocket events integration, test planning, and documentation mapping.

---

## 2. Tasks Performed by AI
- **System Architecture Scaffolding:** Configured the directory structures, dependencies list, and configuration wrappers (`db.js`, `logger.js`, `nodemailer` transporter fallback structure).
- **Prisma Schema Design:** Structured database tables, foreign key relations, custom Enums (Role, LeadStatus, LeadPriority), indices, and soft deletion flags.
- **Middleware Infrastructure:** Setup auth middleware, Zod parser validator schema mappings, and RBAC permission controllers.
- **Core Lead Assignment Logic:** Built the concurrent-safe least-loaded agent assignment query executed inside Prisma transactions with Serializable isolation levels.
- **WebSocket Event Binds:** Standardized real-time update triggers (`lead:assigned`, `dashboard:refresh`, `lead:status_updated`) to connect frontend components with backend actions.
- **Automated Test Scaffolds:** Created Jest test suites for auth helpers, middleware logic, assignment computations, and UUID check validation handlers.

---

## 3. Human Review, Verification & Manual Engineering Decisions
- **Custom Regex-based UUID Validation:**
  - *Context:* The AI initially configured the backend routes and controllers to use the npm `uuid` package. This package's latest ES-Module distribution caused import compilation errors in Jest/CommonJS environments.
  - *Engineering Decision:* Implemented a custom regex-based check (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) inside `validateUuid.js` and exported it to all controllers. This resolved ESM build collisions, bypassed unnecessary npm package load overhead, and verified UUID parameter syntax correctly.
- **Express Route Collision Debugging:**
  - *Context:* The parametric route `/:id` in `userRoutes.js` was intercepting the endpoint `/users/agents`, causing Prisma to attempt casting `'agents'` as a UUID, throwing database exceptions.
  - *Engineering Decision:* Manually reordered route lists to declare static resource paths (`/users/agents`) before param paths (`/users/:id`), and applied parameter guards.
- **Database Connection Configs:** Set and tested local PostgreSQL connection details, mapping credentials to port `5432` with the `lead_management_system` database.
- **SMTP Nodemailer Console Logger Fallback:** Configured transporter errors to fall back gracefully to standard console logging if valid custom SMTP configurations are missing.
- **Framer Motion Tweaks:** Fine-tuned speeds, transition curves, and UI animation configurations on the frontend for smooth screen switching.
