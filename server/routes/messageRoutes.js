import express from 'express';
import { protect } from '../middlewares/auth.js';
import { messageLimiter } from '../middlewares/rateLimit.js';
import { validate } from '../middlewares/validate.js';
import { textMessageSchema, imageMessageSchema } from '../validators/messageSchemas.js';
import { imageMessageController, textMessageController } from '../controllers/messageController.js';

const messageRouter = express.Router()

messageRouter.post('/text', protect, messageLimiter, validate(textMessageSchema), textMessageController)
messageRouter.post('/image', protect, messageLimiter, validate(imageMessageSchema), imageMessageController)

export default messageRouter