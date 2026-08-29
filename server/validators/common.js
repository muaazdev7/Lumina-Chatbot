import mongoose from 'mongoose'
import { z } from 'zod'

/** Validates the FORMAT of an id. Ownership is checked in the controller. */
export const objectId = (message) =>
    z.string().refine(v => mongoose.Types.ObjectId.isValid(v), { message })
