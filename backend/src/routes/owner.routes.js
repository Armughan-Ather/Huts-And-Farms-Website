import express from 'express';
import { addOwner, loginOwner, getOwnerProperties } from '../controllers/owner.controller.js';
import { authenticateOwner } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/add', addOwner);
router.post('/login', loginOwner);
router.get('/properties', authenticateOwner, getOwnerProperties);

export default router;