// import cloudinary from '../utils/cloudinary.js';
// import bcrypt from 'bcrypt';
// import db from '../models/index.js';

// const { Property, PropertyImage, PropertyVideo, PropertyPricing, PropertyAmenity, OwnerProperty, Owner, sequelize } = db;

// // Controller to add a new property (hut or farm)
// export const addProperty = async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     // Validate model imports
//     if (!Property || !PropertyImage || !PropertyVideo || !PropertyPricing || !PropertyAmenity || !OwnerProperty || !Owner) {
//       throw new Error('One or more models are undefined. Check models/index.js exports.');
//     }

//     const {
//       name,
//       description,
//       address,
//       city,
//       province,
//       country,
//       contact_person,
//       contact_number,
//       email,
//       max_occupancy,
//       username,
//       password,
//       type,
//       owner_id,
//       pricing,
//       amenities,
//     } = req.body;

//     // Validate required fields
//     if (!name || !type || !owner_id || !pricing || !password) {
//       await transaction.rollback();
//       return res.status(400).json({ error: 'Missing required fields: name, type, owner_id, pricing, password' });
//     }

//     // Validate owner exists
//     const owner = await Owner.findByPk(owner_id, { transaction });
//     if (!owner) {
//       await transaction.rollback();
//       return res.status(404).json({ error: 'Owner not found' });
//     }

//     // Validate type
//     if (!['hut', 'farm'].includes(type)) {
//       await transaction.rollback();
//       return res.status(400).json({ error: 'Invalid property type. Must be "hut" or "farm"' });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Parse pricing and amenities if sent as JSON strings
//     const pricingData = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
//     const amenitiesData = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;

//     // Create property
//     const property = await Property.create({
//       name,
//       description,
//       address,
//       city,
//       province,
//       country,
//       contact_person,
//       contact_number,
//       email,
//       max_occupancy: max_occupancy ? parseInt(max_occupancy) : null,
//       username,
//       password: hashedPassword,
//       type,
//       created_at: new Date(),
//       updated_at: new Date(),
//     }, { transaction });

//     // Associate property with owner
//     await OwnerProperty.create({
//       owner_id,
//       property_id: property.property_id,
//     }, { transaction });

//     // Create pricing
//     await PropertyPricing.create({
//       property_id: property.property_id,
//       base_price_day_shift: pricingData.base_price_day_shift ? parseFloat(pricingData.base_price_day_shift) : null,
//       base_price_night_shift: pricingData.base_price_night_shift ? parseFloat(pricingData.base_price_night_shift) : null,
//       base_price_full_day: pricingData.base_price_full_day ? parseFloat(pricingData.base_price_full_day) : null,
//       weekend_multiplier: pricingData.weekend_multiplier ? parseFloat(pricingData.weekend_multiplier) : null,
//       season_start_date: pricingData.season_start_date ? new Date(pricingData.season_start_date) : null,
//       season_end_date: pricingData.season_end_date ? new Date(pricingData.season_end_date) : null,
//       special_offer_note: pricingData.special_offer_note,
//     }, { transaction });

//     // Create amenities
//     const amenityRecords = [];
//     if (amenitiesData && Array.isArray(amenitiesData)) {
//       for (const amenity of amenitiesData) {
//         const record = await PropertyAmenity.create({
//           property_id: property.property_id,
//           type: amenity.type,
//           value: amenity.value,
//         }, { transaction });
//         amenityRecords.push(record);
//       }
//     }

//     // Handle image uploads
//     const uploadedImages = [];
//     if (req.files && req.files.images) {
//       for (const image of req.files.images) {
//         const imageBuffer = image.buffer.toString('base64');
//         const result = await cloudinary.uploader.upload(
//           `data:${image.mimetype};base64,${imageBuffer}`,
//           {
//             folder: `huts_and_farms/properties/${property.property_id}/images`,
//             resource_type: 'image',
//           }
//         );

//         const propertyImage = await PropertyImage.create({
//           property_id: property.property_id,
//           image_url: result.secure_url,
//           uploaded_at: new Date(),
//         }, { transaction });
//         uploadedImages.push(propertyImage);
//       }
//     }

