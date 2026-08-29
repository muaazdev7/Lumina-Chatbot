import { z } from 'zod'

// 1.2 rules, now expressed declaratively.
export const MIN_PASSWORD_LENGTH = 8

export const registerSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
})

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().min(1, 'Email and password are required'),
    // No length rule here: it would lock out accounts created before the rule
    // existed, and leaks the policy to an attacker.
    password: z.string().min(1, 'Email and password are required'),
})
