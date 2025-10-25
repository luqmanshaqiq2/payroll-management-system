const { Payroll, Employee } = require("../models");
const { Op } = require("sequelize");

const getDashboardOverview = async (req, res) => {
  try {
    // Employee stats
    const totalEmployees = await Employee.count();
    const activeEmployees = await Employee.count({ where: { status: "active" } });

    // Payroll stats
    const totalPayrolls = await Payroll.count();
    const totalPaid = await Payroll.count({ where: { status: "paid" } });
    const totalPending = await Payroll.count({ where: { status: "pending" } });
    const totalApproved = await Payroll.count({ where: { status: "approved" } });

    const totalGrossPay = await Payroll.sum("grossPay");
    const totalNetPay = await Payroll.sum("netPay");

    // Recent payrolls (latest 5)
    const recentPayrolls = await Payroll.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [{ model: Employee, as: "employee", attributes: ["firstName", "lastName"] }],
      attributes: ["id", "status", "grossPay", "netPay", "createdAt"],
    });

    // Department salary data: total salary by department
    const departmentSalaryData = await Payroll.findAll({
      attributes: [
        [Payroll.sequelize.col("employee.department"), "department"],
        [Payroll.sequelize.fn("SUM", Payroll.sequelize.col("netPay")), "totalSalary"],
        [Payroll.sequelize.fn("COUNT", Payroll.sequelize.col("Payroll.id")), "employeeCount"]
      ],
      include: [{
        model: Employee,
        as: "employee",
        attributes: ["department"]
      }],
      group: ["employee.department"],
      order: [[Payroll.sequelize.fn("SUM", Payroll.sequelize.col("netPay")), "DESC"]],
    });

    // Trend data: payroll per month (keeping for backward compatibility)
    const monthlyTrend = await Payroll.findAll({
      attributes: [
        [Payroll.sequelize.fn("DATE_FORMAT", Payroll.sequelize.col("payPeriodStart"), "%Y-%m"), "month"],
        [Payroll.sequelize.fn("SUM", Payroll.sequelize.col("netPay")), "totalNetPay"],
      ],
      group: ["month"],
      order: [[Payroll.sequelize.literal("month"), "ASC"]],
      limit: 6,
    });

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        totalPayrolls,
        totalPaid,
        totalPending,
        totalApproved,
        totalGrossPay: totalGrossPay || 0,
        totalNetPay: totalNetPay || 0,
        recentPayrolls,
        monthlyTrend,
        departmentSalaryData,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard overview",
      error: error.message,
    });
  }
};

module.exports = { getDashboardOverview };
  