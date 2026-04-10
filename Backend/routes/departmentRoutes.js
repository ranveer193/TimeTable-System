const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getActiveDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

// Public — active departments (for dropdowns, approval modal, etc.)
router.get('/active', protect, getActiveDepartments);

// Super Admin only
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.route('/')
  .get(getDepartments)
  .post(createDepartment);

router.route('/:id')
  .put(updateDepartment)
  .delete(deleteDepartment);

router.put('/:id/toggle', toggleDepartment);

module.exports = router;
