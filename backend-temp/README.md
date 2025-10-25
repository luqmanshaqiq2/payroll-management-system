# Payroll Management System - Backend

A comprehensive backend API for managing payroll, employees, attendance, and reports using Express.js, MySQL, and Sequelize.

## Features

- **Admin Management**: User authentication and role-based access control
- **Employee Management**: Complete employee lifecycle management
- **Attendance Tracking**: Check-in/check-out with approval workflow
- **Payroll Processing**: Automated payroll calculations and processing
- **Reporting**: Comprehensive reporting system with multiple report types
- **Security**: JWT-based authentication with role-based authorization

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd payroll-management-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `config.env` and update the database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=payroll_management
   DB_USER=root
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   PORT=3000
   NODE_ENV=development
   ```

4. **Database Setup**
   - Create the MySQL database:
   ```sql
   CREATE DATABASE payroll_management;
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/v1/admin/register` - Register new admin
- `POST /api/v1/admin/login` - Admin login

### Employee Management
- `GET /api/v1/employees` - Get all employees
- `POST /api/v1/employees` - Create new employee
- `GET /api/v1/employees/:id` - Get employee by ID
- `PUT /api/v1/employees/:id` - Update employee
- `DELETE /api/v1/employees/:id` - Delete employee
- `GET /api/v1/employees/stats` - Get employee statistics

### Attendance Management
- `GET /api/v1/attendance` - Get all attendance records
- `POST /api/v1/attendance` - Create attendance record
- `GET /api/v1/attendance/:id` - Get attendance by ID
- `PUT /api/v1/attendance/:id` - Update attendance
- `PATCH /api/v1/attendance/:id/approve` - Approve attendance
- `GET /api/v1/attendance/stats` - Get attendance statistics

### Payroll Management
- `GET /api/v1/payroll` - Get all payroll records
- `POST /api/v1/payroll` - Create payroll record
- `GET /api/v1/payroll/:id` - Get payroll by ID
- `PUT /api/v1/payroll/:id` - Update payroll
- `PATCH /api/v1/payroll/:id/process` - Process payroll
- `PATCH /api/v1/payroll/:id/mark-paid` - Mark payroll as paid
- `GET /api/v1/payroll/stats` - Get payroll statistics

### Reports
- `POST /api/v1/reports/payroll-summary` - Generate payroll summary report
- `POST /api/v1/reports/attendance-summary` - Generate attendance summary report
- `POST /api/v1/reports/employee-summary` - Generate employee summary report
- `GET /api/v1/reports` - Get all reports
- `GET /api/v1/reports/:id` - Get report by ID
- `DELETE /api/v1/reports/:id` - Delete report

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles

- **super_admin**: Full system access
- **admin**: Employee, attendance, payroll, and report management
- **hr**: Employee and attendance management, report viewing

## Database Models

### Admin
- User authentication and role management
- Password hashing with bcrypt
- Role-based access control

### Employee
- Complete employee information
- Department and position tracking
- Salary and employment details

### Attendance
- Check-in/check-out tracking
- Overtime calculation
- Approval workflow

### Payroll
- Salary calculations
- Deductions and bonuses
- Payment processing

### Report
- Report generation and storage
- Scheduled reporting
- Multiple report types

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Use process manager like PM2
5. Configure reverse proxy (nginx)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
