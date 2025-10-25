const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByEmployeeId,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats
} = require('../controllers/employeeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateEmployee } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Employee management routes
router.post('/', authorizeRoles('super_admin', 'admin', 'hr'), validateEmployee, createEmployee);
router.get('/', authorizeRoles('super_admin', 'admin', 'hr'), getAllEmployees);
router.get('/stats', authorizeRoles('super_admin', 'admin', 'hr'), getEmployeeStats);
router.get('/employee-id/:employeeId', authorizeRoles('super_admin', 'admin', 'hr'), getEmployeeByEmployeeId);
router.get('/:id', authorizeRoles('super_admin', 'admin', 'hr'), getEmployeeById);
router.put('/:id', authorizeRoles('super_admin', 'admin', 'hr'), updateEmployee);
router.delete('/:id', authorizeRoles('super_admin', 'admin'), deleteEmployee);

module.exports = router;