//     // Handle video uploads
//     const uploadedVideos = [];
//     if (req.files && req.files.videos) {
//       for (const video of req.files.videos) {
//         const videoBuffer = video.buffer.toString('base64');
//         const result = await cloudinary.uploader.upload(
//           `data:${video.mimetype};base64,${videoBuffer}`,
//           {
//             folder: `huts_and_farms/properties/${property.property_id}/videos`,
//             resource_type: 'video',
//           }
//         );

//         const propertyVideo = await PropertyVideo.create({
//           property_id: property.property_id,
//           video_url: result.secure_url,
//           uploaded_at: new Date(),
//         }, { transaction });
//         uploadedVideos.push(propertyVideo);
//       }
//     }

//     await transaction.commit();

//     // Return response
//     res.status(201).json({
//       message: 'Property added successfully',
//       property,
//       pricing: pricingData,
//       amenities: amenityRecords,
//       images: uploadedImages,
//       videos: uploadedVideos,
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error('Error adding property:', error);
//     if (error.name === 'SequelizeUniqueConstraintError') {
//       return res.status(400).json({
//         error: 'Failed to add property',
//         details: `Unique constraint violation: ${error.errors.map(e => `${e.path} (${e.value}) already exists`).join(', ')}`,
//       });
//     }
//     res.status(500).json({ error: 'Failed to add property', details: error.message });
//   }
// };




import { v4 as uuidv4 } from 'uuid';
import cloudinary from '../utils/cloudinary.js';
import bcrypt from 'bcrypt';
import db from '../models/index.js';
import jwt from 'jsonwebtoken';

const { Property, PropertyImage, PropertyVideo, PropertyPricing, PropertyShiftPricing, PropertyAmenity, OwnerProperty, Owner, sequelize } = db;

