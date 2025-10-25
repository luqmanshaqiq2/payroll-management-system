const express = require("express");
const router = express.Router();
const { getDashboardOverview } = require("../controllers/dashboardController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// All routes require authentication
router.use(authenticateToken);

// Dashboard summary route
router.get("/", authorizeRoles("super_admin", "admin", "hr"), getDashboardOverview);

module.exports = router;
