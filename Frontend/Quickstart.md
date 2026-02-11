# 🚀 Quick Start Guide

## Prerequisites
- Node.js v16+ installed
- MongoDB installed and running (or MongoDB Atlas account)

## Installation (5 minutes)

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Backend Environment
Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/timetable_management
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Seed Database with Demo Users
```bash
cd backend
npm run seed
```

This creates:
- 1 Super Admin (SA001 / admin123)
- 5 Department Admins (CS001, ECE001, IT001, MNC001, ML001 / admin123)
- 2 Pending Users (PU001, PU002 / user123)

### 4. Start Backend Server
```bash
npm start
# Server runs on http://localhost:5000
```

### 5. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 6. Start Frontend Server
```bash
npm run dev
# App runs on http://localhost:3000
```

## 🎯 First Steps

### Login as Super Admin
1. Go to http://localhost:3000
2. Login with:
   - User ID: `SA001`
   - Password: `admin123`
3. Approve pending users
4. View dashboard statistics

### Login as Department Admin
1. Login with:
   - User ID: `CS001` (or ECE001, IT001, MNC001, ML001)
   - Password: `admin123`
2. Create a timetable
3. Edit cells and assign to your department
4. Export to PDF

### Test Approval Workflow
1. Login with:
   - User ID: `PU001`
   - Password: `user123`
2. See "Awaiting Approval" screen
3. Login as Super Admin (SA001)
4. Approve the pending user
5. Login again as PU001 with assigned role

## 📊 Demo Workflow

### Scenario 1: Super Admin Workflow
```
1. Login as SA001
2. Check pending requests tab
3. Click "Approve" on pending user
4. Assign role: ADMIN_CS, Department: CS
5. User is now active and can login
6. Toggle admin status to disable/enable
```

### Scenario 2: Creating Timetable
```
1. Login as CS001
2. Click "Create Timetable"
3. Enter class name: "CSE 3rd Year A"
4. Select days: Monday to Friday
5. Set periods: 6
6. Click "Create Timetable"
7. View created timetable
```

### Scenario 3: Editing Timetable
```
1. Open timetable
2. Click on any cell
3. Enter subject: "Data Structures"
4. Select department: CS
5. Click "Save"
6. Cell is now locked for other departments
7. View history by hovering and clicking history icon
```

### Scenario 4: Export to PDF
```
1. Open any timetable
2. Click "Export PDF" button
3. PDF is downloaded with clean layout
```

## 🔧 Troubleshooting

### MongoDB not running
```bash
# Start MongoDB
mongod

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/timetable
```

### Port already in use
```bash
# Kill process on port 5000
kill -9 $(lsof -ti:5000)

# Or change port in .env
PORT=5001
```

### Clear application data
```javascript
// In browser console
localStorage.clear()
```

## 📁 Project Structure
```
timetable-management-system/
├── backend/          # Node.js + Express + MongoDB
│   ├── config/       # Database configuration
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth & error handling
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API routes
│   └── server.js     # Entry point
├── frontend/         # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # State management
│   │   ├── pages/       # Page components
│   │   └── services/    # API calls
│   └── vite.config.js
└── README.md
```

## 🎨 Color Scheme
- Primary: Blue (#0ea5e9)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Danger: Red (#ef4444)

## 🔐 Default Credentials

| Role | User ID | Password | Department |
|------|---------|----------|------------|
| Super Admin | SA001 | admin123 | - |
| CS Admin | CS001 | admin123 | CS |
| ECE Admin | ECE001 | admin123 | ECE |
| IT Admin | IT001 | admin123 | IT |
| MNC Admin | MNC001 | admin123 | MNC |
| ML Admin | ML001 | admin123 | ML |
| Pending User | PU001 | user123 | - |
| Pending User | PU002 | user123 | - |

## 📞 Need Help?

Check the full README.md for detailed documentation.

---

**You're all set! 🎉**