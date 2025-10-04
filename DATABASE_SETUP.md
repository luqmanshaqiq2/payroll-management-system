# Database Setup Guide

## Prerequisites

1. **MySQL Server**: Make sure MySQL is installed and running on your system
2. **Node.js**: Ensure Node.js is installed (version 14 or higher)

## Database Configuration

### 1. Environment Variables

Create a `.env` file in the root directory with the following configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=payroll_management
DB_PORT=3306

# Server Configuration
PORT=3000
```

**Important**: Replace `your_mysql_password` with your actual MySQL root password.

### 2. Create Database

Before running the application, create the database in MySQL:

```sql
CREATE DATABASE payroll_management;
```

## Installation and Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

```bash
npm start
```

The application will:
- Connect to the MySQL database
- Create the `admin` table automatically
- Start the server on port 3000

### 3. Create Default Admin (Optional)

To create a default admin user for testing:

```bash
node scripts/createDefaultAdmin.js
```

This will create an admin with:
- **Username**: `admin`
- **Password**: `admin123`

## Database Schema

### Admin Table

The `admin` table is created with the following structure:

```sql
CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### Admin Management

- **POST** `/api/admin/create` - Create a new admin
- **POST** `/api/admin/login` - Admin login
- **GET** `/api/admin` - Get all admins
- **GET** `/api/admin/:id` - Get admin by ID
- **PUT** `/api/admin/:id/password` - Update admin password
- **DELETE** `/api/admin/:id` - Delete admin

### Example API Usage

#### Create Admin
```bash
curl -X POST http://localhost:3000/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{"username": "newadmin", "password": "password123"}'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **Input Validation**: Username and password validation
- **Error Handling**: Comprehensive error handling for database operations
- **Connection Pooling**: Efficient database connection management

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if MySQL is running
   - Verify database credentials in `.env` file
   - Ensure the database `payroll_management` exists

2. **Port Already in Use**
   - Change the PORT in `.env` file
   - Or stop the process using the current port

3. **Permission Denied**
   - Ensure MySQL user has proper permissions
   - Check if the database exists and is accessible

### Testing Connection

You can test the database connection by visiting:
- `http://localhost:3000/health` - Server health check
- `http://localhost:3000/` - Basic server response

## Next Steps

After setting up the database and admin table, you can:
1. Create additional tables for your payroll system
2. Implement authentication middleware
3. Add more admin management features
4. Set up employee and payroll tables
