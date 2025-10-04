import { testConnection, initializeDatabase } from '../config/db.js';

const testDatabaseConnection = async () => {
    console.log('🔍 Testing database connection...');
    console.log('📋 Configuration:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'payroll_management'}`);
    console.log('');

    try {
        // Test basic connection
        const isConnected = await testConnection();
        
        if (isConnected) {
            console.log('🚀 Initializing database and creating tables...');
            await initializeDatabase();
            console.log('');
            console.log('✅ Database setup completed successfully!');
            console.log('🎉 You can now run your application with: npm start');
        } else {
            console.log('');
            console.log('❌ Database connection failed!');
            console.log('');
            console.log('🔧 Troubleshooting steps:');
            console.log('1. Make sure XAMPP is running (Apache + MySQL)');
            console.log('2. Open phpMyAdmin: http://localhost/phpmyadmin');
            console.log('3. Create database: payroll_management');
            console.log('4. Check your MySQL password in .env file');
            console.log('5. Verify MySQL is running on port 3306');
        }
    } catch (error) {
        console.error('❌ Error during database setup:', error.message);
    } finally {
        process.exit(0);
    }
};

testDatabaseConnection();
