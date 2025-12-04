// src/routes/channelRoutes.js
import express from 'express';
import {
  getChannels,
  createChannel,
  getChannelById,
  joinChannel,
  leaveChannel,
} from '../controllers/channelController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // all routes below require auth

router.get('/', getChannels);          // GET /api/channels
router.post('/', createChannel);       // POST /api/channels
router.get('/:id', getChannelById);    // GET /api/channels/:id
router.post('/:id/join', joinChannel); // POST /api/channels/:id/join
router.post('/:id/leave', leaveChannel); // POST /api/channels/:id/leave

export default router;
