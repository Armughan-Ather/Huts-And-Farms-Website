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

async function resetDatabase() {
  try {
    console.log('🔧 Resetting PostgreSQL database...');

    // Drop all tables first
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');

    console.log('✅ Database schema reset successfully.');

    // Create ENUMs
    console.log('🔧 Creating ENUM types...');
    
    await sequelize.query(`CREATE TYPE enum_properties_type AS ENUM ('hut', 'farm');`);
    await sequelize.query(`CREATE TYPE shift_type_enum AS ENUM ('Day', 'Night', 'Full Day', 'Full Night');`);
    await sequelize.query(`CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');`);
    await sequelize.query(`CREATE TYPE booking_source_enum AS ENUM ('web', 'mobile', 'phone', 'walk-in');`);

    console.log('✅ ENUM types created successfully.');

    await sequelize.close();
    console.log('🎉 Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();