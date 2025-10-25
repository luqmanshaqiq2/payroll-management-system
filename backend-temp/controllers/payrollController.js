const { Payroll, Employee, Attendance } = require('../models');
const { Op } = require('sequelize');

// Create payroll record
const createPayroll = async (req, res) => {
  try {
    const payrollData = req.body;
    
    // Check if payroll record already exists for this employee and pay period
    const existingPayroll = await Payroll.findOne({
      where: {
        employeeId: payrollData.employeeId,
        payPeriodStart: payrollData.payPeriodStart,
        payPeriodEnd: payrollData.payPeriodEnd
      }
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll record already exists for this pay period'
      });
    }

    const payroll = await Payroll.create(payrollData);

    res.status(201).json({
      success: true,
      message: 'Payroll record created successfully',
      data: { payroll }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating payroll record',
      error: error.message
    });
  }
};

// Get all payroll records
const getAllPayroll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      employeeId, 
      status,
      payPeriodStart,
      payPeriodEnd,
      sortBy = 'payPeriodStart',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (employeeId) whereClause.employeeId = employeeId;
    if (status) whereClause.status = status;
    
    // Pay period filter
    if (payPeriodStart && payPeriodEnd) {
      whereClause.payPeriodStart = {
        [Op.between]: [payPeriodStart, payPeriodEnd]
      };
    }

    const { count, rows } = await Payroll.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'department', 'position']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      success: true,
      data: {
        payrolls: rows,
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
      message: 'Error fetching payroll records',
      error: error.message
    });
  }
};

// Get payroll by ID
const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'department', 'position']
        }
      ]
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.json({
      success: true,
      data: { payroll }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll record',
      error: error.message
    });
  }
};

// Update payroll
const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const payroll = await Payroll.findByPk(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    await payroll.update(updateData);

    res.json({
      success: true,
      message: 'Payroll record updated successfully',
      data: { payroll }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payroll record',
      error: error.message
    });
  }
};

// Process payroll
const processPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { processedBy } = req.body;

    const payroll = await Payroll.findByPk(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    await payroll.update({
      status: 'approved',
      processedBy,
      processedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Payroll processed successfully',
      data: { payroll }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payroll',
      error: error.message
    });
  }
};

// Mark payroll as paid
const markPayrollAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { payDate, paymentMethod } = req.body;

    const payroll = await Payroll.findByPk(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    await payroll.update({
      status: 'paid',
      payDate: payDate || new Date(),
      paymentMethod: paymentMethod || 'bank_transfer'
    });

    res.json({
      success: true,
      message: 'Payroll marked as paid successfully',
      data: { payroll }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking payroll as paid',
      error: error.message
    });
  }
};

