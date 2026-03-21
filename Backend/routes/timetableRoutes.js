const express = require('express');
const router  = express.Router();
const {
  createTimetable, copyTimetable, getTimetables, getTimetable,
  updateCell, getActivityLog, deleteTimetable
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ── Collection ────────────────────────────────────────────────────────────────
router.route('/')
  .get(getTimetables)
  .post(authorize('SUPER_ADMIN'), createTimetable);

// ── Cell edit (before /:id to avoid conflict) ─────────────────────────────────
router.put(
  '/cell/:cellId',
  authorize('ADMIN_CS', 'ADMIN_ECE', 'ADMIN_IT', 'ADMIN_MNC', 'ADMIN_ML'),
  updateCell
);

// ── Sub-resource routes before generic /:id ───────────────────────────────────
router.post('/:id/copy',         authorize('SUPER_ADMIN'), copyTimetable);
router.get('/:id/activity-log',  getActivityLog);

// ── Single timetable ──────────────────────────────────────────────────────────
router.route('/:id')
  .get(getTimetable)
  .delete(authorize('SUPER_ADMIN'), deleteTimetable);

module.exports = router;