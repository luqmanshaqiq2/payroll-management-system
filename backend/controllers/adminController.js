const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Admin } = require('../models');
const path = require('path');
const fs = require('fs');

const registerAdmin = async (req, res) => {
  try {
    console.log('[registerAdmin] incoming body ->', req.body);

    const { username, email, password, firstName, lastName, role = 'admin' } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this username or email already exists'
      });
    }

    // Create new admin
    const admin = await Admin.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          isActive: admin.isActive
        },
        token
      }
    });
  } catch (error) {
    console.error('[registerAdmin] error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error registering admin',
      error: error.message
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    console.log('[loginAdmin] incoming body ->', req.body);

    const { username, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Missing password' });
    }

    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing credentials: provide username or email',
      });
    }

    const whereClause = username
      ? { username }
      : { email };

    const admin = await Admin.findOne({ where: whereClause });

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials (user not found)' });
    }

    const matches = await admin.checkPassword(password);
    if (!matches) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials (wrong password)' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          lastLogin: admin.lastLogin,
        },
        token,
      },
    });
  } catch (error) {
    console.error('[loginAdmin] error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Error logging in', error: error.message });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (role) whereClause.role = role;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const { count, rows: admins } = await Admin.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
        admins,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('[getAllAdmins] error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching admins',
      error: error.message
    });
  }
};

const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.json({
      success: true,
      data: { admin }
    });
  } catch (error) {
    console.error('[getAdminById] error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin',
      error: error.message
    });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, role, isActive } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if username or email already exists (excluding current admin)
    if (username || email) {
      const existingAdmin = await Admin.findOne({
        where: {
          [Op.or]: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : [])
          ],
          id: { [Op.ne]: id }
        }
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
    }

    // Update admin
    await admin.update({
      ...(username && { username }),
      ...(email && { email }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive })
    });

    return res.json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          isActive: admin.isActive
        }
      }
    });
  } catch (error) {
    console.error('[updateAdmin] error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating admin',
      error: error.message
    });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent deleting super_admin
    if (admin.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin'
      });
    }

    await admin.destroy();

    return res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('[deleteAdmin] error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting admin',
      error: error.message
    });
  }
};

// Get current admin profile
const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.json({
      success: true,
      data: { admin }
    });
  } catch (error) {
    console.error('[getCurrentAdmin] error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin profile',
      error: error.message
    });
  }
};

// Update current admin profile
const updateCurrentAdmin = async (req, res) => {
  try {
    const { username, email, firstName, lastName, currentPassword, newPassword } = req.body;
    const admin = await Admin.findByPk(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }

      const isCurrentPasswordValid = await admin.checkPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Check if username or email already exists (excluding current admin)
    if (username || email) {
      const existingAdmin = await Admin.findOne({
        where: {
          [Op.or]: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : [])
          ],
          id: { [Op.ne]: req.user.id }
        }
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
    }

    // Update admin
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (newPassword) updateData.password = newPassword;

    await admin.update(updateData);

    // Fetch updated admin without password
    const updatedAdmin = await Admin.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: updatedAdmin
      }
    });
  } catch (error) {
    console.error('[updateCurrentAdmin] error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Upload profile photo
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const admin = await Admin.findByPk(req.user.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Delete old photo if exists
    if (admin.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '..', 'uploads', 'profiles', path.basename(admin.profilePhoto));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update admin with new photo path
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    await admin.update({ profilePhoto: photoUrl });

    return res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        photoUrl: photoUrl
      }
    });
  } catch (error) {
    console.error('[uploadProfilePhoto] error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading profile photo',
      error: error.message
    });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  getCurrentAdmin,
  updateCurrentAdmin,
  uploadProfilePhoto
};
