// import bcrypt from 'bcrypt';
// import db from '../models/index.js';
//  const { Owner } = db;

// export const addOwner = async (req, res) => {
//   try {
//     const { first_name, last_name, email, phone_number, username, password } = req.body;

//     if (!email || !username || !password) {
//       return res.status(400).json({ error: 'Email, username, and password are required' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const owner = await Owner.create({
//       first_name,
//       last_name,
//       email,
//       phone_number,
//       username,
//       password: hashedPassword,
//       created_at: new Date(),
//     });

//     res.status(201).json({ message: 'Owner created successfully', owner });
//   } catch (error) {
//     console.error('Error adding owner:', error);
//     res.status(500).json({ error: 'Failed to add owner' });
//   }
// };



import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const { Owner, sequelize } = db;

// Add a new owner
export const addOwner = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { first_name, last_name, email, phone_number, username, password } = req.body;

    // Validate required fields
    if (!email || !username || !password) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required fields: email, username, password' });
    }

    // Check if email already exists
    const existingEmail = await Owner.findOne({ where: { email }, transaction });
    if (existingEmail) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await Owner.findOne({ where: { username }, transaction });
    if (existingUsername) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create owner
    const owner = await Owner.create({
      first_name,
      last_name,
      email,
      phone_number,
      username,
      password: hashedPassword,
      created_at: new Date(),
    }, { transaction });

    await transaction.commit();

    // Return response (excluding password)
    res.status(201).json({
      message: 'Owner created successfully',
      owner: {
        owner_id: owner.owner_id,
        first_name: owner.first_name,
        last_name: owner.last_name,
        email: owner.email,
        phone_number: owner.phone_number,
        username: owner.username,
        created_at: owner.created_at,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding owner:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Failed to add owner',
        details: `Unique constraint violation: ${error.errors.map(e => `${e.path} (${e.value}) already exists`).join(', ')}`,
      });
    }
    res.status(500).json({ error: 'Failed to add owner', details: error.message });
  }
};



export const loginOwner = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing required fields: username, password' });
    }

    // Find owner by username using raw MySQL query
    const owners = await sequelize.query(
      'SELECT owner_id, first_name, last_name, email, phone_number, username, password FROM owners WHERE username = ?',
      {
        replacements: [username],
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Check if owner exists
    if (!owners || owners.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const owner = owners[0];

    // Check password (hashed)
    const isPasswordValid = await bcrypt.compare(password, owner.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        owner_id: owner.owner_id, 
        username: owner.username,
        first_name: owner.first_name,
        last_name: owner.last_name,
        email: owner.email,
        phone_number: owner.phone_number,
        type: 'owner'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // Return response
    res.status(200).json({
      message: 'Owner login successful',
      token,
      owner: {
        owner_id: owner.owner_id,
        first_name: owner.first_name,
        last_name: owner.last_name,
        email: owner.email,
        phone_number: owner.phone_number,
        username: owner.username
      },
    });
  } catch (error) {
    console.error('Error logging in owner:', error);
    res.status(500).json({ error: 'Failed to login owner', details: error.message });
  }
};

export const getOwnerProperties = async (req, res) => {
  try {
    // Get owner_id from middleware
    const { owner_id } = req.owner;

    // Validate owner_id
    if (!owner_id) {
      return res.status(401).json({ error: 'Owner ID not found in authentication data' });
    }

    // Fetch properties using raw MySQL query
    const properties = await sequelize.query(
      'SELECT p.property_id, p.name, p.address, p.type, p.username, p.created_at, p.updated_at ' +
      'FROM properties p ' +
      'INNER JOIN owner_properties op ON p.property_id = op.property_id ' +
      'WHERE op.owner_id = ?',
      {
        replacements: [owner_id],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Return response
    res.status(200).json({
      message: 'Properties retrieved successfully',
      properties,
    });
  } catch (error) {
    console.error('Error retrieving properties:', error);
    res.status(500).json({
      error: 'Failed to retrieve properties',
      details: error.message,
    });
  }
};