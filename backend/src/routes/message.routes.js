import express from 'express';
import { deleteUserMessages, getUserMessageCount } from '../controllers/message.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Delete all messages for a user
router.post('/delete', authenticate, deleteUserMessages);

// Get message count for a user (for confirmation dialog)
router.get('/count/:user_id', authenticate, getUserMessageCount);

export default router;