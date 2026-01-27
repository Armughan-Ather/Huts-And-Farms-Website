import { v4 as uuidv4 } from 'uuid';
import db from '../models/index.js';

const { Booking, User, Property, PropertyPricing, PropertyShiftPricing, OwnerProperty, sequelize } = db;

// Helper function to get property_id from either property or owner token
const getPropertyId = async (req) => {
  if (req.property && req.property.property_id) {
    // Property token - get property_id directly
    return req.property.property_id;
  } else if (req.owner && req.owner.owner_id) {
    // Owner token - get property_id from query/body and validate ownership
    const property_id = req.query.property_id || req.body.property_id;
    
    if (!property_id) {
      // If no specific property_id provided, return null to indicate "all properties for this owner"
      return null;
    }
    
    // Verify that the owner actually owns this property
    const ownerProperty = await OwnerProperty.findOne({
      where: {
        owner_id: req.owner.owner_id,
        property_id: property_id
      }
    });
    
    if (!ownerProperty) {
      throw new Error('Access denied. You do not own this property.');
    }
    
    return property_id;
  } else {
    throw new Error('Authentication required - no valid property or owner token found');
  }
};

// Helper function to get all property IDs for an owner
const getOwnerPropertyIds = async (owner_id) => {
  const ownerProperties = await OwnerProperty.findAll({
    where: { owner_id },
    attributes: ['property_id']
  });
  return ownerProperties.map(op => op.property_id);
};

// export const createBooking = async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     // Get property_id from middleware
//     const { property_id } = req.property;
//     const { cnic, phone_no, booking_date, shift_type, booking_source } = req.body;

//     // Validate required fields
//     if (!cnic || !phone_no || !property_id || !booking_date || !shift_type || !booking_source) {
//       await transaction.rollback();
//       return res.status(400).json({ error: 'Missing required fields: cnic, phone_no, property_id, booking_date, shift_type, booking_source' });
//     }

//     // Remove dashes from cnic
//     const cleanCnic = cnic.replace(/-/g, '');

//     // Validate cnic format (e.g., 13 digits for Pakistan CNIC)
//     if (!/^\d{13}$/.test(cleanCnic)) {
//       await transaction.rollback();
//       return res.status(400).json({ error: 'Invalid CNIC format. Must be 13 digits (with or without dashes)' });
//     }

//     // Validate phone_no format (e.g., +923001234567)
//     if (!/^\+?\d{10,15}$/.test(phone_no)) {
//       await transaction.rollback();
//       return res.status(400).json({ error: 'Invalid phone number format. Must be 10-15 digits (optional + prefix)' });
//     }

//     // Validate shift_type
//     if (!['Day', 'Night', 'Full Day', 'Full Night'].includes(shift_type)) {
//       await transaction.rollback();
//       return res.status(400).json({ error: 'Invalid shift_type. Must be "Day", "Night", "Full Day", or "Full Night"' });
//     }

//     // Validate booking_source
//     if (!['Website', 'WhatsApp Bot', 'Third-Party'].includes(booking_source)) {
//       await transaction.rollback();
//       return res.status(400).json({ error: 'Invalid booking_source. Must be "Website", "WhatsApp Bot", or "Third-Party"' });
//     }

//     // Validate booking_date
//     const parsedBookingDate = new Date(booking_date);
//     if (isNaN(parsedBookingDate)) {
//       await transaction.rollback();
//       return res.status(400).json({ error: 'Invalid booking_date format. Use ISO format (e.g., "2025-07-23")' });
//     }

//     // Find or create user by cnic
//     let user = await User.findOne({ where: { cnic: cleanCnic }, transaction });
//     if (!user) {
//       user = await User.create({
//         user_id: uuidv4(),
//         cnic: cleanCnic,
//         phone_number: phone_no, // Map phone_no to phone_number
//         created_at: new Date(),
//         updated_at: new Date(),
//       }, { transaction });
//     }

//     const user_id = user.user_id;

//     // Validate property exists
//     const property = await Property.findByPk(property_id, { transaction });
//     if (!property) {
//       await transaction.rollback();
//       return res.status(404).json({ error: 'Property not found' });
//     }

