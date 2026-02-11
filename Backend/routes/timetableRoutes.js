const express = require('express');
const router = express.Router();

const {
  createTimetable,
  getTimetables,
  getTimetable,
  updateCell,
  deleteTimetable
} = require('../controllers/timetableController');

const { protect, authorize } = require('../middleware/auth');

// 🔐 Protect all routes
router.use(protect);

// 📌 Routes
router.route('/')
  .post(
    authorize('ADMIN_CS', 'ADMIN_ECE', 'ADMIN_IT', 'ADMIN_MNC', 'ADMIN_ML'),
    createTimetable
  )
  .get(getTimetables);

router.route('/:id')
  .get(getTimetable)
  .delete(
    authorize(
      'ADMIN_CS',
      'ADMIN_ECE',
      'ADMIN_IT',
      'ADMIN_MNC',
      'ADMIN_ML',
      'SUPER_ADMIN'
    ),
    deleteTimetable
  );

router.put(
  '/cell/:cellId',
  authorize('ADMIN_CS', 'ADMIN_ECE', 'ADMIN_IT', 'ADMIN_MNC', 'ADMIN_ML'),
  updateCell
);

module.exports = router;
