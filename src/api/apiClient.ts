import { config } from './config';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ConflictError,
  NotFoundError,
  DatabaseError
} from '@/lib/errors';


export const API_ENDPOINTS = {
  AUTH: {
    CSRF: '/auth/csrf',
    CALLBACK: '/auth/callback/credentials',
    REGISTER: '/auth/register',
    SIGNOUT: '/auth/signout',
    SESSION: '/auth/session'
  },
  USER: {
    ME: '/users/me'
  }
};

export interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

// Global flag to track if there's a refresh in progress (prevent multiple simultaneous refreshes)
let refreshPromise: Promise<any> | null = null;

export const setRefreshPromise = (promise: Promise<any> | null) => {
  refreshPromise = promise;
};

export const getRefreshPromise = () => {
  return refreshPromise;
};


/**
 * Parses response and throws specific ApiError types based on HTTP status & code
 */
async function parseResponse(response: Response): Promise<any> {
  if (response.status === 302 || response.status === 0) {
    const location = response.headers.get('location') || '';
    if (location.includes('error=') || location.includes('/signin')) {
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }
    return { success: true };
  }

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      throw new ApiError(
        response.status,
        'INVALID_JSON',
        'Failed to parse JSON response from server',
        { rawText: text }
      );
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'An error occurred';
    const code = data?.code || 'UNKNOWN_ERROR';
    const details = data?.details || null;

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message, code, details);
      case 403:
        throw new AuthorizationError(message, code, details);
      case 400:
        throw new ValidationError(message, code, details);
      case 409:
        throw new ConflictError(message, code, details);
      case 404:
        throw new NotFoundError(message, code, details);
      case 500:
        if (code === 'DATABASE_ERROR') {
          throw new DatabaseError(message, details);
        }
        throw new ApiError(response.status, code, message, details);
      default:
        throw new ApiError(response.status, code, message, details);
    }
  }

  return data;
}

/**
 * Fetch with automatic retries for transient status codes (429, 503, 504)
 */
async function fetchWithRetry(url: string, init: RequestInit, retries = 2, delay = 500): Promise<Response> {
  try {
    const res = await window.fetch(url, init);
    const retryableStatuses = [429, 503, 504];

    if (retryableStatuses.includes(res.status) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, init, retries - 1, delay * 2);
    }
    return res;
  } catch (err: any) {
    // Retry on network errors
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, init, retries - 1, delay * 2);
    }
    throw err;
  }
}

/**
 * Base request execution method
 */
async function request(path: string, options: RequestOptions = {}): Promise<any> {
  const isAuthRoute = path.includes('/auth/session') || 
                      path.includes('/auth/csrf') || 
                      path.includes('/auth/callback') || 
                      path.includes('/auth/register') ||
                      path.includes('/auth/signout');

  if (!isAuthRoute && refreshPromise) {
    try {
      await refreshPromise;
    } catch (e) {
      // Ignore initial token refresh failures to allow individual request to proceed and fail if needed
    }
  }

  const url = path.startsWith('http://') || path.startsWith('https://') 
    ? path 
    : `${config.apiUrl}${path}`;

  const headers = new Headers(options.headers || {});
  
  // Set default Accept and CSRF headers
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  }

  // Set Content-Type: application/json if body is provided and not FormData / URLSearchParams
  if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const init: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // include session cookies automatically
  };

  const response = await fetchWithRetry(url, init, options.retries ?? 2, options.retryDelay ?? 500);
  return parseResponse(response);
}

export const api = {
  get: (path: string, options?: RequestOptions) => 
    request(path, { ...options, method: 'GET' }),
  
  post: (path: string, body?: any, options?: RequestOptions) => 
    request(path, {
      ...options,
      method: 'POST',
      body: (body instanceof FormData || body instanceof URLSearchParams) ? body : JSON.stringify(body)
    }),
  
  patch: (path: string, body?: any, options?: RequestOptions) => 
    request(path, {
      ...options,
      method: 'PATCH',
      body: (body instanceof FormData || body instanceof URLSearchParams) ? body : JSON.stringify(body)
    }),

  
  delete: (path: string, options?: RequestOptions) => 
    request(path, { ...options, method: 'DELETE' })
};