// Controller to add a new property (hut or farm)
export const addProperty = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Validate model imports
    if (!Property || !PropertyImage || !PropertyVideo || !PropertyPricing || !PropertyShiftPricing || !PropertyAmenity || !OwnerProperty || !Owner) {
      throw new Error('One or more models are undefined. Check models/index.js exports.');
    }

    const {
      name,
      description,
      address,
      city,
      province,
      country,
      contact_person,
      contact_number,
      email,
      max_occupancy,
      username,
      password,
      type,
      advance_percentage,
      owner_username,
      pricing,
      amenities,
    } = req.body;

    // Validate required fields
    if (!name || !type || !owner_username || !pricing || !password) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required fields: name, type, owner_username, pricing, password' });
    }

    // Validate owner exists by username
    const owner = await Owner.findOne({ where: { username: owner_username }, transaction });
    if (!owner) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Owner not found' });
    }

    // Validate type
    if (!['hut', 'farm'].includes(type)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid property type. Must be "hut" or "farm"' });
    }

    // Validate advance_percentage (if provided)
    if (advance_percentage && (isNaN(advance_percentage) || advance_percentage < 0 || advance_percentage > 100)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid advance_percentage: must be a number between 0 and 100' });
    }

    // Log raw pricing and amenities for debugging
    console.log('Raw pricing:', pricing);
    console.log('Raw amenities:', amenities);

    // Parse pricing and amenities with error handling
    let pricingData, amenitiesData;
    try {
      // Sanitize input: trim whitespace, remove extra quotes, replace newlines
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input;
        return input
          .trim()
          .replace(/^"|"$/g, '') // Remove surrounding quotes
          .replace(/\n/g, '') // Remove newlines
          .replace(/\r/g, ''); // Remove carriage returns
      };
      pricingData = sanitizeInput(pricing);
      amenitiesData = sanitizeInput(amenities);
      pricingData = typeof pricingData === 'string' ? JSON.parse(pricingData) : pricingData;
      amenitiesData = typeof amenitiesData === 'string' ? JSON.parse(amenitiesData) : amenitiesData;
      // Handle case where pricing is an array with one object
      if (Array.isArray(pricingData) && pricingData.length === 1) {
        pricingData = pricingData[0];
      }
    } catch (parseError) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Invalid JSON format for pricing or amenities',
        details: parseError.message,
        raw_pricing: pricing,
        raw_amenities: amenities
      });
    }

    // Validate pricing data
    if (!pricingData.season_start_date || !pricingData.season_end_date || !pricingData.shift_pricing || !Array.isArray(pricingData.shift_pricing)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid pricing data: season_start_date, season_end_date, and shift_pricing array are required' });
    }

    // Validate amenities data
    if (amenitiesData && Array.isArray(amenitiesData)) {
      for (const amenity of amenitiesData) {
        if (!amenity.type || !amenity.value) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Invalid amenities: each amenity must have type and value' });
        }
        // Normalize amenity type to lowercase
        amenity.type = amenity.type.toLowerCase();
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create property
    const property = await Property.create({
      property_id: uuidv4(),
      name,
      description,
      address,
      city,
      province,
      country,
      contact_person,
      contact_number,
      email,
      max_occupancy: max_occupancy ? parseInt(max_occupancy) : null,
      username,
      password: hashedPassword,
      type,
      advance_percentage: advance_percentage ? parseFloat(advance_percentage) : null,
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });

    // Associate property with owner
    await OwnerProperty.create({
      id: uuidv4(),
      owner_id: owner.owner_id,
      property_id: property.property_id,
    }, { transaction });

    // Create pricing
    const propertyPricing = await PropertyPricing.create({
      pricing_id: uuidv4(),
      property_id: property.property_id,
      season_start_date: new Date(pricingData.season_start_date),
      season_end_date: new Date(pricingData.season_end_date),
      special_offer_note: pricingData.special_offer_note,
    }, { transaction });

    // Create shift pricing
    const shiftPricingRecords = [];
    for (const shift of pricingData.shift_pricing) {
      if (!['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(shift.day_of_week) ||
        !['Day', 'Night', 'Full Day', 'Full Night'].includes(shift.shift_type) ||
        isNaN(shift.price)) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid shift pricing: must include valid day_of_week, shift_type, and price' });
      }
      const record = await PropertyShiftPricing.create({
        id: uuidv4(),
        pricing_id: propertyPricing.pricing_id,
        day_of_week: shift.day_of_week,
        shift_type: shift.shift_type,
        price: parseFloat(shift.price),
      }, { transaction });
      shiftPricingRecords.push(record);
    }

    // Create amenities
    const amenityRecords = [];
    if (amenitiesData && Array.isArray(amenitiesData)) {
      for (const amenity of amenitiesData) {
        const record = await PropertyAmenity.create({
          amenity_id: uuidv4(),
          property_id: property.property_id,
          type: amenity.type,
          value: amenity.value,
        }, { transaction });
        amenityRecords.push(record);
      }
    }

    // Handle image uploads
    const uploadedImages = [];
    if (req.files && req.files.images) {
      const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      for (const image of images) {
        const imageBuffer = image.buffer.toString('base64');
        const result = await cloudinary.uploader.upload(
          `data:${image.mimetype};base64,${imageBuffer}`,
          {
            folder: `huts_and_farms/properties/${property.property_id}/images`,
            resource_type: 'image',
          }
        );

        const propertyImage = await PropertyImage.create({
          image_id: uuidv4(),
          property_id: property.property_id,
          image_url: result.secure_url,
          uploaded_at: new Date(),
        }, { transaction });
        uploadedImages.push(propertyImage);
      }
    }

    // Handle video uploads
    const uploadedVideos = [];
    if (req.files && req.files.videos) {
      const videos = Array.isArray(req.files.videos) ? req.files.videos : [req.files.videos];
      for (const video of videos) {
        const videoBuffer = video.buffer.toString('base64');
        const result = await cloudinary.uploader.upload(
          `data:${video.mimetype};base64,${videoBuffer}`,
          {
            folder: `huts_and_farms/properties/${property.property_id}/videos`,
            resource_type: 'video',
          }
        );

        const propertyVideo = await PropertyVideo.create({
          video_id: uuidv4(),
          property_id: property.property_id,
          video_url: result.secure_url,
          uploaded_at: new Date(),
        }, { transaction });
        uploadedVideos.push(propertyVideo);
      }
    }

    await transaction.commit();

    // Return response
    res.status(201).json({
      message: 'Property added successfully',
      property: {
        property_id: property.property_id,
        name: property.name,
        description: property.description,
        address: property.address,
        city: property.city,
        province: property.province,
        country: property.country,
        contact_person: property.contact_person,
        contact_number: property.contact_number,
        email: property.email,
        max_occupancy: property.max_occupancy,
        username: property.username,
        type: property.type,
        advance_percentage: property.advance_percentage,
        created_at: property.created_at,
        updated_at: property.updated_at,
      },
      pricing: {
        pricing_id: propertyPricing.pricing_id,
        season_start_date: propertyPricing.season_start_date,
        season_end_date: propertyPricing.season_end_date,
        special_offer_note: propertyPricing.special_offer_note,
        shift_pricing: shiftPricingRecords,
      },
      amenities: amenityRecords,
      images: uploadedImages,
      videos: uploadedVideos,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding property:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Failed to add property',
        details: `Unique constraint violation: ${error.errors.map(e => `${e.path} (${e.value}) already exists`).join(', ')}`,
      });
    }
    res.status(500).json({
      error: 'Failed to add property',
      details: error.message,
      raw_pricing: pricing,
      raw_amenities: amenities
    });
  }
};