// Get payroll statistics
const getPayrollStats = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    const whereClause = {};
    if (employeeId) whereClause.employeeId = employeeId;
    if (startDate && endDate) {
      whereClause.payPeriodStart = {
        [Op.between]: [startDate, endDate]
      };
    }

    const totalPayrolls = await Payroll.count({ where: whereClause });
    const pendingPayrolls = await Payroll.count({ 
      where: { ...whereClause, status: 'pending' } 
    });
    const approvedPayrolls = await Payroll.count({ 
      where: { ...whereClause, status: 'approved' } 
    });
    const paidPayrolls = await Payroll.count({ 
      where: { ...whereClause, status: 'paid' } 
    });

    // Total amounts
    const totalGrossPay = await Payroll.sum('grossPay', { where: whereClause });
    const totalNetPay = await Payroll.sum('netPay', { where: whereClause });
    const totalDeductions = await Payroll.sum('totalDeductions', { where: whereClause });

    // Status breakdown
    const statusStats = await Payroll.findAll({
      attributes: [
        'status',
        [Payroll.sequelize.fn('COUNT', Payroll.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status']
    });

    res.json({
      success: true,
      data: {
        totalPayrolls,
        pendingPayrolls,
        approvedPayrolls,
        paidPayrolls,
        totalGrossPay: totalGrossPay || 0,
        totalNetPay: totalNetPay || 0,
        totalDeductions: totalDeductions || 0,
        statusStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll statistics',
      error: error.message
    });
  }
};

// Generate bulk payroll for all active employees
const generateBulkPayroll = async (req, res) => {
  try {
    const { payPeriodStart, payPeriodEnd, processedBy } = req.body;
    
    if (!payPeriodStart || !payPeriodEnd) {
      return res.status(400).json({
        success: false,
        message: 'Pay period start and end dates are required'
      });
    }

    // Get all active employees
    const employees = await Employee.findAll({
      where: { status: 'active' }
    });

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active employees found'
      });
    }

    const payrollRecords = [];
    const errors = [];

    // Process each employee
    for (const employee of employees) {
      try {
        // Check if payroll already exists for this period
        const existingPayroll = await Payroll.findOne({
          where: {
            employeeId: employee.id,
            payPeriodStart,
            payPeriodEnd
          }
        });

        if (existingPayroll) {
          errors.push(`Payroll already exists for ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
          continue;
        }

        // Get attendance records for the pay period
        const attendanceRecords = await Attendance.findAll({
          where: {
            employeeId: employee.id,
            date: {
              [Op.between]: [payPeriodStart, payPeriodEnd]
            }
          }
        });

        // Calculate working hours and overtime
        let totalWorkingHours = 0;
        let overtimeHours = 0;
        let daysWorked = 0;

        attendanceRecords.forEach(record => {
          if (record.status !== 'absent') {
            totalWorkingHours += parseFloat(record.totalHours) || 0;
            overtimeHours += parseFloat(record.overtimeHours) || 0;
            daysWorked += 1;
          }
        });

        // Calculate gross pay
        const basicSalary = parseFloat(employee.salary) || 0;
        const overtimePay = overtimeHours * (basicSalary / 160); // Assuming 160 hours per month
        const grossPay = basicSalary + overtimePay;

        // Calculate deductions based on employment type
        let taxDeduction = 0;
        let epfDeduction = 0;
        let etfDeduction = 0;

        if (employee.employmentType !== 'intern') {
          // Calculate tax using Sri Lankan tax brackets
          if (grossPay <= 150000) {
            taxDeduction = 0;
          } else if (grossPay <= 233333) {
            taxDeduction = (grossPay - 150000) * 0.06;
          } else if (grossPay <= 275000) {
            taxDeduction = (233333 - 150000) * 0.06 + (grossPay - 233333) * 0.18;
          } else if (grossPay <= 316666) {
            taxDeduction = (233333 - 150000) * 0.06 + (275000 - 233333) * 0.18 + (grossPay - 275000) * 0.24;
          } else if (grossPay <= 358333) {
            taxDeduction = (233333 - 150000) * 0.06 + (275000 - 233333) * 0.18 + (316666 - 275000) * 0.24 + (grossPay - 316666) * 0.30;
          } else {
            taxDeduction = (233333 - 150000) * 0.06 + (275000 - 233333) * 0.18 + (316666 - 275000) * 0.24 + (358333 - 316666) * 0.30 + (grossPay - 358333) * 0.30;
          }

          // EPF (8% of gross pay) - Only EPF deduction, no ETF
          epfDeduction = grossPay * 0.08;
          
          // ETF is now 0 - removed as per requirement
          etfDeduction = 0;
        }

        const totalDeductions = taxDeduction + epfDeduction + etfDeduction;
        const netPay = grossPay - totalDeductions;

        payrollRecords.push({
          employeeId: employee.id,
          payPeriodStart,
          payPeriodEnd,
          basicSalary,
          overtimePay,
          bonus: 0,
          allowances: 0,
          grossPay,
          taxDeduction,
          socialSecurity: epfDeduction,
          healthInsurance: etfDeduction,
          otherDeductions: 0,
          totalDeductions,
          netPay,
          status: 'pending',
          processedBy,
          processedAt: new Date(),
          notes: `Auto-generated bulk payroll. Hours: ${totalWorkingHours.toFixed(2)}, Days: ${daysWorked}`
        });

      } catch (error) {
        errors.push(`Error processing ${employee.firstName} ${employee.lastName}: ${error.message}`);
      }
    }

    // Create all payroll records in a transaction
    const createdPayrolls = await Payroll.bulkCreate(payrollRecords);

    res.status(201).json({
      success: true,
      message: `Bulk payroll generated successfully for ${createdPayrolls.length} employees`,
      data: {
        payrolls: createdPayrolls,
        totalProcessed: createdPayrolls.length,
        errors: errors.length > 0 ? errors : null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating bulk payroll',
      error: error.message
    });
  }
};

// Get bulk payroll preview (all employees with calculated data)
const getBulkPayrollPreview = async (req, res) => {
  try {
    const { payPeriodStart, payPeriodEnd } = req.query;
    
    if (!payPeriodStart || !payPeriodEnd) {
      return res.status(400).json({
        success: false,
        message: 'Pay period start and end dates are required'
      });
    }

    // Get all employees who have attendance records in the pay period
    const attendanceRecords = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [payPeriodStart, payPeriodEnd]
        }
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'salary', 'employmentType', 'department', 'position', 'status']
        }
      ],
      order: [['employeeId', 'ASC']]
    });

    console.log(`Found ${attendanceRecords.length} attendance records in pay period`);
    console.log(`Pay period: ${payPeriodStart} to ${payPeriodEnd}`);
    
    // Debug: Check if employee with ID 7 exists in employees table
    const employeeWithId7 = await Employee.findByPk(7);
    console.log(`Employee with ID 7: ${employeeWithId7 ? 'EXISTS' : 'NOT FOUND'}`);
    if (employeeWithId7) {
      console.log(`Employee ID 7 details: ${employeeWithId7.employeeId} (${employeeWithId7.firstName} ${employeeWithId7.lastName})`);
    }
    
    // Debug: Check if EMP007's attendance records have employee data
    const emp007Records = attendanceRecords.filter(record => record.employeeId === 7);
    console.log(`Found ${emp007Records.length} attendance records for employeeId 7`);
    emp007Records.forEach(record => {
      console.log(`Record ID ${record.id}: employeeId=${record.employeeId}, employee=${record.employee ? 'FOUND' : 'NOT FOUND'}`);
      if (record.employee) {
        console.log(`Employee data: ${record.employee.employeeId} (${record.employee.firstName} ${record.employee.lastName})`);
      } else {
        console.log(`ERROR: No employee found for attendance record ${record.id} with employeeId ${record.employeeId}`);
      }
    });
    
    // Get unique employees from attendance records
    const employeeMap = new Map();
    attendanceRecords.forEach(record => {
      if (record.employee) {
        employeeMap.set(record.employee.id, record.employee);
      } else {
        console.log(`Warning: Attendance record ${record.id} has no employee data (employeeId: ${record.employeeId})`);
      }
    });
    
    const employees = Array.from(employeeMap.values()).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
    
    console.log(`Found ${employees.length} employees with attendance records`);
    console.log('Employee IDs with attendance:', employees.map(emp => emp.employeeId));

    // Check if EMP007 and EMP008 exist in attendance records
    const emp007Attendance = attendanceRecords.filter(record => record.employee && record.employee.employeeId === 'EMP007');
    const emp008Attendance = attendanceRecords.filter(record => record.employee && record.employee.employeeId === 'EMP008');
    console.log('EMP007 attendance records:', emp007Attendance.length);
    console.log('EMP008 attendance records:', emp008Attendance.length);
    
    // Debug: Check all employee IDs in attendance records
    const allEmployeeIds = attendanceRecords.map(record => record.employee ? record.employee.employeeId : `NO_EMPLOYEE_${record.employeeId}`);
    console.log('All employee IDs in attendance records:', allEmployeeIds);
    
    // Debug: Check if there are any records with employeeId 7 or 8
    const recordsWithId7 = attendanceRecords.filter(record => record.employeeId === 7);
    const recordsWithId8 = attendanceRecords.filter(record => record.employeeId === 8);
    console.log(`Records with employeeId 7: ${recordsWithId7.length}`);
    console.log(`Records with employeeId 8: ${recordsWithId8.length}`);
    
    // Debug: Show dates of attendance records for employees 7 and 8
    if (recordsWithId7.length > 0) {
      console.log('Employee 7 attendance dates:', recordsWithId7.map(r => r.date));
    }
    if (recordsWithId8.length > 0) {
      console.log('Employee 8 attendance dates:', recordsWithId8.map(r => r.date));
    }
    
    // Debug: Check ALL attendance records for employees 7 and 8 (regardless of date)
    const allRecordsFor7 = await Attendance.findAll({
      where: { employeeId: 7 },
      include: [{ model: Employee, as: 'employee' }]
    });
    const allRecordsFor8 = await Attendance.findAll({
      where: { employeeId: 8 },
      include: [{ model: Employee, as: 'employee' }]
    });
    console.log(`Total attendance records for employee 7: ${allRecordsFor7.length}`);
    console.log(`Total attendance records for employee 8: ${allRecordsFor8.length}`);
    if (allRecordsFor7.length > 0) {
      console.log('Employee 7 all dates:', allRecordsFor7.map(r => r.date));
    }
    if (allRecordsFor8.length > 0) {
      console.log('Employee 8 all dates:', allRecordsFor8.map(r => r.date));
    }

    const payrollPreview = [];

    for (const employee of employees) {
      // Get attendance records for this specific employee
      const employeeAttendanceRecords = attendanceRecords.filter(record => 
        record.employee && record.employee.id === employee.id
      );


      // Calculate working hours and overtime
      let totalWorkingHours = 0;
      let overtimeHours = 0;
      let daysWorked = 0;
      let absentDays = 0;

      employeeAttendanceRecords.forEach(record => {
        if (record.status === 'absent' || record.status === 'leave') {
          // Absent and leave days don't count for payroll
          if (record.status === 'absent') {
            absentDays += 1;
          }
        } else {
          // Only present, half_day, and late count for payroll
          const recordTotalHours = parseFloat(record.totalHours) || 0;
          const recordOvertimeHours = parseFloat(record.overtimeHours) || 0;
          
          totalWorkingHours += recordTotalHours;
          overtimeHours += recordOvertimeHours;
          daysWorked += 1;
        }
      });

      // Calculate gross pay
      const basicSalary = parseFloat(employee.salary) || 0;
      const overtimePay = overtimeHours * (basicSalary / 160);
      const grossPay = basicSalary + overtimePay;

      // Calculate deductions
      let taxDeduction = 0;
      let epfDeduction = 0;
      let etfDeduction = 0;

      if (employee.employmentType !== 'intern') {
        // Tax calculation
        if (grossPay <= 150000) {
          taxDeduction = 0;
        } else if (grossPay <= 233333) {
          taxDeduction = (grossPay - 150000) * 0.06;
        } else if (grossPay <= 275000) {
          taxDeduction = (233333 - 150000) * 0.06 + (grossPay - 233333) * 0.18;
        } else if (grossPay <= 316666) {
          taxDeduction = (233333 - 150000) * 0.06 + (275000 - 233333) * 0.18 + (grossPay - 275000) * 0.24;
        } else if (grossPay <= 358333) {
          taxDeduction = (233333 - 150000) * 0.06 + (275000 - 233333) * 0.18 + (316666 - 275000) * 0.24 + (grossPay - 316666) * 0.30;
        } else {
          taxDeduction = (233333 - 150000) * 0.06 + (275000 - 233333) * 0.18 + (316666 - 275000) * 0.24 + (358333 - 316666) * 0.30 + (grossPay - 358333) * 0.30;
        }

        // EPF (8% of gross pay) - Only EPF deduction, no ETF
        epfDeduction = grossPay * 0.08;
        // ETF is now 0 - removed as per requirement
        etfDeduction = 0;
      }

      const totalDeductions = taxDeduction + epfDeduction + etfDeduction;
      const netPay = grossPay - totalDeductions;


      payrollPreview.push({
        employeeId: employee.employeeId, // String employee ID for display
        employeeDbId: employee.id, // Database ID for payroll creation
        employeeName: `${employee.firstName} ${employee.lastName}`,
        role: employee.employmentType,
        department: employee.department,
        position: employee.position,
        hoursWorked: totalWorkingHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
        daysWorked,
        absentDays,
        grossPay: grossPay.toFixed(2),
        epf: epfDeduction.toFixed(2),
        etf: etfDeduction.toFixed(2),
        tax: taxDeduction.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        netPay: netPay.toFixed(2),
        status: 'ready',
        isIntern: employee.employmentType === 'intern'
      });
    }

    // Calculate totals
    const totals = payrollPreview.reduce((acc, emp) => ({
      totalGross: acc.totalGross + parseFloat(emp.grossPay),
      totalDeductions: acc.totalDeductions + parseFloat(emp.totalDeductions),
      totalNet: acc.totalNet + parseFloat(emp.netPay),
      totalEmployees: acc.totalEmployees + 1
    }), { totalGross: 0, totalDeductions: 0, totalNet: 0, totalEmployees: 0 });

    res.json({
      success: true,
      data: {
        payrollPreview,
        totals: {
          ...totals,
          totalGross: totals.totalGross.toFixed(2),
          totalDeductions: totals.totalDeductions.toFixed(2),
          totalNet: totals.totalNet.toFixed(2)
        },
        payPeriod: { payPeriodStart, payPeriodEnd }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll preview',
      error: error.message
    });
  }
};

// Approve bulk payroll
const approveBulkPayroll = async (req, res) => {
  try {
    const { payrollIds, approvedBy } = req.body;
    
    if (!payrollIds || payrollIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payroll IDs are required'
      });
    }

    // Update all payroll records to approved status
    await Payroll.update(
      { 
        status: 'approved',
        processedBy: approvedBy,
        processedAt: new Date()
      },
      { 
        where: { 
          id: { [Op.in]: payrollIds } 
        } 
      }
    );

    res.json({
      success: true,
      message: `Bulk payroll approved successfully for ${payrollIds.length} employees`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving bulk payroll',
      error: error.message
    });
  }
};

// Create bulk payroll records from preview data
const createBulkPayrollFromPreview = async (req, res) => {
  try {
    const { payrollData, payPeriodStart, payPeriodEnd, processedBy } = req.body;
    
    
    if (!payrollData || payrollData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payroll data is required'
      });
    }

    if (!payPeriodStart || !payPeriodEnd) {
      return res.status(400).json({
        success: false,
        message: 'Pay period start and end dates are required'
      });
    }

    // Check if payroll has already been processed for this period
    const existingPayrollForPeriod = await Payroll.findOne({
      where: {
        payPeriodStart,
        payPeriodEnd,
        status: { [Op.in]: ['approved', 'paid'] }
      }
    });

    if (existingPayrollForPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Payroll for this month has already been processed'
      });
    }

    const createdPayrolls = [];
    const errors = [];

    // Process each employee's payroll data
    for (const employee of payrollData) {
      try {
        // Get employee database ID first
        const employeeRecord = await Employee.findOne({
          where: { employeeId: employee.employeeId }
        });

        if (!employeeRecord) {
          errors.push(`Employee not found: ${employee.employeeName} (${employee.employeeId})`);
          continue;
        }

        // Check if payroll record already exists for this employee and pay period
        const existingPayroll = await Payroll.findOne({
          where: {
            employeeId: employeeRecord.id,
            payPeriodStart,
            payPeriodEnd
          }
        });

        if (existingPayroll) {
          errors.push(`Payroll already exists for ${employee.employeeName} (${employee.employeeId})`);
          continue;
        }

        // Employee record already found above

        // Calculate overtime pay from hours
        const overtimePay = parseFloat(employee.overtimeHours) * (parseFloat(employee.grossPay) / 160);
        const basicSalary = parseFloat(employee.grossPay) - overtimePay;

        // Create payroll record
        const payrollRecord = {
          employeeId: employeeRecord.id, // Use database ID
          payPeriodStart,
          payPeriodEnd,
          basicSalary: basicSalary,
          overtimePay: overtimePay,
          grossPay: parseFloat(employee.grossPay),
          taxDeduction: parseFloat(employee.tax),
          totalDeductions: parseFloat(employee.totalDeductions),
          netPay: parseFloat(employee.netPay),
          status: 'approved',
          processedBy: processedBy || 5, // Use existing admin ID
          processedAt: new Date(),
          notes: `Bulk payroll processing for ${payPeriodStart} to ${payPeriodEnd}`
        };

        const createdPayroll = await Payroll.create(payrollRecord);
        createdPayrolls.push(createdPayroll);

      } catch (error) {
        errors.push(`Error creating payroll for ${employee.employeeName}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk payroll created successfully for ${createdPayrolls.length} employees`,
      data: {
        payrolls: createdPayrolls,
        totalCreated: createdPayrolls.length,
        errors: errors.length > 0 ? errors : null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating bulk payroll records',
      error: error.message
    });
  }
};

// Generate individual payslip
const generatePayslip = async (req, res) => {
  try {
    const { payrollId } = req.params;
    
    const payroll = await Payroll.findByPk(payrollId, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employeeId', 'firstName', 'lastName', 'email', 'department', 'position', 'hireDate']
        }
      ]
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Get attendance records for the pay period
    const attendanceRecords = await Attendance.findAll({
      where: {
        employeeId: payroll.employeeId,
        date: {
          [Op.between]: [payroll.payPeriodStart, payroll.payPeriodEnd]
        }
      }
    });

    // Calculate attendance summary
    const attendanceSummary = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter(r => r.status === 'present').length,
      absentDays: attendanceRecords.filter(r => r.status === 'absent').length,
      totalHours: attendanceRecords.reduce((sum, r) => sum + parseFloat(r.totalHours || 0), 0),
      overtimeHours: attendanceRecords.reduce((sum, r) => sum + parseFloat(r.overtimeHours || 0), 0)
    };

    const payslipData = {
      employee: payroll.employee,
      payroll: payroll,
      attendance: attendanceSummary,
      payPeriod: {
        start: payroll.payPeriodStart,
        end: payroll.payPeriodEnd,
        payDate: payroll.payDate || new Date()
      },
      earnings: {
        basicSalary: parseFloat(payroll.basicSalary),
        overtimePay: parseFloat(payroll.overtimePay),
        grossPay: parseFloat(payroll.grossPay)
      },
      deductions: {
        tax: parseFloat(payroll.taxDeduction),
        epf: parseFloat(payroll.totalDeductions) - parseFloat(payroll.taxDeduction),
        total: parseFloat(payroll.totalDeductions)
      },
      netPay: parseFloat(payroll.netPay)
    };

    res.json({
      success: true,
      data: payslipData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating payslip',
      error: error.message
    });
  }
};

// Generate bulk payslips
const generateBulkPayslips = async (req, res) => {
  try {
    const { payPeriodStart, payPeriodEnd } = req.body;
    
    const payrolls = await Payroll.findAll({
      where: {
        payPeriodStart,
        payPeriodEnd,
        status: ['approved', 'paid']
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employeeId', 'firstName', 'lastName', 'email', 'department', 'position']
        }
      ]
    });

    const payslips = [];
    
    for (const payroll of payrolls) {
      const attendanceRecords = await Attendance.findAll({
        where: {
          employeeId: payroll.employeeId,
          date: {
            [Op.between]: [payroll.payPeriodStart, payroll.payPeriodEnd]
          }
        }
      });

      const attendanceSummary = {
        totalDays: attendanceRecords.length,
        presentDays: attendanceRecords.filter(r => r.status === 'present').length,
        totalHours: attendanceRecords.reduce((sum, r) => sum + parseFloat(r.totalHours || 0), 0),
        overtimeHours: attendanceRecords.reduce((sum, r) => sum + parseFloat(r.overtimeHours || 0), 0)
      };

      payslips.push({
        employee: payroll.employee,
        payroll: payroll,
        attendance: attendanceSummary,
        earnings: {
          basicSalary: parseFloat(payroll.basicSalary),
          overtimePay: parseFloat(payroll.overtimePay),
          grossPay: parseFloat(payroll.grossPay)
        },
        deductions: {
          tax: parseFloat(payroll.taxDeduction),
          epf: parseFloat(payroll.totalDeductions) - parseFloat(payroll.taxDeduction),
          total: parseFloat(payroll.totalDeductions)
        },
        netPay: parseFloat(payroll.netPay)
      });
    }

    res.json({
      success: true,
      data: {
        payslips,
        totalCount: payslips.length,
        payPeriod: { start: payPeriodStart, end: payPeriodEnd }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating bulk payslips',
      error: error.message
    });
  }
};

module.exports = {
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
};
