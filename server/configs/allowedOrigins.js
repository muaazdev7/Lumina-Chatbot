/**
 * Single source of truth for the frontend origins this API trusts.
 * Used by the CORS middleware and by Stripe Checkout redirect URLs, so an
 * attacker cannot supply an arbitrary `Origin` header and have the payment
 * flow redirect somewhere we do not control.
 */

const DEFAULT_ORIGIN = 'http://localhost:5173'

export const allowedOrigins = (process.env.CLIENT_URL || DEFAULT_ORIGIN)
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)

/** The canonical frontend origin, used when no trusted Origin header is present. */
export const primaryOrigin = allowedOrigins[0] || DEFAULT_ORIGIN

export const isAllowedOrigin = (origin) => (
    Boolean(origin) && allowedOrigins.includes(origin.replace(/\/+$/, ''))
)

/**
 * Returns the request's Origin only when it is on the allowlist, otherwise the
 * configured primary origin. Never returns caller-controlled input.
 */
export const resolveClientOrigin = (origin) => (
    isAllowedOrigin(origin) ? origin.replace(/\/+$/, '') : primaryOrigin
)
