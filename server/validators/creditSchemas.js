import { z } from 'zod'

// Only planId is accepted. price / credits / amount are NEVER taken from the
// client - the server derives them from its own `plans` array.
export const purchaseSchema = z.object({
    planId: z.string().trim().min(1, 'A planId is required'),
})
