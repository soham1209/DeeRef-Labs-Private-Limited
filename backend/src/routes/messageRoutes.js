// src/routes/messageRoutes.js
import express from 'express';
import { getChannelMessages, createMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect); 

router.get('/', getChannelMessages);
router.post('/', createMessage);

export default router;
