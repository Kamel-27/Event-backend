import eventModel from "../models/eventModel.js";
import ticketModel from "../models/ticketModel.js";
import userModel from "../models/userModel.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get total events
    const totalEvents = await eventModel.countDocuments();
    
    // Get active events
    const activeEvents = await eventModel.countDocuments({ status: 'active' });
    
    // Get total tickets sold
    const totalTickets = await ticketModel.countDocuments({ status: 'active' });
    
    // Get total revenue
    const tickets = await ticketModel.find({ status: 'active' });
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
    
    // Get total users
    const totalUsers = await userModel.countDocuments({ role: 'user' });
    
    // Get upcoming events (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingEvents = await eventModel.countDocuments({
      date: { $gte: new Date(), $lte: thirtyDaysFromNow },
      status: 'active'
    });

    // Get recent bookings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentBookings = await ticketModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get monthly revenue for the last 6 months
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - i);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
      
      const monthTickets = await ticketModel.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'active'
      });
      
      const monthRevenue = monthTickets.reduce((sum, ticket) => sum + ticket.price, 0);
      
      monthlyRevenue.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue
      });
    }

    // Get top events by ticket sales
    const topEvents = await ticketModel.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$eventId', ticketCount: { $sum: 1 } } },
      { $sort: { ticketCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $project: {
          eventName: '$event.name',
          ticketCount: 1,
          revenue: { $multiply: ['$ticketCount', '$event.price'] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalEvents,
        activeEvents,
        totalTickets,
        totalRevenue,
        totalUsers,
        upcomingEvents,
        recentBookings,
        monthlyRevenue,
        topEvents
      }
    });

  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get attendee insights for all events or specific event
export const getAttendeeInsights = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { eventId } = req.query;
    
    // Build match criteria
    let matchCriteria = { status: 'active' };
    if (eventId) {
      matchCriteria.eventId = eventId;
    }

    // Get tickets with user and event data
    const tickets = await ticketModel.find(matchCriteria)
      .populate('userId', 'age gender location interests')
      .populate('eventId', 'name date venue');

    // Calculate age distribution
    const ageDistribution = tickets.reduce((acc, ticket) => {
      const age = ticket.userId?.age || '25-34';
      acc[age] = (acc[age] || 0) + 1;
      return acc;
    }, {});

    // Calculate gender distribution
    const genderDistribution = tickets.reduce((acc, ticket) => {
      const gender = ticket.userId?.gender || 'Male';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    // Calculate location distribution
    const locationDistribution = tickets.reduce((acc, ticket) => {
      const location = ticket.userId?.location || 'Cairo';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    // Calculate interests distribution
    const interestsDistribution = tickets.reduce((acc, ticket) => {
      const interests = ticket.userId?.interests || [];
      interests.forEach(interest => {
        acc[interest] = (acc[interest] || 0) + 1;
      });
      return acc;
    }, {});

    // Format data for charts
    const ageData = Object.entries(ageDistribution).map(([age, count]) => ({
      age,
      count,
      percentage: ((count / tickets.length) * 100).toFixed(1)
    }));

    const genderData = Object.entries(genderDistribution).map(([gender, count]) => ({
      gender,
      count,
      percentage: ((count / tickets.length) * 100).toFixed(1)
    }));

    const locationData = Object.entries(locationDistribution)
      .sort(([,a], [,b]) => b - a)
      .map(([location, count]) => ({
        location,
        count,
        percentage: ((count / tickets.length) * 100).toFixed(1)
      }));

    const interestsData = Object.entries(interestsDistribution)
      .sort(([,a], [,b]) => b - a)
      .map(([interest, count]) => ({
        interest,
        count,
        percentage: ((count / tickets.length) * 100).toFixed(1)
      }));

    res.status(200).json({
      success: true,
      insights: {
        totalAttendees: tickets.length,
        ageDistribution: ageData,
        genderDistribution: genderData,
        locationDistribution: locationData,
        interestsDistribution: interestsData,
        eventInfo: eventId ? tickets[0]?.eventId : null
      }
    });

  } catch (error) {
    console.error("Get attendee insights error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get user demographics
export const getUserDemographics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get total users
    const totalUsers = await userModel.countDocuments({ role: 'user' });
    
    // Get users with tickets
    const usersWithTickets = await ticketModel.distinct('userId');
    const activeUsers = usersWithTickets.length;
    
    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await userModel.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfMonth }
    });

    // Get user engagement (users who booked in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookers = await ticketModel.distinct('userId', {
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const engagedUsers = recentBookers.length;

    res.status(200).json({
      success: true,
      demographics: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        engagedUsers,
        engagementRate: totalUsers > 0 ? ((engagedUsers / totalUsers) * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error("Get user demographics error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get event performance analytics
export const getEventPerformance = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get events with their performance metrics
    const events = await eventModel.find().sort({ date: -1 });
    
    const eventPerformance = await Promise.all(events.map(async (event) => {
      const tickets = await ticketModel.countDocuments({ 
        eventId: event._id,
        status: 'active'
      });
      
      const revenue = tickets * event.price;
      const occupancyRate = event.seats > 0 ? ((tickets / event.seats) * 100).toFixed(2) : 0;
      
      return {
        id: event._id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        totalSeats: event.seats,
        bookedSeats: tickets,
        availableSeats: event.seats - tickets,
        occupancyRate: parseFloat(occupancyRate),
        revenue,
        status: event.status
      };
    }));

    // Get overall performance metrics
    const totalSeats = events.reduce((sum, event) => sum + event.seats, 0);
    const totalBookedSeats = events.reduce((sum, event) => sum + event.booked, 0);
    const overallOccupancyRate = totalSeats > 0 ? ((totalBookedSeats / totalSeats) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      performance: {
        events: eventPerformance,
        overall: {
          totalSeats,
          totalBookedSeats,
          overallOccupancyRate: parseFloat(overallOccupancyRate)
        }
      }
    });

  } catch (error) {
    console.error("Get event performance error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