// Controller to edit an existing property
export const editProperty = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Validate model imports
    if (!Property) {
      throw new Error('Property model is undefined. Check models/index.js exports.');
    }

    // Get property_id from either property or owner token
    let property_id;
    
    if (req.property) {
      // Property token - get property_id from token
      property_id = req.property.property_id;
    } else if (req.owner) {
      // Owner token - get property_id from request body and validate ownership
      property_id = req.body.property_id;
      
      if (!property_id) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Property ID is required for owner access' });
      }
      
      // Verify that the owner actually owns this property
      const ownerProperty = await OwnerProperty.findOne({
        where: {
          owner_id: req.owner.owner_id,
          property_id: property_id
        }
      });
      
      if (!ownerProperty) {
        await transaction.rollback();
        return res.status(403).json({ error: 'Access denied. You do not own this property.' });
      }
    } else {
      await transaction.rollback();
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      name,
      description,
      address,
      city,
      province,
      country,
      contact_person,
      contact_number,
      email,
      max_occupancy,
      username,
      password,
      type,
      advance_percentage,
    } = req.body;

    // Validate required fields
    if (!property_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required field: property_id' });
    }

    // Find the property
    const property = await Property.findOne({ where: { property_id }, transaction });
    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Property not found' });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date(),
    };

    // Add fields to update if provided
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (province) updateData.province = province;
    if (country) updateData.country = country;
    if (contact_person) updateData.contact_person = contact_person;
    if (contact_number) updateData.contact_number = contact_number;
    if (email) updateData.email = email;
    if (max_occupancy) updateData.max_occupancy = parseInt(max_occupancy);
    if (username) updateData.username = username;
    if (type) {
      if (!['hut', 'farm'].includes(type)) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid property type. Must be "hut" or "farm"' });
      }
      updateData.type = type;
    }
    if (advance_percentage) {
      if (isNaN(advance_percentage) || advance_percentage < 0 || advance_percentage > 100) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid advance_percentage: must be a number between 0 and 100' });
      }
      updateData.advance_percentage = parseFloat(advance_percentage);
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update property
    await Property.update(updateData, { where: { property_id }, transaction });

    // Fetch updated property
    const updatedProperty = await Property.findOne({ where: { property_id }, transaction });

    await transaction.commit();

    // Return response
    res.status(200).json({
      message: 'Property updated successfully',
      property: {
        property_id: updatedProperty.property_id,
        name: updatedProperty.name,
        description: updatedProperty.description,
        address: updatedProperty.address,
        city: updatedProperty.city,
        province: updatedProperty.province,
        country: updatedProperty.country,
        contact_person: updatedProperty.contact_person,
        contact_number: updatedProperty.contact_number,
        email: updatedProperty.email,
        max_occupancy: updatedProperty.max_occupancy,
        username: updatedProperty.username,
        type: updatedProperty.type,
        advance_percentage: updatedProperty.advance_percentage,
        created_at: updatedProperty.created_at,
        updated_at: updatedProperty.updated_at,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating property:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Failed to update property',
        details: `Unique constraint violation: ${error.errors.map(e => `${e.path} (${e.value}) already exists`).join(', ')}`,
      });
    }
    res.status(500).json({
      error: 'Failed to update property',
      details: error.message,
    });
  }
};



