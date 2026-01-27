import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const { Admin, Booking, User, Property } = db;

// Admin login
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({
      where: {
        username: username
      }
    });

    if (!admin) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        admin_id: admin.admin_id, 
        username: admin.username,
        type: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        admin_id: admin.admin_id,
        username: admin.username
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// Get all bot bookings for admin dashboard
export const getBotBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      booking_source: 'Bot'
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const bookings = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['user_id', 'name', 'email', 'phone_number', 'cnic'],
          required: false
        },
        {
          model: Property,
          attributes: ['property_id', 'name', 'address', 'city'],
          required: false
        }
      ],
      order: [['booked_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format the response
    const formattedBookings = bookings.rows.map(booking => ({
      booking_id: booking.booking_id,
      status: booking.status,
      booking_date: booking.booking_date,
      shift_type: booking.shift_type,
      total_cost: booking.total_cost,
      booking_source: booking.booking_source,
      payment_screenshot_url: booking.payment_screenshot_url,
      booked_at: booking.booked_at,
      user_id: booking.user_id, // Include user_id for Fast API calls
      user_name: booking.User?.name || 'N/A',
      user_email: booking.User?.email || 'N/A',
      user_phone_number: booking.User?.phone_number || 'N/A',
      user_cnic: booking.User?.cnic || 'N/A',
      property_name: booking.Property?.name || 'N/A',
      property_location: booking.Property?.address || 'N/A',
      property_city: booking.Property?.city || 'N/A'
    }));

    res.json({
      bookings: formattedBookings,
      pagination: {
        total: bookings.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(bookings.count / limit)
      }
    });

  } catch (error) {
    console.error('Get bot bookings error:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings'
    });
  }
};

// Update booking status (admin can manage bot bookings)
export const updateBookingStatus = async (req, res) => {
  try {
    const { booking_id, status } = req.body;

    if (!booking_id || !status) {
      return res.status(400).json({
        error: 'Booking ID and status are required'
      });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status'
      });
    }

    // Find the booking
    const booking = await Booking.findOne({
      where: { 
        booking_id,
        booking_source: 'Bot' // Admin can only manage bot bookings
      }
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found or not accessible'
      });
    }

    // Update the booking status
    await booking.update({ status });

    res.json({
      message: 'Booking status updated successfully',
      booking: {
        booking_id: booking.booking_id,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      error: 'Failed to update booking status'
    });
  }
};

// Get admin dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalBotBookings = await Booking.count({
      where: { booking_source: 'Bot' }
    });

    const pendingBookings = await Booking.count({
      where: { 
        booking_source: 'Bot',
        status: 'Pending'
      }
    });

    const confirmedBookings = await Booking.count({
      where: { 
        booking_source: 'Bot',
        status: 'Confirmed'
      }
    });

    const completedBookings = await Booking.count({
      where: { 
        booking_source: 'Bot',
        status: 'Completed'
      }
    });

    const cancelledBookings = await Booking.count({
      where: { 
        booking_source: 'Bot',
        status: 'Cancelled'
      }
    });

    res.json({
      stats: {
        total: totalBotBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats'
    });
  }
};