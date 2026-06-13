const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Mini Lead Management System API",
    version: "1.0.0",
    description: "Enterprise-grade production-ready API documentation for the Lead Management System CRM.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer access token to access protected routes.",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["ADMIN", "MANAGER", "AGENT"] },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Lead: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          source: { type: "string" },
          status: { type: "string", enum: ["NEW", "CONTACTED", "QUALIFIED", "LOST"] },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          notes: { type: "string" },
          assignedTo: { type: "string", format: "uuid", nullable: true },
          createdBy: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    "/api/v1/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "John Doe" },
                  email: { type: "string", example: "johndoe@example.com" },
                  password: { type: "string", example: "Password123" },
                  role: { type: "string", enum: ["ADMIN", "MANAGER", "AGENT"], default: "AGENT" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Invalid input or user already exists" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Login and get access token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@example.com" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful, sets httpOnly refresh token cookie" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        summary: "Refresh Access Token",
        tags: ["Auth"],
        description: "Rotates refresh token cookie and provides a new access token.",
        responses: {
          200: { description: "Token refreshed successfully" },
          401: { description: "Invalid/expired refresh token" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        summary: "Logout user",
        tags: ["Auth"],
        description: "Clears session refresh token in database and browser cookies.",
        responses: {
          200: { description: "Logout successful" },
        },
      },
    },
    "/api/v1/leads": {
      get: {
        summary: "Get all leads (Paginated, filtered, sorted, searchable)",
        tags: ["Leads"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["NEW", "CONTACTED", "QUALIFIED", "LOST"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] } },
          { name: "source", in: "query", schema: { type: "string" } },
          { name: "assignedTo", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "sortBy", in: "query", schema: { type: "string", default: "createdAt" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
        ],
        responses: {
          200: { description: "Leads list fetched successfully" },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Create a new lead (Admin & Manager only)",
        tags: ["Leads"],
        description: "Auto-assigns lead to the least-loaded sales agent, enriches company detail, sends notification mail.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "phone", "source"],
                properties: {
                  name: { type: "string", example: "Sarah Connor" },
                  email: { type: "string", example: "sconnor@cyberdyne.com" },
                  phone: { type: "string", example: "+15550199" },
                  source: { type: "string", example: "Website" },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
                  notes: { type: "string", example: "Follow up urgent." },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Lead created and assigned successfully" },
          400: { description: "Validation failure" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/leads/{id}": {
      get: {
        summary: "Get lead details by ID",
        tags: ["Leads"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Lead details fetched" },
          404: { description: "Lead not found" },
        },
      },
      put: {
        summary: "Update lead details",
        tags: ["Leads"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  source: { type: "string" },
                  status: { type: "string", enum: ["NEW", "CONTACTED", "QUALIFIED", "LOST"] },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                  notes: { type: "string" },
                  assignedTo: { type: "string", format: "uuid", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Lead updated successfully" },
          404: { description: "Lead not found" },
        },
      },
      delete: {
        summary: "Soft Delete Lead (Admin only)",
        tags: ["Leads"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Lead deleted successfully" },
          404: { description: "Lead not found" },
        },
      },
    },
    "/api/v1/users": {
      get: {
        summary: "Get users listing (Admin only)",
        tags: ["Users"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string", enum: ["ADMIN", "MANAGER", "AGENT"] } },
        ],
        responses: {
          200: { description: "Users list fetched" },
        },
      },
    },
    "/api/v1/users/{id}": {
      put: {
        summary: "Toggle user status or change role (Admin only)",
        tags: ["Users"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  isActive: { type: "boolean" },
                  role: { type: "string", enum: ["ADMIN", "MANAGER", "AGENT"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User modified successfully" },
        },
      },
    },
    "/api/v1/users/profile": {
      get: {
        summary: "Get current user profile",
        tags: ["Users"],
        responses: {
          200: { description: "Profile fetched" },
        },
      },
      put: {
        summary: "Update current user profile",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated" },
        },
      },
    },
    "/api/v1/users/agents": {
      get: {
        summary: "Get all active sales agents",
        tags: ["Users"],
        responses: {
          200: { description: "Agents fetched" },
        },
      },
    },
    "/api/v1/logs": {
      get: {
        summary: "Get audit logs (Admin/Manager see all, Agent sees own)",
        tags: ["Audit"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: { description: "Audit logs fetched" },
        },
      },
    },
    "/api/v1/dashboard": {
      get: {
        summary: "Get dashboard analytics and KPIs",
        tags: ["Dashboard"],
        responses: {
          200: { description: "Dashboard statistics fetched" },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
