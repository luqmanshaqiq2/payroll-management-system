const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  checkIn: {
    type: DataTypes.TIME,
    allowNull: true
  },
  checkOut: {
    type: DataTypes.TIME,
    allowNull: true
  },
  totalHours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    defaultValue: 0
  },
  overtimeHours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'leave'),
    defaultValue: 'present'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'attendances',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['employeeId', 'date']
    }
  ]
});

module.exports = Attendance;
