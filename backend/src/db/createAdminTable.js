import bcrypt from 'bcrypt';
import db from '../models/index.js';

const { Admin, sequelize } = db;

const createAdminTable = async () => {
  try {
    console.log('Starting admin table creation...');
    console.log('Connecting to database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    console.log('Creating admin table...');
    
    // Sync the Admin model to create the table (force: true to recreate with new schema)
    await Admin.sync({ force: true });
    
    console.log('Admin table created successfully');
    
    // Create the new admin user
    console.log('Creating admin user...');
    
    const hashedPassword = await bcrypt.hash('Fast1234', 10);
    
    const newAdmin = await Admin.create({
      username: 'armughan',
      password: hashedPassword
    });
    
    console.log('Admin created successfully:');
    console.log('Username: armughan');
    console.log('Password: Fast1234');
    console.log('Admin ID:', newAdmin.admin_id);
    
  } catch (error) {
    console.error('Error creating admin table:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
};

export default createAdminTable;