import express from "express";
import { getPublishedImages, getUser, loginUser, registerUser } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimit.js";
import { validate } from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../validators/userSchemas.js";

const userRouter = express.Router();

userRouter.post('/register', authLimiter, validate(registerSchema), registerUser)
userRouter.post('/login', authLimiter, validate(loginSchema), loginUser)
userRouter.get('/data', protect, getUser)
userRouter.get('/published-images', getPublishedImages)

export default userRouter;