/**
 * Centralized Structured Logging Utility
 * Emits JSON in production for log processors (e.g. Datadog, ELK)
 * and developer-friendly formatted console output in local development.
 */
export const logger = {
  info: (msg, meta = {}) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message: msg, ...meta }));
    } else {
      console.log(`[INFO] ${msg}`, Object.keys(meta).length ? meta : '');
    }
  },
  warn: (msg, meta = {}) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), message: msg, ...meta }));
    } else {
      console.warn(`[WARN] ${msg}`, Object.keys(meta).length ? meta : '');
    }
  },
  error: (msg, error, meta = {}) => {
    const errorData = error ? { error: error.message, stack: error.stack } : {};
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message: msg,
        ...errorData,
        ...meta
      }));
    } else {
      console.error(`[ERROR] ${msg}`, error || '', Object.keys(meta).length ? meta : '');
    }
  }
};
