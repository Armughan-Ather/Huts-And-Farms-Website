import { Sequelize } from 'sequelize';
import db from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const { sequelize } = db;

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing PostgreSQL database...');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Create ENUMs first (if they don't exist)
    console.log('🔧 Creating ENUM types...');
    
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_properties_type AS ENUM ('hut', 'farm');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE shift_type_enum AS ENUM ('Day', 'Night', 'Full Day', 'Full Night');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE booking_source_enum AS ENUM ('web', 'mobile', 'phone', 'walk-in');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ ENUM types created successfully.');

    // Sync all models with force: false to preserve existing data
    console.log('🔧 Synchronizing database models...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synchronized successfully.');

    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database setup complete. You can now start your server.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase;