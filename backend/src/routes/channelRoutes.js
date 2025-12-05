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

router.use(protect); 

router.get('/', getChannels);          
router.post('/', createChannel);       
router.get('/:id', getChannelById);    
router.post('/:id/join', joinChannel); 
router.post('/:id/leave', leaveChannel); 

export default router;