//     // Check for existing booking on the same date and shift
//     const existingBooking = await Booking.findOne({
//       where: {
//         property_id,
//         booking_date: parsedBookingDate,
//         shift_type,
//       },
//       transaction,
//     });
//     if (existingBooking) {
//       await transaction.rollback();
//       return res.status(400).json({ error: 'Property is already booked for this date and shift' });
//     }

//     // Find property pricing
//     const pricing = await PropertyPricing.findOne({
//       where: { property_id },
//       transaction,
//     });
//     if (!pricing) {
//       await transaction.rollback();
//       return res.status(404).json({ error: 'Pricing not found for this property' });
//     }

//     // Calculate day of week
//     const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
//     const dayOfWeek = daysOfWeek[parsedBookingDate.getDay()];

//     // Find shift pricing
//     const shiftPricing = await PropertyShiftPricing.findOne({
//       where: {
//         pricing_id: pricing.pricing_id,
//         day_of_week: dayOfWeek,
//         shift_type,
//       },
//       transaction,
//     });
//     if (!shiftPricing) {
//       await transaction.rollback();
//       return res.status(400).json({ error: `No pricing found for ${shift_type} on ${dayOfWeek}` });
//     }

//     // Get total_cost from shift pricing
//     const total_cost = parseFloat(shiftPricing.price);

//     // Create booking
//     const booking = await Booking.create({
//       booking_id: uuidv4(),
//       user_id,
//       property_id,
//       booking_date: parsedBookingDate,
//       shift_type,
//       total_cost,
//       booking_source,
//       status: 'Pending',
//       booked_at: new Date(),
//       created_at: new Date(),
//       updated_at: new Date(),
//     }, { transaction });

//     await transaction.commit();

//     // Return response
//     res.status(201).json({
//       message: 'Booking created successfully',
//       booking: {
//         booking_id: booking.booking_id,
//         user_id: booking.user_id,
//         user_cnic: cleanCnic,
//         user_phone_no: user.phone_number, // Use phone_number from user
//         property_id: booking.property_id,
//         booking_date: booking.booking_date,
//         shift_type: booking.shift_type,
//         total_cost: booking.total_cost,
//         booking_source: booking.booking_source,
//         status: booking.status,
//         booked_at: booking.booked_at,
//         created_at: booking.created_at,
//         updated_at: booking.updated_at,
//       },
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error('Error creating booking:', error);
//     if (error.name === 'SequelizeUniqueConstraintError') {
//       return res.status(400).json({
//         error: 'Failed to create booking',
//         details: `Unique constraint violation: ${error.errors.map(e => `${e.path} (${e.value}) already exists`).join(', ')}`,
//       });
//     }
//     res.status(500).json({ error: 'Failed to create booking', details: error.message });
//   }
// };

