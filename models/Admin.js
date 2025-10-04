import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

class Admin {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.password = data.password;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Create a new admin
    static async create(username, password) {
        try {
            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const query = 'INSERT INTO admin (username, password) VALUES (?, ?)';
            const [result] = await pool.execute(query, [username, hashedPassword]);
            
            return {
                id: result.insertId,
                username,
                message: 'Admin created successfully'
            };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Username already exists');
            }
            throw new Error(`Error creating admin: ${error.message}`);
        }
    }

    // Find admin by username
    static async findByUsername(username) {
        try {
            const query = 'SELECT * FROM admin WHERE username = ?';
            const [rows] = await pool.execute(query, [username]);
            
            if (rows.length === 0) {
                return null;
            }
            
            return new Admin(rows[0]);
        } catch (error) {
            throw new Error(`Error finding admin: ${error.message}`);
        }
    }

    // Find admin by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM admin WHERE id = ?';
            const [rows] = await pool.execute(query, [id]);
            
            if (rows.length === 0) {
                return null;
            }
            
            return new Admin(rows[0]);
        } catch (error) {
            throw new Error(`Error finding admin: ${error.message}`);
        }
    }

    // Verify password
    async verifyPassword(password) {
        try {
            return await bcrypt.compare(password, this.password);
        } catch (error) {
            throw new Error(`Error verifying password: ${error.message}`);
        }
    }

    // Update admin password
    static async updatePassword(id, newPassword) {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            const query = 'UPDATE admin SET password = ? WHERE id = ?';
            const [result] = await pool.execute(query, [hashedPassword, id]);
            
            if (result.affectedRows === 0) {
                throw new Error('Admin not found');
            }
            
            return { message: 'Password updated successfully' };
        } catch (error) {
            throw new Error(`Error updating password: ${error.message}`);
        }
    }

    // Get all admins (for management purposes)
    static async getAll() {
        try {
            const query = 'SELECT id, username, created_at, updated_at FROM admin';
            const [rows] = await pool.execute(query);
            
            return rows.map(row => new Admin(row));
        } catch (error) {
            throw new Error(`Error getting admins: ${error.message}`);
        }
    }

    // Delete admin
    static async delete(id) {
        try {
            const query = 'DELETE FROM admin WHERE id = ?';
            const [result] = await pool.execute(query, [id]);
            
            if (result.affectedRows === 0) {
                throw new Error('Admin not found');
            }
            
            return { message: 'Admin deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting admin: ${error.message}`);
        }
    }

    // Convert to JSON (excluding password)
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

export default Admin;
