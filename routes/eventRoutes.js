import express from "express";
import {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getUserEvents,
} from "../controllers/eventController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Create event
router.post("/", createEvent);

// Get all events (with optional filters)
router.get("/", getAllEvents);

// Get single event
router.get("/:id", getEvent);

// Update event
router.put("/:id", updateEvent);

// Delete event
router.delete("/:id", deleteEvent);

// Get user's events
router.get("/user/events", getUserEvents);

export default router;