export const createBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Get property_id from either property or owner token
    let property_id = await getPropertyId(req);
    
    // If getPropertyId returns null (owner without property_id in query), 
    // check if property_id is in the request body
    if (!property_id && req.owner && req.body.property_id) {
      // Verify that the owner actually owns this property
      const ownerProperty = await OwnerProperty.findOne({
        where: {
          owner_id: req.owner.owner_id,
          property_id: req.body.property_id
        }
      });
      
      if (!ownerProperty) {
        await transaction.rollback();
        return res.status(403).json({ error: 'Access denied. You do not own this property.' });
      }
      
      property_id = req.body.property_id;
    }
    
    if (!property_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Property ID is required for creating bookings' });
    }
    
    const { cnic, phone_no, name, booking_date, shift_type, //booking_source 
    } = req.body;
    const booking_source = req.body.booking_source || 'Website'; // Default to 'Website' for web bookings 

    // Validate required fields
    if (!cnic || !phone_no || !name || !property_id || !booking_date || !shift_type || !booking_source) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required fields: cnic, phone_no, name, property_id, booking_date, shift_type, booking_source' });
    }

    // Remove dashes from cnic
    const cleanCnic = cnic.replace(/-/g, '');

    // Validate cnic format (e.g., 13 digits for Pakistan CNIC)
    if (!/^\d{13}$/.test(cleanCnic)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid CNIC format. Must be 13 digits (with or without dashes)' });
    }

    // Validate phone_no format (e.g., +923001234567)
    if (!/^\+?\d{10,15}$/.test(phone_no)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid phone number format. Must be 10-15 digits (optional + prefix)' });
    }

    // Validate name (basic: non-empty string, max 255 chars)
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 255) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid name format. Must be a non-empty string up to 255 characters' });
    }

    // Validate shift_type
    if (!['Day', 'Night', 'Full Day', 'Full Night'].includes(shift_type)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid shift_type. Must be "Day", "Night", "Full Day", or "Full Night"' });
    }

    // Validate booking_source
    if (!['Website', 'WhatsApp Bot', 'Third-Party'].includes(booking_source)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid booking_source. Must be "Website", "WhatsApp Bot", or "Third-Party"' });
    }

    // Validate booking_date
    const parsedBookingDate = new Date(booking_date);
    if (isNaN(parsedBookingDate)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid booking_date format. Use ISO format (e.g., "2025-07-23")' });
    }

    // Format booking_id: name-date-shift_type
    const formattedDate = parsedBookingDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const formattedName = name.trim().replace(/\s+/g, '_'); // Replace spaces with underscores
    const booking_id = `${formattedName}-${formattedDate}-${shift_type}`;

    // Check for existing booking_id (ensure uniqueness)
    const existingBookingId = await Booking.findOne({
      where: { booking_id },
      transaction,
    });
    if (existingBookingId) {
      await transaction.rollback();
      return res.status(400).json({ error: `Booking ID ${booking_id} already exists` });
    }

    // Find or create user by cnic using Sequelize ORM
    let user = await User.findOne({
      where: { cnic: cleanCnic },
      attributes: ['user_id', 'cnic', 'phone_number', 'name'],
      transaction,
    });

    if (!user) {
      user = await User.create({
        user_id: uuidv4(), // Generate UUID using uuid package
        cnic: cleanCnic,
        phone_number: phone_no,
        name: name.trim(),
        created_at: new Date(),
        updated_at: new Date(),
      }, { transaction });
    }

    const user_id = user.user_id;

    // Validate property exists
    const property = await Property.findByPk(property_id, { transaction });
    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check for existing booking on the same date and shift
    const existingBooking = await Booking.findOne({
      where: {
        property_id,
        booking_date: parsedBookingDate,
        shift_type,
      },
      transaction,
    });
    if (existingBooking) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Property is already booked for this date and shift' });
    }

    // Find property pricing
    const pricing = await PropertyPricing.findOne({
      where: { property_id },
      transaction,
    });
    if (!pricing) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Pricing not found for this property' });
    }

    // Calculate day of week
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = daysOfWeek[parsedBookingDate.getDay()];

    // Find shift pricing
    const shiftPricing = await PropertyShiftPricing.findOne({
      where: {
        pricing_id: pricing.pricing_id,
        day_of_week: dayOfWeek,
        shift_type,
      },
      transaction,
    });
    if (!shiftPricing) {
      await transaction.rollback();
      return res.status(400).json({ error: `No pricing found for ${shift_type} on ${dayOfWeek}` });
    }

    // Get total_cost from shift pricing
    const total_cost = parseFloat(shiftPricing.price);

    // Create booking
    const booking = await Booking.create({
      booking_id,
      user_id,
      property_id,
      booking_date: parsedBookingDate,
      shift_type,
      total_cost,
      booking_source,
      status: 'Pending',
      booked_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });

    await transaction.commit();

    // Return response
    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        booking_id: booking.booking_id,
        user_id: booking.user_id,
        user_cnic: cleanCnic,
        user_phone_no: user.phone_number,
        user_name: user.name,
        property_id: booking.property_id,
        booking_date: booking.booking_date,
        shift_type: booking.shift_type,
        total_cost: booking.total_cost,
        booking_source: booking.booking_source,
        status: booking.status,
        booked_at: booking.booked_at,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating booking:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Failed to create booking',
        details: `Unique constraint violation: ${error.errors.map(e => `${e.path} (${e.value}) already exists`).join(', ')}`,
      });
    }
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
};

