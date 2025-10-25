const express = require('express');
const router = express.Router();
const {
  createAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  approveAttendance,
  getAttendanceStats,
  getMonthlySummary,
  updateExistingAttendanceOvertime
} = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateAttendance } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Attendance management routes
router.post('/', authorizeRoles('super_admin', 'admin', 'hr'), validateAttendance, createAttendance);
router.get('/', authorizeRoles('super_admin', 'admin', 'hr'), getAllAttendance);
router.get('/stats', authorizeRoles('super_admin', 'admin', 'hr'), getAttendanceStats);
router.get('/monthly-summary', authorizeRoles('super_admin', 'admin', 'hr'), getMonthlySummary);
router.get('/update-overtime', authorizeRoles('super_admin', 'admin', 'hr'), updateExistingAttendanceOvertime);
router.get('/:id', authorizeRoles('super_admin', 'admin', 'hr'), getAttendanceById);
router.put('/:id', authorizeRoles('super_admin', 'admin', 'hr'), updateAttendance);
router.patch('/:id/approve', authorizeRoles('super_admin', 'admin', 'hr'), approveAttendance);

module.exports = router;
