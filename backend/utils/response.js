/**
 * Centralized API response utility
 * Do NOT monkey-patch Express Response
 * Maintain full backward compatibility by returning payloads directly,
 * and standardizing error structures consistently.
 */

/**
 * Sends a standardized success response.
 * Returns the data payload directly to ensure 100% backward compatibility with the frontend.
 */
export function sendSuccess(res, data, status = 200) {
  return res.status(status).json(data);
}

/**
 * Sends a standardized error response.
 */
export function sendError(res, error, message, code = 'BAD_REQUEST', status = 400) {
  return res.status(status).json({
    success: false,
    error: error || 'Bad Request',
    message: message || error || 'An error occurred',
    code
  });
}
