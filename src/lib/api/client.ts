import { createBrowserClient } from '@/utils/supabase/client';

export type BackendProvider = 'supabase' | 'express';

export const BACKEND_PROVIDER: BackendProvider = 
  (process.env.NEXT_PUBLIC_BACKEND_PROVIDER as BackendProvider) || 'supabase';

export const EXPRESS_API_URL = 
  process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:4000/api/v1';

// Base helper to fetch from Express REST server
export async function fetchExpress(path: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('chatbuzz_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${EXPRESS_API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request to Express server failed.');
  }
  return data.data;
}

// Client authentication state wrapper
export async function getClientUser() {
  if (BACKEND_PROVIDER === 'supabase') {
    const supabase = createBrowserClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return { id: user.id, email: user.email };
  } else {
    try {
      const profile = await fetchExpress('/users/me');
      return { id: profile.userId._id, email: profile.userId.email, username: profile.username };
    } catch {
      return null;
    }
  }
}
