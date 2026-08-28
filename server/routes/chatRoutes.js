import express from "express";
import { createChat, deleteChat, getChats } from "../controllers/chatController.js";
import { protect } from "../middlewares/auth.js";

const chatRouter = express.Router();

// POST is the correct verb for creating; GET kept for backwards compatibility.
chatRouter.post('/create', protect, createChat)
chatRouter.get('/create', protect, createChat)
chatRouter.get('/get', protect, getChats)
chatRouter.post('/delete', protect, deleteChat)

export default chatRouter
