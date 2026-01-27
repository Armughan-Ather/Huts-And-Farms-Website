import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: console.log,
});

async function updateBookingSourceEnum() {
  try {
    console.log('🔧 Updating booking_source_enum...');

    // First, check if there are any bookings using the old enum values
    const existingBookings = await sequelize.query(`
      SELECT DISTINCT booking_source FROM bookings;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('Existing booking sources:', existingBookings);

    // Drop the existing enum type (this will fail if it's in use)
    try {
      await sequelize.query(`DROP TYPE IF EXISTS booking_source_enum CASCADE;`);
      console.log('✅ Dropped existing booking_source_enum');
    } catch (error) {
      console.log('Note: Could not drop enum (might be in use):', error.message);
    }

    // Create the new enum with correct values
    await sequelize.query(`
      CREATE TYPE booking_source_enum AS ENUM ('Website', 'WhatsApp Bot', 'Third-Party');
    `);
    console.log('✅ Created new booking_source_enum with values: Website, WhatsApp Bot, Third-Party');

    // Re-add the enum constraint to the bookings table
    await sequelize.query(`
      ALTER TABLE bookings 
      ALTER COLUMN booking_source TYPE booking_source_enum 
      USING booking_source::text::booking_source_enum;
    `);
    console.log('✅ Updated bookings table to use new enum');

    console.log('🎉 booking_source_enum updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating booking_source_enum:', error);
    
    // If the above fails, try a different approach
    console.log('Trying alternative approach...');
    
    try {
      // Add new enum values to existing enum
      await sequelize.query(`ALTER TYPE booking_source_enum ADD VALUE IF NOT EXISTS 'Website';`);
      await sequelize.query(`ALTER TYPE booking_source_enum ADD VALUE IF NOT EXISTS 'WhatsApp Bot';`);
      await sequelize.query(`ALTER TYPE booking_source_enum ADD VALUE IF NOT EXISTS 'Third-Party';`);
      console.log('✅ Added new values to existing enum');
    } catch (altError) {
      console.error('❌ Alternative approach also failed:', altError);
    }
  } finally {
    await sequelize.close();
  }
}

updateBookingSourceEnum();