const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reportType: {
    type: DataTypes.ENUM('payroll_summary', 'attendance_summary', 'employee_summary', 'tax_report', 'custom'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reportData: {
    type: DataTypes.JSON,
    allowNull: false
  },
  filters: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dateRange: {
    type: DataTypes.JSON,
    allowNull: true
  },
  generatedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('generating', 'completed', 'failed'),
    defaultValue: 'generating'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isScheduled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  scheduleFrequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
    allowNull: true
  },
  nextRun: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'reports',
  timestamps: true
});

module.exports = Report;
