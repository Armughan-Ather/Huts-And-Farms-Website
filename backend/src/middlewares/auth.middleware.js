import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided or invalid format' });
  }

  const token = authHeader.split(' ')[1];

  // Verify token
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach full decoded payload (user_id, email)
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized - Token has expired' });
    }
    return res.status(403).json({ error: 'Forbidden - Invalid token' });
  }
};

export const authenticateAdmin = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided or invalid format' });
  }

  const token = authHeader.split(' ')[1];

  // Verify token
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the token is for an admin
    if (decoded.type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    
    req.admin = decoded; // Attach admin data
    next();
  } catch (error) {
    console.error('Admin token verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized - Token has expired' });
    }
    return res.status(403).json({ error: 'Forbidden - Invalid token' });
  }
};

export const authenticateOwner = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided or invalid format' });
  }

  const token = authHeader.split(' ')[1];

  // Verify token
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the token is for an owner
    if (decoded.type !== 'owner') {
      return res.status(403).json({ error: 'Forbidden - Owner access required' });
    }
    
    req.owner = decoded; // Attach owner data
    next();
  } catch (error) {
    console.error('Owner token verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized - Token has expired' });
    }
    return res.status(403).json({ error: 'Forbidden - Invalid token' });
  }
};