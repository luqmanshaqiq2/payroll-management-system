const { sequelize } = require('../config/database');
const Admin = require('./Admin');
const Employee = require('./Employee');
const Attendance = require('./Attendance');
const Payroll = require('./Payroll');
const Report = require('./Report');

// Defining associations
Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls' });
Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Admin.hasMany(Attendance, { foreignKey: 'approvedBy', as: 'approvedAttendances' });
Attendance.belongsTo(Admin, { foreignKey: 'approvedBy', as: 'approver' });

Admin.hasMany(Payroll, { foreignKey: 'processedBy', as: 'processedPayrolls' });
Payroll.belongsTo(Admin, { foreignKey: 'processedBy', as: 'processor' });

Admin.hasMany(Report, { foreignKey: 'generatedBy', as: 'reports' });
Report.belongsTo(Admin, { foreignKey: 'generatedBy', as: 'generator' });

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

module.exports = {
  sequelize,
  Admin,
  Employee,
  Attendance,
  Payroll,
  Report,
  syncDatabase
};
