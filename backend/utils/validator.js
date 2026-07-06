import validator from 'validator';
import mongoose from 'mongoose';
import { sendError } from './response.js';

// Centralized schema validation rules
export const rules = {
  objectId: (val) => mongoose.Types.ObjectId.isValid(val),
  email: (val) => typeof val === 'string' && validator.isEmail(val),
  username: (val) => typeof val === 'string' && val.trim().length >= 3 && val.trim().length <= 30,
  password: (val) => typeof val === 'string' && val.length >= 6,
  string: (min = 0, max = 5000) => (val) => typeof val === 'string' && val.length >= min && val.length <= max,
  boolean: (val) => typeof val === 'boolean',
  enum: (allowedValues) => (val) => allowedValues.includes(val)
};

/**
 * Sanitizes input text by escaping HTML characters to prevent XSS.
 */
export function sanitizeString(val) {
  if (typeof val !== 'string') return val;
  return validator.escape(val.trim());
}

/**
 * Sanitizes a URL by ensuring it uses only http/https protocol to prevent javascript: injects.
 */
export function sanitizeUrl(val) {
  if (!val) return '';
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

/**
 * Centralized Express route validation middleware.
 * Validates req.body, req.params, or req.query against a schema.
 */
export function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    if (!data) {
      return sendError(res, 'Validation Error', 'Missing request data source', 'VALIDATION_ERROR', 400);
    }

    const errors = [];

    for (const [key, fieldRules] of Object.entries(schema)) {
      const val = data[key];

      // Check required
      if (fieldRules.required && (val === undefined || val === null || (typeof val === 'string' && val.trim() === ''))) {
        errors.push(`Field '${key}' is required`);
        continue;
      }

      // Check validation function
      if (val !== undefined && val !== null) {
        const isValid = fieldRules.validate(val);
        if (!isValid) {
          errors.push(`Field '${key}' has invalid format or value`);
        }
      }
    }

    if (errors.length > 0) {
      return sendError(res, 'Validation Error', errors.join('. '), 'VALIDATION_ERROR', 400);
    }

    next();
  };
}
