import express from "express";
import { getPublishedImages, getUser, loginUser, registerUser } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimit.js";

const userRouter = express.Router();

userRouter.post('/register', authLimiter, registerUser)
userRouter.post('/login', authLimiter, loginUser)
userRouter.get('/data', protect, getUser)
userRouter.get('/published-images', getPublishedImages)

export default userRouter;