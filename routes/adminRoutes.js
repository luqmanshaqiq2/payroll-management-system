import express from 'express';
import {
    createAdmin,
    loginAdmin,
    getAllAdmins,
    getAdminById,
    updateAdminPassword,
    deleteAdmin
} from '../controllers/adminController.js';

const router = express.Router();

// Admin routes
router.post('/create', createAdmin);
router.post('/login', loginAdmin);
router.get('/', getAllAdmins);
router.get('/:id', getAdminById);
router.put('/:id/password', updateAdminPassword);
router.delete('/:id', deleteAdmin);

export default router;
