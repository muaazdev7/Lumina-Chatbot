/**
 * Wraps an async route handler so a rejected promise reaches the central
 * error handler in server.js instead of being swallowed (2.4).
 *
 * Express 5 already forwards rejections, so this is partly belt-and-braces -
 * but it is explicit, and it survives a downgrade.
 *
 * NOT used for the Stripe webhook: its 200-vs-500 responses are a contract
 * with Stripe (200 = stop retrying, 500 = retry), so it keeps its own
 * try/catch and must never be routed through the generic handler.
 */
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next)

export default asyncHandler
