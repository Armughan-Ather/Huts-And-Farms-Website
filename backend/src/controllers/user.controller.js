import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { sendVerificationEmail, generateVerificationCode } from '../utils/emailService.js';

const { User, sequelize } = db;

// Send verification code for signup
export const sendSignupVerification = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, email, phone_number, password, cnic } = req.body;

    // Validate required fields
    if (!email || !phone_number || !password) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required fields: email, phone_number, password' });
    }

    // Validate CNIC format (if provided)
    if (cnic && !/^\d{13}$/.test(cnic)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid CNIC: must be exactly 13 digits' });
    }

    // Check if email already exists and is verified
    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser && existingUser.is_email_verified) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Email already registered and verified' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Update existing unverified user
      await existingUser.update({
        name,
        phone_number,
        password: hashedPassword,
        cnic,
        verification_code: verificationCode,
        verification_code_expires: expiresAt,
      }, { transaction });
    } else {
      // Create new user
      await User.create({
        name,
        email,
        phone_number,
        password: hashedPassword,
        cnic,
        verification_code: verificationCode,
        verification_code_expires: expiresAt,
        is_email_verified: false,
        created_at: new Date(),
      }, { transaction });
    }

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode, 'signup');
    if (!emailResult.success) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    await transaction.commit();

    res.status(200).json({
      message: 'Verification code sent to your email',
      email: email,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error sending signup verification:', error);
    res.status(500).json({ error: 'Failed to send verification code', details: error.message });
  }
};

// Verify signup code and complete registration
export const verifySignupCode = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Find user with verification code
    const user = await User.findOne({ 
      where: { 
        email,
        verification_code: code,
      }, 
      transaction 
    });

    if (!user) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code is expired
    if (new Date() > user.verification_code_expires) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Verify user and clear verification code
    await user.update({
      is_email_verified: true,
      verification_code: null,
      verification_code_expires: null,
    }, { transaction });

    await transaction.commit();

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        cnic: user.cnic,
        is_email_verified: user.is_email_verified,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error verifying signup code:', error);
    res.status(500).json({ error: 'Failed to verify code', details: error.message });
  }
};

// Login a user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.is_email_verified) {
      return res.status(401).json({ error: 'Please verify your email before logging in' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return response
    res.status(200).json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        cnic: user.cnic,
        is_email_verified: user.is_email_verified,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
};



// Send forgot password code
export const sendForgotPasswordCode = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { email } = req.body;

    if (!email) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    if (!user.is_email_verified) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Email is not verified. Please complete registration first.' });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with reset code
    await user.update({
      reset_password_code: resetCode,
      reset_password_expires: expiresAt,
    }, { transaction });

    // Send reset email
    const emailResult = await sendVerificationEmail(email, resetCode, 'forgot_password');
    if (!emailResult.success) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Failed to send reset code email' });
    }

    await transaction.commit();

    res.status(200).json({
      message: 'Password reset code sent to your email',
      email: email,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error sending forgot password code:', error);
    res.status(500).json({ error: 'Failed to send reset code', details: error.message });
  }
};

// Verify forgot password code
export const verifyForgotPasswordCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and reset code are required' });
    }

    // Find user with reset code
    const user = await User.findOne({ 
      where: { 
        email,
        reset_password_code: code,
      } 
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    // Check if code is expired
    if (new Date() > user.reset_password_expires) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    res.status(200).json({
      message: 'Reset code verified successfully',
      email: email,
      canResetPassword: true,
    });
  } catch (error) {
    console.error('Error verifying forgot password code:', error);
    res.status(500).json({ error: 'Failed to verify reset code', details: error.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { email, code, password, confirmPassword } = req.body;

    if (!email || !code || !password || !confirmPassword) {
      await transaction.rollback();
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Find user with reset code
    const user = await User.findOne({ 
      where: { 
        email,
        reset_password_code: code,
      },
      transaction 
    });

    if (!user) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    // Check if code is expired
    if (new Date() > user.reset_password_expires) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset code
    await user.update({
      password: hashedPassword,
      reset_password_code: null,
      reset_password_expires: null,
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
};