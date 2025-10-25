const express = require('express');
const router = express.Router();
const {
  createPayroll,
  getAllPayroll,
  getPayrollById,
  updatePayroll,
  processPayroll,
  markPayrollAsPaid,
  getPayrollStats,
  generateBulkPayroll,
  getBulkPayrollPreview,
  approveBulkPayroll,
  createBulkPayrollFromPreview,
  generatePayslip,
  generateBulkPayslips
} = require('../controllers/payrollController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validatePayroll } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Payroll management routes
router.post('/', authorizeRoles('super_admin', 'admin'), validatePayroll, createPayroll);
router.get('/', authorizeRoles('super_admin', 'admin', 'hr'), getAllPayroll);
router.get('/stats', authorizeRoles('super_admin', 'admin', 'hr'), getPayrollStats);
router.get('/:id', authorizeRoles('super_admin', 'admin', 'hr'), getPayrollById);
router.put('/:id', authorizeRoles('super_admin', 'admin'), updatePayroll);
router.patch('/:id/process', authorizeRoles('super_admin', 'admin'), processPayroll);
router.patch('/:id/mark-paid', authorizeRoles('super_admin', 'admin'), markPayrollAsPaid);

// Bulk payroll routes
router.get('/bulk/preview', authorizeRoles('super_admin', 'admin', 'hr'), getBulkPayrollPreview);
router.post('/bulk/generate', authorizeRoles('super_admin', 'admin'), generateBulkPayroll);
router.post('/bulk/approve', authorizeRoles('super_admin', 'admin'), approveBulkPayroll);
router.post('/bulk/create', authorizeRoles('super_admin', 'admin'), createBulkPayrollFromPreview);

// Payslip generation routes
router.get('/payslip/:id', authorizeRoles('super_admin', 'admin', 'hr'), generatePayslip);
router.post('/payslips/bulk', authorizeRoles('super_admin', 'admin', 'hr'), generateBulkPayslips);

module.exports = router;
