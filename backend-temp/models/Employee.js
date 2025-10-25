const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  hireDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  position: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  employmentType: {
    type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'intern'),
    defaultValue: 'full_time'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'terminated', 'on_leave'),
    defaultValue: 'active'
  },
  bankAccount: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  taxId: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  emergencyContact: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
}, {
  tableName: 'employees',
  timestamps: true
});

module.exports = Employee;
