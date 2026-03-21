const express = require('express');
const router  = express.Router();
const { getPublicTimetable } = require('../controllers/timetableController');

// No auth middleware — fully public
router.get('/timetable/:token', getPublicTimetable);

module.exports = router;