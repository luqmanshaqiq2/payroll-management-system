// middleware/validation.js
const { body, validationResult, oneOf } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ========================= ADMIN VALIDATIONS =========================
const validateAdminRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'hr'])
    .withMessage('Invalid role'),
  handleValidationErrors
];

// ✅ Updated to match controller logic (identifier / username / email)
const validateAdminLogin = [
  oneOf(
    [
      body('email').isEmail().withMessage('Please provide a valid email'),
      body('username').isLength({ min: 3 }).withMessage('Please provide a valid username'),
    ],
    'Please provide a valid email or username'
  ),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// ========================= EMPLOYEE VALIDATIONS =========================
const validateEmployee = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('hireDate')
    .isISO8601()
    .withMessage('Please provide a valid hire date'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
  body('position')
    .notEmpty()
    .withMessage('Position is required'),
  body('salary')
    .isNumeric()
    .withMessage('Salary must be a number'),
  body('employmentType')
    .optional()
    .isIn(['full_time', 'part_time', 'contract', 'intern'])
    .withMessage('Invalid employment type'),
  handleValidationErrors
];

// ========================= ATTENDANCE VALIDATIONS =========================
const validateAttendance = [
  body('employeeId')
    .isInt()
    .withMessage('Employee ID must be a valid integer'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('checkIn')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('checkOut')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half_day', 'leave'])
    .withMessage('Invalid status'),
  handleValidationErrors
];

// ========================= PAYROLL VALIDATIONS =========================
const validatePayroll = [
  body('employeeId')
    .isInt()
    .withMessage('Employee ID must be a valid integer'),
  body('payPeriodStart')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('payPeriodEnd')
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  body('basicSalary')
    .isNumeric()
    .withMessage('Basic salary must be a number'),
  body('grossPay')
    .isNumeric()
    .withMessage('Gross pay must be a number'),
  body('totalDeductions')
    .isNumeric()
    .withMessage('Total deductions must be a number'),
  body('netPay')
    .isNumeric()
    .withMessage('Net pay must be a number'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateAdminRegistration,
  validateAdminLogin,
  validateEmployee,
  validateAttendance,
  validatePayroll
};
