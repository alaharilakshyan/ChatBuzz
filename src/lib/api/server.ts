import { cookies } from 'next/headers';

const EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:4000/api/v1';

export async function fetchServer(path: string, options: RequestInit = {}): Promise<any> {
  const cookieStore = await cookies();
  const token = cookieStore.get('chatbuzz_token')?.value;
  const refreshToken = cookieStore.get('chatbuzz_refresh_token')?.value;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let response = await fetch(`${EXPRESS_API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401 && !path.startsWith('/auth/') && refreshToken) {
    // Attempt token refresh on the backend
    try {
      const refreshResponse = await fetch(`${EXPRESS_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `chatbuzz_refresh_token=${refreshToken}`
        }
      });

      if (refreshResponse.ok) {
        // Parse and set new cookies in Next.js context
        const setCookies = refreshResponse.headers.getSetCookie ? refreshResponse.headers.getSetCookie() : [];
        let newAccessToken = '';
        
        try {
          setCookies.forEach((cookieStr) => {
            const parts = cookieStr.split(';').map(p => p.trim());
            const [nameValue, ...attrs] = parts;
            const [name, value] = nameValue.split('=');
            if (name === 'chatbuzz_token') newAccessToken = value;
            
            const opts: any = { path: '/' };
            attrs.forEach(attr => {
              const [k, v] = attr.split('=');
              const key = k.toLowerCase();
              if (key === 'path') opts.path = v;
              else if (key === 'max-age') opts.maxAge = parseInt(v, 10);
              else if (key === 'same-site') opts.sameSite = v.toLowerCase() as any;
              else if (key === 'secure') opts.secure = true;
              else if (key === 'httponly') opts.httpOnly = true;
            });
            cookieStore.set(name, value, opts);
          });
        } catch (cookieErr: any) {
          console.warn('⚠️ fetchServer: Cannot write cookies during Server Component render (this is normal and client requests will update them):', cookieErr.message);
        }

        // Retry the original request with the new access token
        const retryHeaders = {
          'Content-Type': 'application/json',
          ...(newAccessToken ? { Authorization: `Bearer ${newAccessToken}` } : {}),
          ...options.headers
        };

        response = await fetch(`${EXPRESS_API_URL}${path}`, {
          ...options,
          headers: retryHeaders
        });
      } else {
        // Clear expired cookies
        try {
          cookieStore.delete('chatbuzz_token');
          cookieStore.delete('chatbuzz_refresh_token');
        } catch (deleteErr: any) {
          console.warn('⚠️ fetchServer: Cannot delete cookies during Server Component render:', deleteErr.message);
        }
      }
    } catch (err) {
      console.error('Server action auto-refresh failure:', err);
    }
  }

  let data: any = {};
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch (jsonErr) {
    data = { error: text || 'An unexpected non-JSON response was returned from the server.' };
  }

  if (!response.ok) {
    throw new Error(data.error || 'Server fetch to Express failed.');
  }
  return data.data;
}

export async function getServerUser() {
  try {
    const profile = await fetchServer('/users/me');
    if (!profile) return null;
    return {
      id: profile.userId._id || profile.userId.id,
      email: profile.userId.email,
      username: profile.username,
      avatar_url: profile.avatarUrl || null,
      banner_url: profile.bannerUrl || null,
      bio: profile.description || null,
      user_tag: profile.userTag
    };
  } catch {
    return null;
  }
}