export const viewPropertyBookings = async (req, res) => {
  try {
    // Check if we have any authentication
    if (!req.property && !req.owner) {
      return res.status(401).json({ error: 'Authentication required - no property or owner token found' });
    }
    
    // Get property_id from either property or owner token
    const property_id = await getPropertyId(req);
    
    let whereClause;
    
    if (property_id) {
      // Specific property requested
      whereClause = { property_id };
    } else if (req.owner) {
      // Owner token without specific property - get all properties for this owner
      const ownerPropertyIds = await getOwnerPropertyIds(req.owner.owner_id);
      if (ownerPropertyIds.length === 0) {
        return res.json({
          message: 'No bookings found',
          bookings: []
        });
      }
      whereClause = { property_id: ownerPropertyIds };
    } else {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Find all bookings for the property/properties
    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['name', 'phone_number', 'cnic', 'email'], // Include name, phone_number, cnic, email
          required: false, // Make User include optional
        },
      ],
      attributes: [
        'booking_id',
        'user_id',
        'property_id',
        'booking_date',
        'shift_type',
        'total_cost',
        'booking_source',
        'status',
        'payment_screenshot_url',
        'booked_at',
        'created_at',
        'updated_at',
      ],
    });

    // Format response
    const response = {
      message: 'Bookings retrieved successfully',
      bookings: bookings.map(booking => ({
        booking_id: booking.booking_id,
        user_id: booking.user_id,
        user_name: booking.User?.name || null,
        user_phone_number: booking.User?.phone_number || null,
        user_cnic: booking.User?.cnic || null,
        user_email: booking.User?.email || null,
        property_id: booking.property_id,
        booking_date: booking.booking_date,
        shift_type: booking.shift_type,
        total_cost: booking.total_cost,
        booking_source: booking.booking_source,
        status: booking.status,
        payment_screenshot_url: booking.payment_screenshot_url,
        booked_at: booking.booked_at,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving bookings:', error);
    res.status(500).json({
      error: 'Failed to retrieve bookings',
      details: error.message,
    });
  }
};

export const cancelBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { booking_id } = req.body;
    
    // Get property_id from either property or owner token
    const property_id = await getPropertyId(req);

    // Validate required fields
    if (!booking_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required field: booking_id' });
    }

    // Build where clause for finding booking
    let whereClause = { booking_id };
    
    if (property_id) {
      // Specific property
      whereClause.property_id = property_id;
    } else if (req.owner) {
      // Owner token - verify they own the property for this booking
      const ownerPropertyIds = await getOwnerPropertyIds(req.owner.owner_id);
      if (ownerPropertyIds.length === 0) {
        await transaction.rollback();
        return res.status(403).json({ error: 'No properties found for this owner' });
      }
      whereClause.property_id = ownerPropertyIds;
    }

    // Find booking
    const booking = await Booking.findOne({
      where: whereClause,
      transaction,
    });
    
    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Booking not found or not associated with this property' });
    }

    // Check if already cancelled
    if (booking.status === 'Cancelled') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Update status to Cancelled
    await booking.update(
      { status: 'Cancelled', updated_at: new Date() },
      { transaction }
    );

    await transaction.commit();

    // Return response
    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: {
        booking_id: booking.booking_id,
        user_id: booking.user_id,
        property_id: booking.property_id,
        booking_date: booking.booking_date,
        shift_type: booking.shift_type,
        total_cost: booking.total_cost,
        booking_source: booking.booking_source,
        status: booking.status,
        booked_at: booking.booked_at,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking', details: error.message });
  }
};

