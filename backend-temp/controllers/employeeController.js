const { Employee } = require('../models');
const { Op } = require('sequelize');

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;
    const employee = await Employee.create(employeeData);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
};

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      department, 
      position, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (department) whereClause.department = department;
    if (position) whereClause.position = position;
    if (status) whereClause.status = status;
    
    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      success: true,
      data: {
        employees: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};

// Get employee by employeeId string
const getEmployeeByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ where: { employeeId } });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.update(updateData);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Check if password is provided
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Admin password is required to delete employee'
      });
    }

    // Verify admin password
    const admin = req.user;
    const isPasswordValid = await admin.checkPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin password'
      });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.destroy();

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};

// Get employee statistics
const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.count();
    const activeEmployees = await Employee.count({ where: { status: 'active' } });
    const inactiveEmployees = await Employee.count({ where: { status: 'inactive' } });
    const terminatedEmployees = await Employee.count({ where: { status: 'terminated' } });

    // Department statistics
    const departmentStats = await Employee.findAll({
      attributes: [
        'department',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('id')), 'count']
      ],
      group: ['department']
    });

    // Employment type statistics
    const employmentTypeStats = await Employee.findAll({
      attributes: [
        'employmentType',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('id')), 'count']
      ],
      group: ['employmentType']
    });

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        terminatedEmployees,
        departmentStats,
        employmentTypeStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee statistics',
      error: error.message
    });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByEmployeeId,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats
};
