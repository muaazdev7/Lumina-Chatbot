/**
 * Startup environment validation.
 *
 * NOTE ON ORDERING: this module validates at import time, on purpose.
 * `configs/openAi.js` and `configs/imageKit.js` construct their SDK clients at
 * module scope, so they throw during import when a key is missing. ES imports
 * are evaluated before the importing module's body runs, so a function called
 * from server.js would fire too late to pre-empt that. Importing this module
 * first in server.js means the readable message wins the race.
 */

const REQUIRED = [
    'MONGO_URI',
    'JWT_SECRET',
    'CLIENT_URL',
    'GEMINI_API_KEY',
    'IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_PRIVATE_KEY',
    'IMAGEKIT_URL_ENDPOINT',
]

// Billing is optional: warn rather than exit so the app still runs without it.
const BILLING = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']

/**
 * Returns { missing, missingBilling }. Never logs or returns values -
 * variable names only.
 */
export const checkEnv = (env = process.env) => ({
    missing: REQUIRED.filter(key => !env[key]),
    missingBilling: BILLING.filter(key => !env[key]),
})

export const validateEnv = () => {
    const { missing, missingBilling } = checkEnv()

    if (missingBilling.length) {
        console.warn(`Warning: billing disabled - missing ${missingBilling.join(', ')}`)
    }

    if (missing.length) {
        // Report every missing variable at once, not just the first.
        console.error('Missing required environment variables:')
        missing.forEach(key => console.error(`  - ${key}`))
        console.error('Copy server/.env.example to server/.env and fill these in.')
        process.exit(1)
    }
}

validateEnv()

export default validateEnv
