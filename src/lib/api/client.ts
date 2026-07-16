export const EXPRESS_API_URL = 
  process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:4000/api/v1';

let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${EXPRESS_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().then((success) => {
      refreshPromise = null;
      return success;
    });
  }
  return refreshPromise;
}

// Base helper to fetch from Express REST server using HttpOnly Cookies
export async function fetchExpress(path: string, options: RequestInit = {}): Promise<any> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(`${EXPRESS_API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers
  });

  if (response.status === 401 && !path.startsWith('/auth/')) {
    // Attempt token refresh
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry original request with credentials
      const retryResponse = await fetch(`${EXPRESS_API_URL}${path}`, {
        credentials: 'include',
        ...options,
        headers
      });
      const retryData = await retryResponse.json();
      if (!retryResponse.ok) {
        throw new Error(retryData.error || 'Retry request failed.');
      }
      return retryData.data;
    } else {
      // Clear session & redirect to login on browser environments
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request to Express server failed.');
  }
  return data.data;
}

// Client authentication state wrapper
export async function getClientUser() {
  try {
    const profile = await fetchExpress('/users/me');
    return { id: profile.userId._id || profile.userId.id, email: profile.userId.email, username: profile.username };
  } catch {
    return null;
  }
}
