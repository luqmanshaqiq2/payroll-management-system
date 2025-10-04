import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // XAMPP default is empty password
    database: process.env.DB_NAME || 'payroll_management',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(' Database connected successfully');
        console.log(` Connected to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('🔧 Please check:');
        console.error('   - XAMPP MySQL is running');
        console.error('   - Database "payroll_management" exists');
        console.error('   - MySQL credentials are correct');
        console.error(`   - Connection details: ${dbConfig.host}:${dbConfig.port} (user: ${dbConfig.user})`);
        return false;
    }
};

// Initialize database and create tables
const initializeDatabase = async () => {
    try {
        // Test connection first
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Database connection failed');
        }

        // Create admin table
        await createAdminTable();
        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
    }
};

// Create admin table
const createAdminTable = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS admin (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        
        await pool.execute(createTableQuery);
        console.log('✅ Admin table created successfully');
    } catch (error) {
        console.error('❌ Error creating admin table:', error.message);
        throw error;
    }
};

export { pool, testConnection, initializeDatabase };