export const confirmBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { booking_id } = req.body;
    
    // Get property_id from either property or owner token
    const property_id = await getPropertyId(req);
    
    // Validate required fields
    if (!booking_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required field: booking_id' });
    }

    // Build where clause for finding booking
    let whereClause = { booking_id };
    
    if (property_id) {
      // Specific property
      whereClause.property_id = property_id;
    } else if (req.owner) {
      // Owner token - verify they own the property for this booking
      const ownerPropertyIds = await getOwnerPropertyIds(req.owner.owner_id);
      if (ownerPropertyIds.length === 0) {
        await transaction.rollback();
        return res.status(403).json({ error: 'No properties found for this owner' });
      }
      whereClause.property_id = ownerPropertyIds;
    }

    // Find booking
    const booking = await Booking.findOne({
      where: whereClause,
      transaction,
    });
    
    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Booking not found or not associated with this property' });
    }

    // Check if already confirmed
    if (booking.status === 'Confirmed') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Booking is already confirmed' });
    }

    // Update status to Confirmed
    await booking.update(
      { status: 'Confirmed', updated_at: new Date() },
      { transaction }
    );

    await transaction.commit();

    // Return response
    res.status(200).json({
      message: 'Booking confirmed successfully',
      booking: {
        booking_id: booking.booking_id,
        user_id: booking.user_id,
        property_id: booking.property_id,
        booking_date: booking.booking_date,
        shift_type: booking.shift_type,
        total_cost: booking.total_cost,
        booking_source: booking.booking_source,
        status: booking.status,
        booked_at: booking.booked_at,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error confirming booking:', error);
    res.status(500).json({ error: 'Failed to confirm booking', details: error.message });
  }
};

// export const completeBooking = async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     // Get property_id from middleware
//     const { property_id } = req.property;

//     // Validate property_id
//     if (!property_id) {
//       await transaction.rollback();
//       return res.status(401).json({ error: 'Property ID not found in authentication data' });
//     }

//     // Find all confirmed bookings with past booking_date
//     const currentDate = new Date(); // August 24, 2025, 10:56 PM PKT
//     const bookings = await Booking.findAll({
//       where: {
//         property_id,
//         status: 'Confirmed',
//         booking_date: {
//           [sequelize.Op.lt]: currentDate, // Less than current date
//         },
//       },
//       transaction,
//     });

//     // If no eligible bookings, return empty array
//     if (!bookings.length) {
//       await transaction.commit();
//       return res.status(200).json({
//         message: 'No eligible bookings found to mark as completed',
//         bookings: [],
//       });
//     }

//     // Update status to Completed for all eligible bookings
//     const updatedBookings = await Promise.all(
//       bookings.map(async (booking) => {
//         await booking.update(
//           { status: 'Completed', updated_at: new Date() },
//           { transaction }
//         );
//         return {
//           booking_id: booking.booking_id,
//           user_id: booking.user_id,
//           property_id: booking.property_id,
//           booking_date: booking.booking_date,
//           shift_type: booking.shift_type,
//           total_cost: booking.total_cost,
//           booking_source: booking.booking_source,
//           status: booking.status,
//           booked_at: booking.booked_at,
//           created_at: booking.created_at,
//           updated_at: booking.updated_at,
//         };
//       })
//     );

//     await transaction.commit();

//     // Return response
//     res.status(200).json({
//       message: `Successfully marked ${updatedBookings.length} booking(s) as completed`,
//       bookings: updatedBookings,
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error('Error completing bookings:', error);
//     res.status(500).json({ error: 'Failed to complete bookings', details: error.message });
//   }
// };


export const completeBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Get property_id from either property or owner token
    const property_id = await getPropertyId(req);
    
    let whereClause = {
      status: 'Confirmed',
      booking_date: {
        [db.Sequelize.Op.lt]: new Date()
      }
    };
    
    if (property_id) {
      // Specific property
      whereClause.property_id = property_id;
    } else if (req.owner) {
      // Owner token without specific property - get all properties for this owner
      const ownerPropertyIds = await getOwnerPropertyIds(req.owner.owner_id);
      if (ownerPropertyIds.length === 0) {
        await transaction.commit();
        return res.json({
          message: 'No properties found for this owner',
          completedCount: 0
        });
      }
      whereClause.property_id = ownerPropertyIds;
    } else {
      await transaction.rollback();
      return res.status(400).json({ error: 'Property access required' });
    }

    // Find all confirmed bookings with past booking_date using Sequelize ORM
    const bookings = await Booking.findAll({
      where: whereClause,
      attributes: ['booking_id', 'user_id', 'property_id', 'booking_date', 'shift_type', 'total_cost', 'booking_source', 'status', 'booked_at', 'created_at', 'updated_at'],
      transaction,
    });

    // If no eligible bookings, return empty array
    if (!bookings.length) {
      await transaction.commit();
      return res.status(200).json({
        message: 'No eligible bookings found to mark as completed',
        bookings: [],
      });
    }

    // Update status to Completed for all eligible bookings using Sequelize ORM
    const updatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        await booking.update(
          { status: 'Completed', updated_at: new Date() },
          { transaction }
        );
        return {
          booking_id: booking.booking_id,
          user_id: booking.user_id,
          property_id: booking.property_id,
          booking_date: booking.booking_date,
          shift_type: booking.shift_type,
          total_cost: booking.total_cost,
          booking_source: booking.booking_source,
          status: 'Completed',
          booked_at: booking.booked_at,
          created_at: booking.created_at,
          updated_at: new Date(),
        };
      })
    );

    await transaction.commit();

    // Return response
    res.status(200).json({
      message: `Successfully marked ${updatedBookings.length} booking(s) as completed`,
      bookings: updatedBookings,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error completing bookings:', error);
    res.status(500).json({ error: 'Failed to complete bookings', details: error.message });
  }
};

