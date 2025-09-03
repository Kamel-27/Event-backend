import express from "express";
import { getDashboardStats, getUserDemographics, getEventPerformance, getAttendeeInsights } from "../controllers/analyticsController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Protected routes - require authentication
router.use(verifyToken);

// Get dashboard statistics
router.get("/dashboard", getDashboardStats);

// Get user demographics
router.get("/demographics", getUserDemographics);

// Get event performance analytics
router.get("/performance", getEventPerformance);

// Get attendee insights (all events or specific event)
router.get("/attendee-insights", getAttendeeInsights);

export default router;
