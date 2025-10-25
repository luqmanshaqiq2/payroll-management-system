const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const validation = require('../middleware/validation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Debug logging (safe to keep during development)
console.log('[adminRoutes] adminController ->', Object.keys(adminController));
console.log('[adminRoutes] authMiddleware ->', Object.keys(authMiddleware));
console.log('[adminRoutes] validation ->', Object.keys(validation));

// Safely extract functions with fallbacks to avoid "undefined" crashes
const {
  registerAdmin = (req, res) => res.status(501).json({ success: false, message: 'registerAdmin not implemented' }),
  loginAdmin = (req, res) => res.status(501).json({ success: false, message: 'loginAdmin not implemented' }),
  getAllAdmins = (req, res) => res.status(501).json({ success: false, message: 'getAllAdmins not implemented' }),
  getAdminById = (req, res) => res.status(501).json({ success: false, message: 'getAdminById not implemented' }),
  updateAdmin = (req, res) => res.status(501).json({ success: false, message: 'updateAdmin not implemented' }),
  deleteAdmin = (req, res) => res.status(501).json({ success: false, message: 'deleteAdmin not implemented' }),
  getCurrentAdmin = (req, res) => res.status(501).json({ success: false, message: 'getCurrentAdmin not implemented' }),
  updateCurrentAdmin = (req, res) => res.status(501).json({ success: false, message: 'updateCurrentAdmin not implemented' }),
  uploadProfilePhoto = (req, res) => res.status(501).json({ success: false, message: 'uploadProfilePhoto not implemented' }),
} = adminController;

const { authenticateToken, authorizeRoles } = authMiddleware;
const { validateAdminRegistration, validateAdminLogin } = validation;

// -------------------- PUBLIC ROUTES --------------------
router.post('/register', validateAdminRegistration, registerAdmin);
router.post('/login', validateAdminLogin, loginAdmin);

// -------------------- PROTECTED ROUTES --------------------
router.use(authenticateToken);

router.get('/', authorizeRoles('super_admin', 'admin'), getAllAdmins);
router.get('/:id', authorizeRoles('super_admin', 'admin'), getAdminById);
router.put('/:id', authorizeRoles('super_admin', 'admin'), updateAdmin);
router.delete('/:id', authorizeRoles('super_admin'), deleteAdmin);

// Profile management routes
router.get('/profile', getCurrentAdmin);
router.put('/profile', updateCurrentAdmin);
router.post('/profile/photo', upload.single('photo'), uploadProfilePhoto);

module.exports = router;
