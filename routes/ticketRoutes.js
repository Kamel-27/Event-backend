import express from "express";
import { bookTicket, getUserTickets, checkInTicket, getAllTickets, cancelTicket } from "../controllers/ticketController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Protected routes - require authentication
router.use(verifyToken);

// Book a ticket
router.post("/book", bookTicket);

// Get user's tickets
router.get("/my-tickets", getUserTickets);

// Check-in ticket (for event staff)
router.post("/check-in", checkInTicket);

// Cancel ticket
router.put("/cancel/:ticketId", cancelTicket);

// Get all tickets (admin only)
router.get("/all", getAllTickets);

export default router;
