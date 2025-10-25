const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payroll = sequelize.define('Payroll', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  payPeriodStart: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  payPeriodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  basicSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  overtimePay: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  grossPay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  taxDeduction: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  netPay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled'),
    defaultValue: 'pending'
  },
  payDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
}, {
  tableName: 'payrolls',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['employeeId', 'payPeriodStart', 'payPeriodEnd']
    }
  ]
});

module.exports = Payroll;