// Update booking status (for non-Bot bookings - no user notification)
export const updateBookingStatusLocal = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { booking_id, status } = req.body;
    
    // Get property_id from either property or owner token
    const property_id = await getPropertyId(req);

    // Validate required fields
    if (!booking_id || !status) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required fields: booking_id, status' });
    }

    // Validate status
    const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: Pending, Confirmed, Cancelled, Completed' 
      });
    }

    // Build where clause for finding booking
    let whereClause = { booking_id };
    
    if (property_id) {
      // Specific property
      whereClause.property_id = property_id;
    } else if (req.owner) {
      // Owner token - verify they own the property for this booking
      const ownerPropertyIds = await getOwnerPropertyIds(req.owner.owner_id);
      if (ownerPropertyIds.length === 0) {
        await transaction.rollback();
        return res.status(403).json({ error: 'No properties found for this owner' });
      }
      whereClause.property_id = ownerPropertyIds;
    }

    // Find booking
    const booking = await Booking.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['name', 'phone_number', 'cnic', 'email'],
          required: false,
        },
      ],
      transaction,
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Booking not found or not associated with this property' });
    }

    // Update status
    await booking.update(
      { status, updated_at: new Date() },
      { transaction }
    );

    await transaction.commit();

    // Return updated booking with user details
    res.status(200).json({
      message: `Booking status updated to ${status} successfully`,
      booking: {
        booking_id: booking.booking_id,
        user_id: booking.user_id,
        user_name: booking.User?.name || null,
        user_phone_number: booking.User?.phone_number || null,
        user_cnic: booking.User?.cnic || null,
        user_email: booking.User?.email || null,
        property_id: booking.property_id,
        booking_date: booking.booking_date,
        shift_type: booking.shift_type,
        total_cost: booking.total_cost,
        booking_source: booking.booking_source,
        status: booking.status,
        payment_screenshot_url: booking.payment_screenshot_url,
        booked_at: booking.booked_at,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status', details: error.message });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { booking_id, status } = req.body;
    
    // Get property_id from either property or owner token
    const property_id = await getPropertyId(req);

    // Validate required fields
    if (!booking_id || !status) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required fields: booking_id, status' });
    }

    // Validate status
    const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: Pending, Confirmed, Cancelled, Completed' 
      });
    }

    // Build where clause for finding booking
    let whereClause = { booking_id };
    
    if (property_id) {
      // Specific property
      whereClause.property_id = property_id;
    } else if (req.owner) {
      // Owner token - verify they own the property for this booking
      const ownerPropertyIds = await getOwnerPropertyIds(req.owner.owner_id);
      if (ownerPropertyIds.length === 0) {
        await transaction.rollback();
        return res.status(403).json({ error: 'No properties found for this owner' });
      }
      whereClause.property_id = ownerPropertyIds;
    }

    // Find booking
    const booking = await Booking.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['name', 'phone_number', 'cnic', 'email'],
          required: false,
        },
      ],
      transaction,
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Booking not found or not associated with this property' });
    }

    // Update status
    await booking.update(
      { status, updated_at: new Date() },
      { transaction }
    );

    await transaction.commit();

    // Return updated booking with user details
    res.status(200).json({
      message: `Booking status updated to ${status} successfully`,
      booking: {
        booking_id: booking.booking_id,
        user_id: booking.user_id,
        user_name: booking.User?.name || null,
        user_phone_number: booking.User?.phone_number || null,
        user_cnic: booking.User?.cnic || null,
        user_email: booking.User?.email || null,
        property_id: booking.property_id,
        booking_date: booking.booking_date,
        shift_type: booking.shift_type,
        total_cost: booking.total_cost,
        booking_source: booking.booking_source,
        status: booking.status,
        payment_screenshot_url: booking.payment_screenshot_url,
        booked_at: booking.booked_at,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status', details: error.message });
  }
};