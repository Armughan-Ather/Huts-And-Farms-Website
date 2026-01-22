import express from 'express';
import { 
  sendSignupVerification, 
  verifySignupCode, 
  login, 
  sendForgotPasswordCode, 
  verifyForgotPasswordCode, 
  resetPassword 
} from '../controllers/user.controller.js';

const router = express.Router();

// Signup flow
router.post('/signup/send-code', sendSignupVerification);
router.post('/signup/verify-code', verifySignupCode);

// Login
router.post('/login', login);

// Forgot password flow
router.post('/forgot-password/send-code', sendForgotPasswordCode);
router.post('/forgot-password/verify-code', verifyForgotPasswordCode);
router.post('/forgot-password/reset', resetPassword);

export default router;