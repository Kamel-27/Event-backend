import eventModel from "../models/eventModel.js";
import userModel from "../models/userModel.js";

// Create Event
export const createEvent = async (req, res) => {
  try {
    const { name, date, time, venue, description, price, seats, tags } = req.body;
    
    // Validate required fields
    if (!name || !date || !time || !venue || !description || !price || !seats) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Parse tags if provided as string
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    const newEvent = new eventModel({
      name,
      date: new Date(date),
      time,
      venue,
      description,
      price: Number(price),
      seats: Number(seats),
      tags: parsedTags,
      createdBy: req.user._id,
    });

    const savedEvent = await newEvent.save();
    
    // Populate creator info
    await savedEvent.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: savedEvent,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get All Events
export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await eventModel
      .find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await eventModel.countDocuments(query);

    res.status(200).json({
      success: true,
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalEvents: total,
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Single Event
export const getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await eventModel
      .findById(id)
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Get actual booked seats
    const ticketModel = (await import('../models/ticketModel.js')).default;
    const bookedSeats = await ticketModel.find({ 
      eventId: id, 
      status: { $in: ['active', 'used'] } 
    }).select('seatNumber');
    
    const bookedSeatNumbers = bookedSeats.map(ticket => ticket.seatNumber);

    res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        bookedSeats: bookedSeatNumbers
      },
    });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, time, venue, description, price, seats, tags, status } = req.body;

    const event = await eventModel.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is authorized to update this event
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      });
    }

    // Parse tags if provided as string
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : event.tags;

    const updatedEvent = await eventModel.findByIdAndUpdate(
      id,
      {
        name: name || event.name,
        date: date ? new Date(date) : event.date,
        time: time || event.time,
        venue: venue || event.venue,
        description: description || event.description,
        price: price ? Number(price) : event.price,
        seats: seats ? Number(seats) : event.seats,
        tags: parsedTags,
        status: status || event.status,
      },
      { new: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await eventModel.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is authorized to delete this event
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event",
      });
    }

    await eventModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get User's Events
export const getUserEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const events = await eventModel
      .find({ createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await eventModel.countDocuments({ createdBy: req.user._id });

    res.status(200).json({
      success: true,
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalEvents: total,
    });
  } catch (error) {
    console.error("Get user events error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