// Controller to edit amenities for a property
export const editPropertyAmenities = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Validate model imports
    if (!Property || !PropertyAmenity) {
      throw new Error('One or more models are undefined. Check models/index.js exports.');
    }

    // Get property_id from either property or owner token
    let property_id;
    
    if (req.property) {
      // Property token - get property_id from token
      property_id = req.property.property_id;
    } else if (req.owner) {
      // Owner token - get property_id from request body and validate ownership
      property_id = req.body.property_id;
      
      if (!property_id) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Property ID is required for owner access' });
      }
      
      // Verify that the owner actually owns this property
      const ownerProperty = await OwnerProperty.findOne({
        where: {
          owner_id: req.owner.owner_id,
          property_id: property_id
        }
      });
      
      if (!ownerProperty) {
        await transaction.rollback();
        return res.status(403).json({ error: 'Access denied. You do not own this property.' });
      }
    } else {
      await transaction.rollback();
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { amenities } = req.body;

    // Validate required fields
    if (!property_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required field: property_id' });
    }

    // Validate property exists
    const property = await Property.findOne({ where: { property_id }, transaction });
    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Property not found' });
    }

    // Parse amenities data if it's a string
    let amenitiesData;
    try {
      amenitiesData = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    } catch (parseError) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid JSON format for amenities', details: parseError.message });
    }

    // Validate amenities data
    if (amenitiesData && Array.isArray(amenitiesData)) {
      for (const amenity of amenitiesData) {
        if (!amenity.type || !amenity.value) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Invalid amenities: each amenity must have type and value' });
        }
        // Normalize amenity type to lowercase
        amenity.type = amenity.type.toLowerCase();
      }
    }

    // Delete existing amenities
    await PropertyAmenity.destroy({ where: { property_id }, transaction });

    // Create new amenities
    const amenityRecords = [];
    if (amenitiesData && Array.isArray(amenitiesData) && amenitiesData.length > 0) {
      for (const amenity of amenitiesData) {
        if (amenity.type && amenity.value) { // Only create if both type and value exist
          const record = await PropertyAmenity.create({
            amenity_id: uuidv4(),
            property_id,
            type: amenity.type.toLowerCase(),
            value: amenity.value,
          }, { transaction });
          amenityRecords.push(record);
        }
      }
    }

    await transaction.commit();

    // Return response
    res.status(200).json({
      message: 'Amenities updated successfully',
      amenities: amenityRecords,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating property amenities:', error);
    res.status(500).json({
      error: 'Failed to update property amenities',
      details: error.message,
    });
  }
};

// Controller to delete images and videos for a property
export const deletePropertyMedia = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Validate model imports
    if (!Property || !PropertyImage || !PropertyVideo) {
      throw new Error('One or more models are undefined. Check models/index.js exports.');
    }
    console.log('Delete media request body:', req.body);

    // Get property_id from either property or owner token
    let property_id;
    
    if (req.property) {
      // Property token - get property_id from token
      property_id = req.property.property_id;
    } else if (req.owner) {
      // Owner token - get property_id from request body and validate ownership
      property_id = req.body.property_id;
      
      if (!property_id) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Property ID is required for owner access' });
      }
      
      // Verify that the owner actually owns this property
      const ownerProperty = await OwnerProperty.findOne({
        where: {
          owner_id: req.owner.owner_id,
          property_id: property_id
        }
      });
      
      if (!ownerProperty) {
        await transaction.rollback();
        return res.status(403).json({ error: 'Access denied. You do not own this property.' });
      }
    } else {
      await transaction.rollback();
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { image_ids, video_ids } = req.body;

    // Validate required fields
    if (!property_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required field: property_id' });
    }

    // Validate property exists
    const property = await Property.findOne({ where: { property_id }, transaction });
    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Property not found' });
    }

    const deletedImages = [];
    const deletedVideos = [];

    // Delete images if image_ids provided
    if (image_ids) {
      let imageIdsArray;
      try {
        imageIdsArray = typeof image_ids === 'string' ? JSON.parse(image_ids) : image_ids;
        if (!Array.isArray(imageIdsArray)) {
          await transaction.rollback();
          return res.status(400).json({ error: 'image_ids must be an array' });
        }
      } catch (parseError) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid JSON format for image_ids', details: parseError.message });
      }

      // Validate image_ids belong to the property
      const images = await PropertyImage.findAll({ where: { image_id: imageIdsArray, property_id }, transaction });
      if (images.length !== imageIdsArray.length) {
        await transaction.rollback();
        return res.status(400).json({ error: 'One or more image_ids are invalid or do not belong to this property' });
      }

      // Delete from Cloudinary
      for (const image of images) {
        const publicId = image.image_url.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      }

      // Delete from database
      await PropertyImage.destroy({ where: { image_id: imageIdsArray, property_id }, transaction });
      deletedImages.push(...imageIdsArray);
    }

    // Delete videos if video_ids provided
    if (video_ids) {
      let videoIdsArray;
      try {
        videoIdsArray = typeof video_ids === 'string' ? JSON.parse(video_ids) : video_ids;
        if (!Array.isArray(videoIdsArray)) {
          await transaction.rollback();
          return res.status(400).json({ error: 'video_ids must be an array' });
        }
      } catch (parseError) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid JSON format for video_ids', details: parseError.message });
      }

      // Validate video_ids belong to the property
      const videos = await PropertyVideo.findAll({ where: { video_id: videoIdsArray, property_id }, transaction });
      if (videos.length !== videoIdsArray.length) {
        await transaction.rollback();
        return res.status(400).json({ error: 'One or more video_ids are invalid or do not belong to this property' });
      }

      // Delete from Cloudinary
      for (const video of videos) {
        const publicId = video.video_url.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }

      // Delete from database
      await PropertyVideo.destroy({ where: { video_id: videoIdsArray, property_id }, transaction });
      deletedVideos.push(...videoIdsArray);
    }

    await transaction.commit();

    // Return response
    res.status(200).json({
      message: 'Media deleted successfully',
      deleted_images: deletedImages,
      deleted_videos: deletedVideos,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting property media:', error);
    res.status(500).json({
      error: 'Failed to delete property media',
      details: error.message,
    });
  }
};

