import Admin from '../models/Admin.js';

// Create a new admin
export const createAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        const result = await Admin.create(username, password);
        
        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Login admin
export const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find admin by username
        const admin = await Admin.findByUsername(username);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isValidPassword = await admin.verifyPassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: admin.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all admins
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.getAll();
        
        res.status(200).json({
            success: true,
            message: 'Admins retrieved successfully',
            data: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get admin by ID
export const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findById(id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin retrieved successfully',
            data: admin.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update admin password
export const updateAdminPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const result = await Admin.updatePassword(id, newPassword);
        
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Admin.delete(id);
        
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
