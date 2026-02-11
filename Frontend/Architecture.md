# 🏗️ System Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Database Design](#database-design)
4. [Authentication Flow](#authentication-flow)
5. [Authorization Strategy](#authorization-strategy)
6. [API Design](#api-design)
7. [Frontend Architecture](#frontend-architecture)
8. [Security Considerations](#security-considerations)

## Overview

This is a **3-tier architecture** MERN stack application:
- **Presentation Layer**: React frontend with Tailwind CSS
- **Business Logic Layer**: Express.js backend with middleware
- **Data Layer**: MongoDB with Mongoose ODM

### Key Design Decisions

1. **Role-Based Access Control (RBAC)**: Six distinct user roles with granular permissions
2. **Cell-Level Permissions**: Individual timetable cells can be locked to specific departments
3. **History Tracking**: Last 2 edits tracked per cell with denormalized user data for performance
4. **Optimized Indexing**: Strategic database indexes for fast queries
5. **JWT Authentication**: Stateless authentication with token-based approach

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React App (Vite)                                    │   │
│  │  - Pages (Login, Dashboards, Timetable View)        │   │
│  │  - Components (Modals, Layout, Protected Routes)    │   │
│  │  - Context (Auth State Management)                  │   │
│  │  - Services (API Communication)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      SERVER LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js Server                                   │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Middleware Pipeline                           │ │   │
│  │  │  - CORS                                        │ │   │
│  │  │  - Body Parser                                 │ │   │
│  │  │  - Auth Middleware (JWT Verification)         │ │   │
│  │  │  - Role Authorization                          │ │   │
│  │  │  - Error Handler                               │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Route Handlers                                │ │   │
│  │  │  - /api/auth (register, login, getMe)         │ │   │
│  │  │  - /api/super-admin (RBAC: SUPER_ADMIN)       │ │   │
│  │  │  - /api/timetables (RBAC: All Admins)         │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Controllers                                   │ │   │
│  │  │  - authController (business logic)            │ │   │
│  │  │  - superAdminController                       │ │   │
│  │  │  - timetableController                        │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕ Mongoose ODM
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MongoDB                                             │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Collections:                                  │ │   │
│  │  │  - users (authentication & roles)              │ │   │
│  │  │  - timetables (class schedules)                │ │   │
│  │  │  - timetablecells (individual cells + history) │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  Indexes:                                            │   │
│  │  - userId, email (unique)                            │   │
│  │  - isApproved, isActive (filter queries)             │   │
│  │  - timetableId, day, period (cell lookup)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Database Design

### Users Collection
```javascript
{
  _id: ObjectId,
  userId: "CS001",                    // Indexed (unique)
  name: "CS Department Admin",
  email: "cs.admin@timetable.com",    // Indexed (unique)
  password: "$2a$10$hashedPassword",  // bcrypt hash
  role: "ADMIN_CS",                   // Enum
  department: "CS",                   // Enum
  isApproved: true,                   // Indexed
  isActive: true,                     // Indexed
  createdAt: ISODate("2024-01-01"),
  updatedAt: ISODate("2024-01-01")
}

// Compound Index: { isApproved: 1, isActive: 1, role: 1 }
// Purpose: Fast filtering for admin management queries
```

### Timetables Collection
```javascript
{
  _id: ObjectId,
  className: "CSE 3rd Year A",        // Indexed
  days: ["Monday", "Tuesday", ...],   // Array of working days
  periodsPerDay: 6,                   // Number of periods
  createdBy: ObjectId("user_id"),     // Indexed (ref: users)
  createdAt: ISODate("2024-01-01"),
  updatedAt: ISODate("2024-01-01")
}

// Compound Index: { createdBy: 1, createdAt: -1 }
// Purpose: Fast retrieval of user's timetables sorted by date
```

### TimetableCells Collection
```javascript
{
  _id: ObjectId,
  timetableId: ObjectId("tt_id"),     // Indexed (ref: timetables)
  day: "Monday",
  period: 1,
  subject: "Data Structures",
  department: "CS",                   // Indexed
  editableByRole: "ADMIN_CS",
  history: [                          // Max 2 entries
    {
      previousValue: "Database Systems",
      editedBy: ObjectId("user_id"),
      editedByName: "CS Admin",       // Denormalized for performance
      timestamp: ISODate("2024-01-15")
    },
    {
      previousValue: "Empty",
      editedBy: ObjectId("user_id"),
      editedByName: "CS Admin",
      timestamp: ISODate("2024-01-10")
    }
  ],
  createdAt: ISODate("2024-01-01"),
  updatedAt: ISODate("2024-01-15")
}

// Unique Compound Index: { timetableId: 1, day: 1, period: 1 }
// Purpose: Ensure one cell per day/period combination
// Additional Index: { timetableId: 1 }
// Purpose: Fast retrieval of all cells for a timetable
```

### Why These Indexes?

1. **userId & email (unique)**: Fast user lookup during login, prevent duplicates
2. **isApproved & isActive**: Super admin needs to filter users by status quickly
3. **timetableId**: Retrieving all cells for a timetable is the most common query
4. **day + period + timetableId (compound unique)**: Ensures data integrity, fast cell lookup
5. **createdBy**: Department admins see only their timetables

## Authentication Flow

### Registration Flow
```
┌──────┐      POST /api/auth/register      ┌────────┐
│Client├─────────────────────────────────►│Backend │
└──────┘   { userId, name, email, pass }   └────┬───┘
                                                 │
                                                 ▼
                                      ┌──────────────────┐
                                      │  Hash password   │
                                      │  with bcrypt     │
                                      └─────────┬────────┘
                                                │
                                                ▼
                                      ┌──────────────────┐
                                      │  Create user:    │
                                      │  isApproved=false│
                                      │  role=PENDING    │
                                      └─────────┬────────┘
                                                │
┌──────┐      { awaitingApproval: true }       │
│Client◄─────────────────────────────────────┘
└──┬───┘
   │
   ▼
┌──────────────────┐
│ Show "Awaiting   │
│ Approval" Screen │
└──────────────────┘
```

### Login Flow
```
┌──────┐      POST /api/auth/login         ┌────────┐
│Client├────────────────────────────────►│Backend │
└──────┘      { userId, password }         └────┬───┘
                                                 │
                                                 ▼
                                      ┌──────────────────┐
                                      │ Find user by ID  │
                                      └─────────┬────────┘
                                                │
                                                ▼
                                      ┌──────────────────┐
                                      │ Compare password │
                                      │ with bcrypt      │
                                      └─────────┬────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    │                       │
                              Not Approved              Approved
                                    │                       │
                                    ▼                       ▼
                          ┌─────────────────┐     ┌──────────────┐
                          │ Return status:  │     │ Generate JWT │
                          │ awaitingApproval│     │ token        │
                          └────────┬────────┘     └──────┬───────┘
                                   │                     │
┌──────┐                           │                     │
│Client◄───────────────────────────┴─────────────────────┘
└──┬───┘
   │
   ├─ If awaiting: Show approval screen
   └─ If approved: Store token, navigate to dashboard
```

### Protected Request Flow
```
┌──────┐     GET /api/timetables           ┌────────┐
│Client├──────────────────────────────────►│Backend │
└──────┘   Header: Authorization: Bearer    └────┬───┘
                    <JWT_TOKEN>                   │
                                                  ▼
                                      ┌───────────────────┐
                                      │ Extract token     │
                                      │ from header       │
                                      └─────────┬─────────┘
                                                │
                                                ▼
                                      ┌───────────────────┐
                                      │ Verify JWT token  │
                                      │ with secret       │
                                      └─────────┬─────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    │                       │
                               Invalid                   Valid
                                    │                       │
                                    ▼                       ▼
                          ┌─────────────────┐     ┌──────────────┐
                          │ Return 401      │     │ Decode userId│
                          │ Unauthorized    │     │ from token   │
                          └────────┬────────┘     └──────┬───────┘
                                   │                     │
                                   │                     ▼
                                   │           ┌──────────────────┐
                                   │           │ Fetch user from  │
                                   │           │ database         │
                                   │           └──────┬───────────┘
                                   │                  │
                                   │                  ▼
                                   │           ┌──────────────────┐
                                   │           │ Check isActive   │
                                   │           │ Check isApproved │
                                   │           └──────┬───────────┘
                                   │                  │
                                   │                  ▼
                                   │           ┌──────────────────┐
                                   │           │ Attach user to   │
                                   │           │ req.user         │
                                   │           └──────┬───────────┘
                                   │                  │
┌──────┐                           │                  │
│Client◄───────────────────────────┴──────────────────┘
└──────┘
```

## Authorization Strategy

### Middleware Chain
```javascript
// Example: Update timetable cell
router.put('/cell/:cellId',
  protect,              // 1. Verify JWT, attach user to request
  checkApproved,        // 2. Ensure user is approved
  authorize('ADMIN_CS', 'ADMIN_ECE', ...), // 3. Check role
  updateCell            // 4. Execute business logic
);
```

### Cell-Level Authorization Logic
```javascript
// In timetableController.updateCell()

const cell = await TimetableCell.findById(cellId);

// Rule 1: Super admin cannot edit (read-only access)
if (user.role === 'SUPER_ADMIN') {
  return 403 Forbidden;
}

// Rule 2: If cell has no department, anyone can edit
if (cell.department === 'NONE') {
  return allow;
}

// Rule 3: Only cell's department admin can edit
if (cell.department !== user.department) {
  return 403 Forbidden;
}

// Rule 4: When assigning department, user must own that department
if (newDepartment !== user.department) {
  return 403 Forbidden;
}

return allow;
```

## API Design

### RESTful Principles
- **Resource-based URLs**: `/api/timetables/:id`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- **JSON Responses**: Consistent structure with `success`, `message`, `data` fields

### Response Format
```javascript
// Success Response
{
  "success": true,
  "data": { ... },
  "count": 10  // For list responses
}

// Error Response
{
  "success": false,
  "message": "Error description"
}
```

## Frontend Architecture

### Component Hierarchy
```
App (Router + Auth Provider)
├── Login
├── AwaitingApproval
└── Layout (Sidebar + Main Content)
    ├── SuperAdminDashboard
    │   └── ApprovalModal
    ├── AdminDashboard
    │   └── CreateTimetableModal
    └── TimetableView
        └── CellHistoryModal
```

### State Management
```javascript
// Auth Context (Global State)
{
  user: {
    id, name, email, role, department,
    isApproved, isActive
  },
  loading: boolean,
  awaitingApproval: boolean,
  login: function,
  logout: function,
  register: function
}

// Component State (Local)
- Dashboard: timetables[], stats, activeTab
- TimetableView: cells[], editingCell, selectedCell
- Modals: formData, loading, validation errors
```

### Data Flow
```
User Action → API Call (services/api.js)
                  ↓
          Backend Processing
                  ↓
          Response Received
                  ↓
     Update Local State (useState)
                  ↓
         Re-render Component
                  ↓
           Updated UI
```

## Security Considerations

### 1. Password Security
- **Hashing**: bcrypt with salt rounds = 10
- **No plaintext storage**: Passwords never stored in plain text
- **Password field**: Excluded from queries by default (select: false)

### 2. JWT Security
- **Secret**: Stored in environment variable
- **Expiration**: 7 days (configurable)
- **Storage**: localStorage (client-side)
- **Transmission**: Authorization header (Bearer token)

### 3. Input Validation
- **Required fields**: Validated on both client and server
- **Email format**: Regex validation
- **Unique constraints**: Database-level enforcement
- **Enum validation**: Mongoose schema enums

### 4. Authorization
- **Role-based**: Middleware checks user role
- **Cell-level**: Business logic enforces department ownership
- **Super admin restrictions**: Cannot edit, only view

### 5. CORS
- **Enabled**: Allows frontend to communicate with backend
- **Production**: Should be restricted to specific origins

### 6. Error Handling
- **Generic messages**: Don't expose internal errors to client
- **Logging**: Console logs for debugging (should use proper logger in production)
- **Graceful degradation**: Fallback UI states for errors

## Performance Optimizations

### Database
1. **Strategic Indexing**: Fast lookups on frequently queried fields
2. **Denormalization**: User names stored in history for fewer joins
3. **Capped Arrays**: History limited to 2 entries (prevents unbounded growth)
4. **Compound Indexes**: Optimize multi-field queries

### Frontend
1. **Code Splitting**: React lazy loading (not implemented but recommended)
2. **Memoization**: Prevent unnecessary re-renders
3. **Debouncing**: Input fields (recommended for search)
4. **Optimistic UI**: Update UI before server response (not implemented)

### Backend
1. **Connection Pooling**: MongoDB handles connection reuse
2. **Async/Await**: Non-blocking I/O operations
3. **Middleware Caching**: Token verification result attached to request

## Scalability Considerations

### Horizontal Scaling
- **Stateless Backend**: JWT tokens allow multiple server instances
- **Database**: MongoDB sharding for large datasets
- **Load Balancer**: Distribute traffic across servers

### Vertical Scaling
- **Database Indexing**: Maintains performance as data grows
- **Pagination**: Add to list endpoints when needed
- **Compression**: gzip responses (not implemented)

---

This architecture provides a solid foundation for a production-ready application with proper separation of concerns, security measures, and scalability options.