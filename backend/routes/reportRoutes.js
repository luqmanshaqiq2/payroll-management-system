const express = require('express');
const router = express.Router();
const {
  generatePayrollSummaryReport,
  generateAttendanceSummaryReport,
  generateEmployeeSummaryReport,
  getAllReports,
  getReportById,
  deleteReport
} = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Report generation routes
router.post('/payroll-summary', authorizeRoles('super_admin', 'admin', 'hr'), generatePayrollSummaryReport);
router.post('/attendance-summary', authorizeRoles('super_admin', 'admin', 'hr'), generateAttendanceSummaryReport);
router.post('/employee-summary', authorizeRoles('super_admin', 'admin', 'hr'), generateEmployeeSummaryReport);

// Report management routes
router.get('/', authorizeRoles('super_admin', 'admin', 'hr'), getAllReports);
router.get('/:id', authorizeRoles('super_admin', 'admin', 'hr'), getReportById);
router.delete('/:id', authorizeRoles('super_admin', 'admin'), deleteReport);

module.exports = router;
