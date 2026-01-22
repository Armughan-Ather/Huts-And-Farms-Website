import dotenv from 'dotenv';
dotenv.config();

import { Sequelize, DataTypes } from 'sequelize';

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

async function addEmailVerificationColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to NeonDB');

    // Add new columns to users table
    const queryInterface = sequelize.getQueryInterface();

    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.is_email_verified) {
      await queryInterface.addColumn('users', 'is_email_verified', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      console.log('✅ Added is_email_verified column');
    }

    if (!tableDescription.verification_code) {
      await queryInterface.addColumn('users', 'verification_code', {
        type: DataTypes.STRING(6),
        allowNull: true,
      });
      console.log('✅ Added verification_code column');
    }

    if (!tableDescription.verification_code_expires) {
      await queryInterface.addColumn('users', 'verification_code_expires', {
        type: DataTypes.DATE,
        allowNull: true,
      });
      console.log('✅ Added verification_code_expires column');
    }

    if (!tableDescription.reset_password_code) {
      await queryInterface.addColumn('users', 'reset_password_code', {
        type: DataTypes.STRING(6),
        allowNull: true,
      });
      console.log('✅ Added reset_password_code column');
    }

    if (!tableDescription.reset_password_expires) {
      await queryInterface.addColumn('users', 'reset_password_expires', {
        type: DataTypes.DATE,
        allowNull: true,
      });
      console.log('✅ Added reset_password_expires column');
    }

    // Update existing users to be email verified (optional - you can remove this if you want existing users to verify)
    await sequelize.query(`
      UPDATE users 
      SET is_email_verified = true 
      WHERE is_email_verified IS NULL OR is_email_verified = false
    `);
    console.log('✅ Updated existing users to be email verified');

    console.log('🎉 Email verification columns added successfully!');
  } catch (error) {
    console.error('❌ Error adding email verification columns:', error);
  } finally {
    await sequelize.close();
  }
}

addEmailVerificationColumns();