// Controller to edit pricing for a property
export const editPropertyPricing = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Validate model imports
    if (!Property || !PropertyPricing || !PropertyShiftPricing) {
      throw new Error('One or more models are undefined. Check models/index.js exports.');
    }

    // Get property_id from either property or owner token
    let property_id;
    
    if (req.property) {
      // Property token - get property_id from token
      property_id = req.property.property_id;
    } else if (req.owner) {
      // Owner token - get property_id from request body and validate ownership
      property_id = req.body.property_id;
      
      if (!property_id) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Property ID is required for owner access' });
      }
      
      // Verify that the owner actually owns this property
      const ownerProperty = await OwnerProperty.findOne({
        where: {
          owner_id: req.owner.owner_id,
          property_id: property_id
        }
      });
      
      if (!ownerProperty) {
        await transaction.rollback();
        return res.status(403).json({ error: 'Access denied. You do not own this property.' });
      }
    } else {
      await transaction.rollback();
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { pricing_data } = req.body;

    // Validate required fields
    if (!property_id || !pricing_data) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required fields: property_id and pricing_data' });
    }

    // Validate property exists
    const property = await Property.findOne({ where: { property_id }, transaction });
    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Property not found' });
    }

    // Parse pricing data if it's a string
    let pricingData;
    try {
      pricingData = typeof pricing_data === 'string' ? JSON.parse(pricing_data) : pricing_data;
    } catch (parseError) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid JSON format for pricing_data', details: parseError.message });
    }

    // Validate pricing data structure
    if (!pricingData.season_start_date || !pricingData.season_end_date) {
      await transaction.rollback();
      return res.status(400).json({ error: 'season_start_date and season_end_date are required' });
    }

    // Find existing pricing
    let propertyPricing = await PropertyPricing.findOne({ where: { property_id }, transaction });

    if (propertyPricing) {
      // Update existing pricing
      await PropertyPricing.update({
        season_start_date: new Date(pricingData.season_start_date),
        season_end_date: new Date(pricingData.season_end_date),
        special_offer_note: pricingData.special_offer_note || null,
      }, { where: { property_id }, transaction });

      // Get updated pricing
      propertyPricing = await PropertyPricing.findOne({ where: { property_id }, transaction });
    } else {
      // Create new pricing
      propertyPricing = await PropertyPricing.create({
        pricing_id: uuidv4(),
        property_id,
        season_start_date: new Date(pricingData.season_start_date),
        season_end_date: new Date(pricingData.season_end_date),
        special_offer_note: pricingData.special_offer_note || null,
      }, { transaction });
    }

    // Handle shift pricing updates
    if (pricingData.shift_pricing && Array.isArray(pricingData.shift_pricing)) {
      // Delete existing shift pricing
      await PropertyShiftPricing.destroy({ where: { pricing_id: propertyPricing.pricing_id }, transaction });

      // Create new shift pricing
      const shiftPricingRecords = [];
      for (const shift of pricingData.shift_pricing) {
        if (!['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(shift.day_of_week) ||
          !['Day', 'Night', 'Full Day', 'Full Night'].includes(shift.shift_type) ||
          isNaN(shift.price)) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Invalid shift pricing: must include valid day_of_week, shift_type, and price' });
        }
        const record = await PropertyShiftPricing.create({
          id: uuidv4(),
          pricing_id: propertyPricing.pricing_id,
          day_of_week: shift.day_of_week,
          shift_type: shift.shift_type,
          price: parseFloat(shift.price),
        }, { transaction });
        shiftPricingRecords.push(record);
      }
    }

    await transaction.commit();

    // Fetch updated pricing with shift pricing
    const updatedPricing = await PropertyPricing.findOne({
      where: { property_id },
      include: [
        {
          model: PropertyShiftPricing,
          attributes: ['id', 'day_of_week', 'shift_type', 'price'],
        },
      ],
    });

    // Return response
    res.status(200).json({
      message: 'Pricing updated successfully',
      pricing: {
        pricing_id: updatedPricing.pricing_id,
        season_start_date: updatedPricing.season_start_date,
        season_end_date: updatedPricing.season_end_date,
        special_offer_note: updatedPricing.special_offer_note,
        shift_pricing: updatedPricing.PropertyShiftPricings || [],
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating property pricing:', error);
    res.status(500).json({
      error: 'Failed to update property pricing',
      details: error.message,
    });
  }
};

// Controller to upload new images and videos for a property
export const uploadPropertyMedia = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Validate model imports
    if (!Property || !PropertyImage || !PropertyVideo) {
      throw new Error('One or more models are undefined. Check models/index.js exports.');
    }

    // Get property_id from either property or owner token
    let property_id;
    
    if (req.property) {
      // Property token - get property_id from token
      property_id = req.property.property_id;
    } else if (req.owner) {
      // Owner token - get property_id from request body and validate ownership
      property_id = req.body.property_id;
      
      if (!property_id) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Property ID is required for owner access' });
      }
      
      // Verify that the owner actually owns this property
      const ownerProperty = await OwnerProperty.findOne({
        where: {
          owner_id: req.owner.owner_id,
          property_id: property_id
        }
      });
      
      if (!ownerProperty) {
        await transaction.rollback();
        return res.status(403).json({ error: 'Access denied. You do not own this property.' });
      }
    } else {
      await transaction.rollback();
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate required fields
    if (!property_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required field: property_id' });
    }

    // Validate property exists
    const property = await Property.findOne({ where: { property_id }, transaction });
    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Property not found' });
    }

    // Handle image uploads
    const uploadedImages = [];
    if (req.files && req.files.images) {
      const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      for (const image of images) {
        const imageBuffer = image.buffer.toString('base64');
        const result = await cloudinary.uploader.upload(
          `data:${image.mimetype};base64,${imageBuffer}`,
          {
            folder: `huts_and_farms/properties/${property_id}/images`,
            resource_type: 'image',
          }
        );

        const propertyImage = await PropertyImage.create({
          image_id: uuidv4(),
          property_id,
          image_url: result.secure_url,
          uploaded_at: new Date(),
        }, { transaction });
        uploadedImages.push(propertyImage);
      }
    }

    // Handle video uploads
    const uploadedVideos = [];
    if (req.files && req.files.videos) {
      const videos = Array.isArray(req.files.videos) ? req.files.videos : [req.files.videos];
      for (const video of videos) {
        const videoBuffer = video.buffer.toString('base64');
        const result = await cloudinary.uploader.upload(
          `data:${video.mimetype};base64,${videoBuffer}`,
          {
            folder: `huts_and_farms/properties/${property_id}/videos`,
            resource_type: 'video',
          }
        );

        const propertyVideo = await PropertyVideo.create({
          video_id: uuidv4(),
          property_id,
          video_url: result.secure_url,
          uploaded_at: new Date(),
        }, { transaction });
        uploadedVideos.push(propertyVideo);
      }
    }

    await transaction.commit();

    // Return response
    res.status(201).json({
      message: 'Media uploaded successfully',
      images: uploadedImages,
      videos: uploadedVideos,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error uploading property media:', error);
    res.status(500).json({
      error: 'Failed to upload property media',
      details: error.message,
    });
  }
};

