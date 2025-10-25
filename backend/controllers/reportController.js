const { Report, Employee, Attendance, Payroll } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Generate payroll summary report
const generatePayrollSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.body;
    const generatedBy = req.user.id;

    const whereClause = {};
    if (startDate && endDate) {
      whereClause.payPeriodStart = {
        [Op.between]: [startDate, endDate]
      };
    }
    if (status) whereClause.status = status;

    // Get payroll data with employee information
    const payrolls = await Payroll.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          where: department ? { department } : undefined,
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'department', 'position']
        }
      ],
      order: [['payPeriodStart', 'DESC']]
    });

    // Calculate summary statistics
    const totalGrossPay = payrolls.reduce((sum, payroll) => sum + parseFloat(payroll.grossPay), 0);
    const totalNetPay = payrolls.reduce((sum, payroll) => sum + parseFloat(payroll.netPay), 0);
    const totalDeductions = payrolls.reduce((sum, payroll) => sum + parseFloat(payroll.totalDeductions), 0);

    const reportData = {
      summary: {
        totalRecords: payrolls.length,
        totalGrossPay,
        totalNetPay,
        totalDeductions,
        averageGrossPay: payrolls.length > 0 ? totalGrossPay / payrolls.length : 0,
        averageNetPay: payrolls.length > 0 ? totalNetPay / payrolls.length : 0
      },
      payrolls: payrolls.map(payroll => ({
        id: payroll.id,
        employee: payroll.employee,
        payPeriod: {
          start: payroll.payPeriodStart,
          end: payroll.payPeriodEnd
        },
        grossPay: payroll.grossPay,
        netPay: payroll.netPay,
        totalDeductions: payroll.totalDeductions,
        status: payroll.status,
        payDate: payroll.payDate
      }))
    };

    // Save report to database
    const report = await Report.create({
      reportType: 'payroll_summary',
      title: `Payroll Summary Report - ${startDate} to ${endDate}`,
      description: `Payroll summary report for the period ${startDate} to ${endDate}`,
      reportData,
      filters: { startDate, endDate, department, status },
      dateRange: { startDate, endDate },
      generatedBy,
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Payroll summary report generated successfully',
      data: { report, reportData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating payroll summary report',
      error: error.message
    });
  }
};

// Generate attendance summary report
const generateAttendanceSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, department } = req.body;
    const generatedBy = req.user.id;

    const whereClause = {};
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }
    if (employeeId) whereClause.employeeId = employeeId;

    // Get attendance data
    const attendances = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          where: department ? { department } : undefined,
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'department', 'position']
        }
      ],
      order: [['date', 'DESC']]
    });

    // Calculate summary statistics
    const totalRecords = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'present').length;
    const absentCount = attendances.filter(a => a.status === 'absent').length;
    const lateCount = attendances.filter(a => a.status === 'late').length;
    const totalHours = attendances.reduce((sum, attendance) => sum + parseFloat(attendance.totalHours || 0), 0);

    const reportData = {
      summary: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0,
        totalHours,
        averageHoursPerDay: totalRecords > 0 ? totalHours / totalRecords : 0
      },
      attendances: attendances.map(attendance => ({
        id: attendance.id,
        employee: attendance.employee,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        totalHours: attendance.totalHours,
        status: attendance.status,
        isApproved: attendance.isApproved
      }))
    };

    // Save report to database
    const report = await Report.create({
      reportType: 'attendance_summary',
      title: `Attendance Summary Report - ${startDate} to ${endDate}`,
      description: `Attendance summary report for the period ${startDate} to ${endDate}`,
      reportData,
      filters: { startDate, endDate, employeeId, department },
      dateRange: { startDate, endDate },
      generatedBy,
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Attendance summary report generated successfully',
      data: { report, reportData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating attendance summary report',
      error: error.message
    });
  }
};

// Generate employee summary report
const generateEmployeeSummaryReport = async (req, res) => {
  try {
    const { department, position, status, employmentType } = req.body;
    const generatedBy = req.user.id;

    const whereClause = {};
    if (department) whereClause.department = department;
    if (position) whereClause.position = position;
    if (status) whereClause.status = status;
    if (employmentType) whereClause.employmentType = employmentType;

    // Get employee data
    const employees = await Employee.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    // Calculate summary statistics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;
    const averageSalary = employees.length > 0 ? 
      employees.reduce((sum, emp) => sum + parseFloat(emp.salary), 0) / employees.length : 0;

    // Department breakdown
    const departmentBreakdown = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {});

    // Employment type breakdown
    const employmentTypeBreakdown = employees.reduce((acc, emp) => {
      acc[emp.employmentType] = (acc[emp.employmentType] || 0) + 1;
      return acc;
    }, {});

    const reportData = {
      summary: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        averageSalary,
        departmentBreakdown,
        employmentTypeBreakdown
      },
      employees: employees.map(employee => ({
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        salary: employee.salary,
        employmentType: employee.employmentType,
        status: employee.status,
        hireDate: employee.hireDate
      }))
    };

    // Save report to database
    const report = await Report.create({
      reportType: 'employee_summary',
      title: 'Employee Summary Report',
      description: 'Comprehensive employee summary report',
      reportData,
      filters: { department, position, status, employmentType },
      generatedBy,
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Employee summary report generated successfully',
      data: { report, reportData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating employee summary report',
      error: error.message
    });
  }
};

// Get all reports
const getAllReports = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      reportType, 
      status,
      generatedBy,
      sortBy = 'generatedAt',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (reportType) whereClause.reportType = reportType;
    if (status) whereClause.status = status;
    if (generatedBy) whereClause.generatedBy = generatedBy;

    const { count, rows } = await Report.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      success: true,
      data: {
        reports: rows,
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
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// Get report by ID
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

// Delete report
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.destroy();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
};

module.exports = {
  generatePayrollSummaryReport,
  generateAttendanceSummaryReport,
  generateEmployeeSummaryReport,
  getAllReports,
  getReportById,
  deleteReport
};
