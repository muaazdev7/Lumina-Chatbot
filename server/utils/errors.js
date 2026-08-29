/**
 * Error handling helpers (2.3).
 *
 * Raw `error.message` can contain Mongoose internals, Stripe API detail or
 * connection strings. Those belong in the server log, never in a response.
 * Intentional product messages ("Chat not found", "Invalid plan", ...) are
 * unaffected - they are returned explicitly by the controllers, not thrown.
 */

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

export const isProduction = () => process.env.NODE_ENV === 'production'

/** Detailed in development, generic in production. */
export const clientErrorMessage = (error) => (
    isProduction() ? GENERIC_MESSAGE : (error?.message || GENERIC_MESSAGE)
)

/** Logs the real error server-side, prefixed with its origin. */
export const logError = (scope, error) => {
    console.error(`[${scope}]`, error?.message || error)
    if (!isProduction() && error?.stack) console.error(error.stack)
}

/** Convenience for a controller catch block: log, then respond safely. */
export const sendServerError = (res, scope, error) => {
    logError(scope, error)
    res.status(500).json({ success: false, message: clientErrorMessage(error) })
}
