const Department = require('../models/Department');
const User       = require('../models/User');
const mongoose   = require('mongoose');

// ── GET ALL DEPARTMENTS ───────────────────────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({})
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error', data: [] });
  }
};

// ── GET ACTIVE DEPARTMENTS (public — used for dropdowns) ──────────────────────
exports.getActiveDepartments = async (req, res) => {
  try {
    const departments = await Department.findActive();
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error', data: [] });
  }
};

// ── CREATE DEPARTMENT — SUPER_ADMIN only ──────────────────────────────────────
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, color } = req.body;

    if (!name?.trim() || !code?.trim())
      return res.status(400).json({ success: false, message: 'Name and code are required' });

    const upperCode = code.trim().toUpperCase();

    // Reserved codes
    if (upperCode === 'NONE')
      return res.status(400).json({ success: false, message: '"NONE" is a reserved code' });

    if (await Department.existsByCode(upperCode))
      return res.status(409).json({ success: false, message: `Department code "${upperCode}" already exists` });

    const department = await Department.create({
      name: name.trim(),
      code: upperCode,
      color: color?.trim() || '#6366f1',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Department "${name}" created successfully`,
      data: department
    });
  } catch (err) {
    console.error('Create department error:', err);
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'Department code already exists' });
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ── UPDATE DEPARTMENT — SUPER_ADMIN only ──────────────────────────────────────
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid department ID' });

    const department = await Department.findById(id);
    if (!department)
      return res.status(404).json({ success: false, message: 'Department not found' });

    if (name?.trim()) department.name = name.trim();
    if (color?.trim()) department.color = color.trim();

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (err) {
    console.error('Update department error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ── TOGGLE DEPARTMENT ACTIVE STATUS — SUPER_ADMIN only ────────────────────────
exports.toggleDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid department ID' });

    const department = await Department.findById(id);
    if (!department)
      return res.status(404).json({ success: false, message: 'Department not found' });

    department.isActive = !department.isActive;
    await department.save();

    res.status(200).json({
      success: true,
      message: `Department ${department.isActive ? 'activated' : 'deactivated'} successfully`,
      data: department
    });
  } catch (err) {
    console.error('Toggle department error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ── DELETE DEPARTMENT — SUPER_ADMIN only ──────────────────────────────────────
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid department ID' });

    const department = await Department.findById(id);
    if (!department)
      return res.status(404).json({ success: false, message: 'Department not found' });

    // Check if any users are assigned to this department
    const usersWithDept = await User.countDocuments({ department: department.code, role: 'DEPARTMENT_ADMIN' });
    if (usersWithDept > 0)
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${usersWithDept} admin(s) are assigned to this department. Remove them first.`
      });

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: `Department "${department.name}" deleted permanently`
    });
  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
