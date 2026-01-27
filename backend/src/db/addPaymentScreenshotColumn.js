import db from '../models/index.js';

const { sequelize } = db;

const addPaymentScreenshotColumn = async () => {
  try {
    console.log('Starting payment screenshot column migration...');
    console.log('Connecting to database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    console.log('Adding payment_screenshot_url column to bookings table...');
    
    // Add the column using raw SQL
    await sequelize.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
    `);
    
    console.log('payment_screenshot_url column added successfully');
    
    // Verify the column was added
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'payment_screenshot_url';
    `);
    
    if (results.length > 0) {
      console.log('Column verification successful:', results[0]);
    } else {
      console.log('Warning: Column not found after creation');
    }
    
  } catch (error) {
    console.error('Error adding payment screenshot column:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
};

export default addPaymentScreenshotColumn;