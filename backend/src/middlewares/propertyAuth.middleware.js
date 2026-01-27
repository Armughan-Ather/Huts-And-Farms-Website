import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const { Property } = db;

export const verifyPropertyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided or invalid format.' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Check if token is for a property or owner
    if (decoded.type === 'property') {
      // Validate property exists
      const property = await Property.findOne({ where: { property_id: decoded.property_id } });
      if (!property) {
        return res.status(404).json({ error: 'Property not found.' });
      }

      // Attach property details to request
      req.property = {
        property_id: property.property_id,
        username: property.username,
      };
    } else if (decoded.type === 'owner') {
      // For owner tokens, we need to get the property from the request or URL
      // For now, we'll allow owner access and handle property validation in the controller
      req.owner = {
        owner_id: decoded.owner_id,
        username: decoded.username,
      };
    } else {
      return res.status(401).json({ error: 'Invalid token. Not authorized as a property or owner.' });
    }

    next();
  } catch (error) {
    console.error('Error verifying property token:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Failed to authenticate property token.', details: error.message });
  }
};