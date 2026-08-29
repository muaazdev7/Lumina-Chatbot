/**
 * Request body validation (2.1).
 *
 * Returns a SINGLE readable message rather than the whole zod issue array -
 * the client renders `message` as a string in a toast, so an array would
 * display as "[object Object]".
 *
 * On success the parsed result replaces req.body, so controllers receive
 * coerced and trimmed values.
 */
/**
 * zod's default message for a missing key is "Invalid input: expected string,
 * received undefined", which is not something to show a user. Turn that into
 * "<field> is required" and pass every other message through unchanged.
 */
const readableMessage = (issue) => {
    if (!issue) return 'Invalid request'

    const isMissing = issue.code === 'invalid_type' &&
        (issue.received === 'undefined' || /received undefined/.test(issue.message || ''))

    if (isMissing) {
        const field = issue.path?.[0]
        return field ? `${String(field)} is required` : 'A required field is missing'
    }

    return issue.message || 'Invalid request'
}

export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
        const issue = result.error.issues[0]
        return res.status(400).json({
            success: false,
            message: readableMessage(issue),
        })
    }

    req.body = result.data
    next()
}

export default validate
