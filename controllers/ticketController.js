import ticketModel from "../models/ticketModel.js";
import eventModel from "../models/eventModel.js";
import userModel from "../models/userModel.js";

// Generate unique QR code
const generateQRCode = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TICKET_${timestamp}_${random}`.toUpperCase();
};

// Book a ticket
export const bookTicket = async (req, res) => {
  try {
    const { eventId, seatNumber, paymentMethod } = req.body;
    const userId = req.user._id;

    // Check if event exists and has available seats
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (event.booked >= event.seats) {
      return res.status(400).json({ success: false, message: "Event is sold out" });
    }

    // Check if seat is already booked
    const existingTicket = await ticketModel.findOne({
      eventId,
      seatNumber,
      status: { $in: ['active', 'used'] }
    });

    if (existingTicket) {
      return res.status(400).json({ success: false, message: "Seat already booked" });
    }

    // Check if user already has a ticket for this event
    const userTicket = await ticketModel.findOne({
      eventId,
      userId,
      status: { $in: ['active', 'used'] }
    });

    if (userTicket) {
      return res.status(400).json({ success: false, message: "You already have a ticket for this event" });
    }

    // Create ticket
    const qrCode = generateQRCode();
    const ticket = new ticketModel({
      eventId,
      userId,
      seatNumber,
      price: event.price,
      qrCode,
      paymentMethod,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    await ticket.save();

    // Update event booked count
    await eventModel.findByIdAndUpdate(eventId, {
      $inc: { booked: 1 }
    });

    res.status(201).json({
      success: true,
      message: "Ticket booked successfully",
      ticket: {
        id: ticket._id,
        eventName: event.name,
        eventDate: event.date,
        venue: event.venue,
        seatNumber: ticket.seatNumber,
        price: ticket.price,
        qrCode: ticket.qrCode,
        status: ticket.status
      }
    });

  } catch (error) {
    console.error("Book ticket error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get user's tickets
export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id;

    const tickets = await ticketModel.find({ userId })
      .populate('eventId', 'name date time venue description image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tickets: tickets.map(ticket => ({
        id: ticket._id,
        event: ticket.eventId,
        seatNumber: ticket.seatNumber,
        price: ticket.price,
        status: ticket.status,
        qrCode: ticket.qrCode,
        checkInTime: ticket.checkInTime,
        createdAt: ticket.createdAt
      }))
    });

  } catch (error) {
    console.error("Get user tickets error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Check-in ticket using QR code
export const checkInTicket = async (req, res) => {
  try {
    const { qrCode } = req.body;

    const ticket = await ticketModel.findOne({ qrCode }).populate('eventId');
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Invalid QR code" });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({ success: false, message: "Ticket is cancelled" });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({ success: false, message: "Ticket already used" });
    }

    // Check if event is today
    const today = new Date();
    const eventDate = new Date(ticket.eventId.date);
    if (eventDate.toDateString() !== today.toDateString()) {
      return res.status(400).json({ success: false, message: "Event is not today" });
    }

    // Update ticket status
    ticket.status = 'used';
    ticket.checkInTime = new Date();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Check-in successful",
      ticket: {
        id: ticket._id,
        eventName: ticket.eventId.name,
        seatNumber: ticket.seatNumber,
        checkInTime: ticket.checkInTime
      }
    });

  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get all tickets (admin only)
export const getAllTickets = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const tickets = await ticketModel.find()
      .populate('eventId', 'name date venue')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tickets: tickets.map(ticket => ({
        id: ticket._id,
        event: ticket.eventId,
        user: ticket.userId,
        seatNumber: ticket.seatNumber,
        price: ticket.price,
        status: ticket.status,
        qrCode: ticket.qrCode,
        checkInTime: ticket.checkInTime,
        createdAt: ticket.createdAt
      }))
    });

  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Cancel ticket
export const cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id;

    const ticket = await ticketModel.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Check if user owns the ticket or is admin
    if (ticket.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({ success: false, message: "Ticket already cancelled" });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({ success: false, message: "Cannot cancel used ticket" });
    }

    // Update ticket status
    ticket.status = 'cancelled';
    await ticket.save();

    // Update event booked count
    await eventModel.findByIdAndUpdate(ticket.eventId, {
      $inc: { booked: -1 }
    });

    res.status(200).json({
      success: true,
      message: "Ticket cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel ticket error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
