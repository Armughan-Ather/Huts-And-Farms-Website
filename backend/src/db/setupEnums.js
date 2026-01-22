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

async function setupEnums() {
  try {
    console.log('🔧 Setting up database ENUMs...');

    // Create ENUMs if they don't exist
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

    console.log('✅ ENUMs created successfully!');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    await sequelize.close();
    console.log('🔧 Setup complete. You can now restart your server.');
    
  } catch (error) {
    console.error('❌ Error setting up ENUMs:', error);
    process.exit(1);
  }
}

setupEnums();