# 🎓 Role-Based Timetable Management System

A complete enterprise-grade MERN stack application with role-based access control, real-time timetable management, and comprehensive admin controls.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)

## ✨ Features

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Pending approval workflow
- ✅ Super admin approval system

### Super Admin Features
- 📊 Dashboard with statistics
- 👥 Approve/Reject user requests
- 🔐 Enable/Disable admin accounts
- 👁️ View all timetables (read-only)
- 📈 Real-time stats tracking

### Department Admin Features
- 📅 Create custom timetables
- ✏️ Edit assigned cells only
- 🔒 Role-based cell locking
- 📄 Export timetables to PDF
- 📜 View edit history (last 2 entries)

### Timetable Management
- 🗓️ Flexible working days selection
- ⏰ Customizable periods per day
- 🎨 Beautiful grid-based UI
- 🔄 Real-time updates
- 📱 Fully responsive design

### UI/UX Design
- 🎨 Figma-inspired interface
- ✨ Framer Motion animations
- 🌊 Smooth transitions
- 💫 Micro-interactions
- 📱 Mobile-first approach

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client
- **jsPDF + html2canvas** - PDF export
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 🏗️ Architecture

### Database Schema

```javascript
// User Schema
{
  userId: String (unique, indexed),
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: Enum ['SUPER_ADMIN', 'ADMIN_CS', 'ADMIN_ECE', 'ADMIN_IT', 'ADMIN_MNC', 'ADMIN_ML', 'PENDING'],
  department: Enum ['CS', 'ECE', 'IT', 'MNC', 'ML', 'NONE'],
  isApproved: Boolean (indexed),
  isActive: Boolean (indexed),
  createdAt: Date
}

// Timetable Schema
{
  className: String (indexed),
  days: [String],
  periodsPerDay: Number,
  createdBy: ObjectId (ref: User, indexed),
  createdAt: Date
}

// TimetableCell Schema
{
  timetableId: ObjectId (ref: Timetable, indexed),
  day: String,
  period: Number,
  subject: String,
  department: Enum,
  editableByRole: String,
  history: [{
    previousValue: String,
    editedBy: ObjectId (ref: User),
    editedByName: String,
    timestamp: Date
  }] (max 2 entries)
}
```

### Folder Structure

```
timetable-management-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── superAdminController.js
│   │   └── timetableController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Timetable.js
│   │   └── TimetableCell.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── superAdminRoutes.js
│   │   └── timetableRoutes.js
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ApprovalModal.jsx
│   │   │   ├── CellHistoryModal.jsx
│   │   │   ├── CreateTimetableModal.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AwaitingApproval.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── SuperAdminDashboard.jsx
│   │   │   └── TimetableView.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone the repository
```bash
git clone <repository-url>
cd timetable-management-system
```

### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your MongoDB URI and JWT secret

# Seed database with demo users
npm run seed

# Start the server
npm start
# or for development
npm run dev
```

### Step 3: Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Step 4: Access the application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 👤 User Roles

### 1. SUPER_ADMIN
- User ID: `SA001`
- Password: `admin123`
- **Capabilities:**
  - View dashboard statistics
  - Approve/reject user registrations
  - Assign department roles
  - Enable/disable admin accounts
  - View all timetables (read-only)

### 2. Department Admins
Each department has its own admin:

| Department | User ID | Password | Role |
|------------|---------|----------|------|
| CS | CS001 | admin123 | ADMIN_CS |
| ECE | ECE001 | admin123 | ADMIN_ECE |
| IT | IT001 | admin123 | ADMIN_IT |
| MNC | MNC001 | admin123 | ADMIN_MNC |
| ML | ML001 | admin123 | ADMIN_ML |

**Capabilities:**
- Create timetables
- Edit cells from their department only
- Delete their timetables
- Export timetables to PDF
- View edit history

### 3. Pending Users
- User ID: `PU001`, `PU002`
- Password: `user123`
- **Status:** Awaiting approval

## 📖 Usage

### For Super Admin:
1. Login with super admin credentials
2. View pending user requests
3. Approve users by assigning roles and departments
4. Monitor active/disabled admins
5. View all timetables in read-only mode

### For Department Admins:
1. Login with department credentials
2. Create a new timetable
   - Enter class name
   - Select working days
   - Set periods per day
3. Edit timetable cells
   - Click on editable cells
   - Enter subject name
   - Assign to department (locks for others)
4. View cell history (last 2 edits)
5. Export to PDF

## 🔌 API Documentation

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
GET /api/auth/me - Get current user
```

### Super Admin
```
GET /api/super-admin/stats - Dashboard statistics
GET /api/super-admin/pending-requests - Get pending users
GET /api/super-admin/active-admins - Get active admins
GET /api/super-admin/disabled-admins - Get disabled admins
PUT /api/super-admin/approve/:id - Approve user
DELETE /api/super-admin/reject/:id - Reject user
PUT /api/super-admin/toggle-status/:id - Enable/disable admin
GET /api/super-admin/timetables - Get all timetables
```

### Timetables
```
POST /api/timetables - Create timetable
GET /api/timetables - Get all timetables (filtered by role)
GET /api/timetables/:id - Get single timetable with cells
PUT /api/timetables/cell/:cellId - Update cell
DELETE /api/timetables/:id - Delete timetable
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based authorization
- ✅ Protected API routes
- ✅ Input validation
- ✅ CORS enabled
- ✅ HTTP-only token storage

## 🎨 Design Highlights

- **Login Page**: Centered card with gradient background, floating labels
- **Dashboard**: Card-based layout with statistics and action buttons
- **Timetable Grid**: Hover effects, editable cells glow, locked cells with icons
- **Modals**: Smooth animations with backdrop blur
- **Mobile Responsive**: Works seamlessly on all devices
- **Micro-interactions**: Button hover effects, loading states, transitions

## 📝 Key Features Explained

### 1. Approval Workflow
- New users register but cannot login
- Request appears in Super Admin panel
- Super Admin assigns role and department
- User can then login with full access

### 2. Cell Locking
- When a cell is assigned to a department, only that department's admin can edit
- Other admins see a lock icon
- Prevents unauthorized modifications

### 3. Edit History
- Last 2 edits are tracked per cell
- Shows previous value, editor name, and timestamp
- Click history icon to view modal

### 4. PDF Export
- Clean academic layout
- Class name header
- Proper spacing and formatting
- Download with one click

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env file

**Port Already in Use:**
- Change PORT in backend .env
- Change port in frontend vite.config.js proxy

**JWT Token Issues:**
- Clear localStorage
- Login again

## 📄 License

This project is created for educational purposes.

## 👨‍💻 Author

Built with ❤️ using MERN Stack

---

**Happy Coding! 🚀**