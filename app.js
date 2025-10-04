import express from "express";
import { initializeDatabase } from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
    res.json({ message: "Server is up and running!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "OK", 
        message: "Server is healthy",
        timestamp: new Date().toISOString()
    });
});

// Admin routes
app.use("/api/admin", adminRoutes);

// Initialize database and start server
const startServer = async () => {
    try {
        // Initialize database connection and create tables
        await initializeDatabase();
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Server is listening on port ${PORT}`);
            console.log(`📊 Database connection established`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();