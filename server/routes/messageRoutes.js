import express from 'express';
import { protect } from '../middlewares/auth.js';
import { messageLimiter } from '../middlewares/rateLimit.js';
import { imageMessageController, textMessageController } from '../controllers/messageController.js';

const messageRouter = express.Router()

messageRouter.post('/text', protect, messageLimiter, textMessageController)
messageRouter.post('/image', protect, messageLimiter, imageMessageController)

export default messageRouter