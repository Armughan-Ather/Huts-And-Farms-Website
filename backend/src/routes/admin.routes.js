import express from 'express';
import { adminLogin, getBotBookings, updateBookingStatus, getDashboardStats } from '../controllers/admin.controller.js';
import { authenticateAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin login
router.post('/login', adminLogin);

// Protected admin routes
router.get('/bookings', authenticateAdmin, getBotBookings);
router.post('/bookings/update-status', authenticateAdmin, updateBookingStatus);
router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);

export default router;