export const loginProperty = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing required fields: username and password' });
    }

    // Find property by username
    const property = await Property.findOne({ where: { username } });
    if (!property) {
      return res.status(404).json({ error: 'Property not found', message: `No property found with username: ${username}` });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, property.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { property_id: property.property_id, username: property.username, type: 'property' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    // Return response
    res.status(200).json({
      message: 'Login successful',
      token,
      property: {
        property_id: property.property_id,
        username: property.username,
        name: property.name,
        type: property.type,
      },
    });
  } catch (error) {
    console.error('Error logging in property:', error);
    res.status(500).json({
      error: 'Failed to login property',
      details: error.message,
    });
  }
};
export const getProperty = async (req, res) => {
  try {
    let property_id;
    
    // Handle both property and owner authentication
    if (req.property) {
      // Property token - get property_id from token
      property_id = req.property.property_id;
    } else if (req.owner) {
      // Owner token - get property_id from localStorage/request body
      // For owner access, we expect the property_id to be passed in the request
      property_id = req.query.property_id || req.body.property_id;
      
      if (!property_id) {
        return res.status(400).json({ error: 'Property ID is required for owner access' });
      }
      
      // Verify that the owner actually owns this property
      const ownerProperty = await OwnerProperty.findOne({
        where: {
          owner_id: req.owner.owner_id,
          property_id: property_id
        }
      });
      
      if (!ownerProperty) {
        return res.status(403).json({ error: 'Access denied. You do not own this property.' });
      }
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate property_id
    if (!property_id) {
      return res.status(400).json({ error: 'Property ID not found' });
    }

    // Find property with associated data
    const property = await Property.findOne({
      where: { property_id },
      include: [
        {
          model: PropertyPricing,
          include: [
            {
              model: PropertyShiftPricing,
              attributes: ['id', 'day_of_week', 'shift_type', 'price'],
            },
          ],
          attributes: ['pricing_id', 'season_start_date', 'season_end_date', 'special_offer_note'],
        },
        {
          model: PropertyAmenity,
          attributes: ['amenity_id', 'type', 'value'],
        },
        {
          model: PropertyImage,
          attributes: ['image_id', 'image_url', 'uploaded_at'],
        },
        {
          model: PropertyVideo,
          attributes: ['video_id', 'video_url', 'uploaded_at'],
        },
        {
          model: OwnerProperty,
          include: [
            {
              model: Owner,
              attributes: ['username'],
            },
          ],
          attributes: ['id'],
        },
      ],
      attributes: [
        'property_id',
        'name',
        'description',
        'address',
        'city',
        'province',
        'country',
        'contact_person',
        'contact_number',
        'email',
        'max_occupancy',
        'username',
        'type',
        'advance_percentage',
        'created_at',
        'updated_at',
      ],
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Format response to match addProperty structure
    const response = {
      message: 'Property retrieved successfully',
      property: {
        property_id: property.property_id,
        name: property.name,
        description: property.description,
        address: property.address,
        city: property.city,
        province: property.province,
        country: property.country,
        contact_person: property.contact_person,
        contact_number: property.contact_number,
        email: property.email,
        max_occupancy: property.max_occupancy,
        username: property.username,
        type: property.type,
        advance_percentage: property.advance_percentage,
        created_at: property.created_at,
        updated_at: property.updated_at,
      },
      pricing: property.PropertyPricing
        ? {
          pricing_id: property.PropertyPricing.pricing_id,
          season_start_date: property.PropertyPricing.season_start_date,
          season_end_date: property.PropertyPricing.season_end_date,
          special_offer_note: property.PropertyPricing.special_offer_note,
          shift_pricing: property.PropertyPricing.PropertyShiftPricings || [],
        }
        : null,
      amenities: property.PropertyAmenities || [],
      images: property.PropertyImages || [],
      videos: property.PropertyVideos || [],
      owner_username: property.OwnerProperties?.[0]?.Owner?.username || null,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving property:', error);
    res.status(500).json({
      error: 'Failed to retrieve property',
      details: error.message,
    });
  }
};