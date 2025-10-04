import { initializeDatabase } from '../config/db.js';
import Admin from '../models/Admin.js';

const createDefaultAdmin = async () => {
    try {
        console.log('🚀 Initializing database...');
        await initializeDatabase();
        
        console.log('👤 Creating default admin user...');
        
        // Check if admin already exists
        const existingAdmin = await Admin.findByUsername('admin');
        if (existingAdmin) {
            console.log('⚠️  Default admin already exists');
            return;
        }
        
        // Create default admin
        const result = await Admin.create('admin', 'admin123');
        console.log('✅ Default admin created successfully!');
        console.log(`📋 Username: admin`);
        console.log(`🔑 Password: admin123`);
        console.log(`🆔 Admin ID: ${result.id}`);
        
    } catch (error) {
        console.error('❌ Error creating default admin:', error.message);
    } finally {
        process.exit(0);
    }
};

createDefaultAdmin();
