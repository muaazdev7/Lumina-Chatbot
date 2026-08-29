import express from "express";
import { getPlans, purchasePlan } from "../controllers/creditController.js";
import { protect } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { purchaseSchema } from "../validators/creditSchemas.js";

const creditRouter = express.Router()

creditRouter.get('/plan', getPlans)
creditRouter.post('/purchase', protect, validate(purchaseSchema), purchasePlan)

export default creditRouter