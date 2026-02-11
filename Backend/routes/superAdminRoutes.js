const express = require('express');
const router = express.Router();
const {
  getPendingRequests,
  getActiveAdmins,
  getDisabledAdmins,
  approveUser,
  rejectUser,
  toggleAdminStatus,
  getDashboardStats,
  getAllTimetables
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and only accessible by SUPER_ADMIN
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/pending-requests', getPendingRequests);
router.get('/active-admins', getActiveAdmins);
router.get('/disabled-admins', getDisabledAdmins);
router.get('/stats', getDashboardStats);
router.get('/timetables', getAllTimetables);

router.put('/approve/:id', approveUser);
router.delete('/reject/:id', rejectUser);
router.put('/toggle-status/:id', toggleAdminStatus);

module.exports = router;