'use server'

import { cookies } from 'next/headers'

const EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:4000/api/v1';

async function copyResponseCookies(response: Response) {
  const cookieStore = await cookies();
  const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  
  if (setCookies.length === 0) {
    const rawHeader = response.headers.get('set-cookie');
    if (rawHeader) {
      setCookies.push(rawHeader);
    }
  }

  setCookies.forEach((cookieStr) => {
    const parts = cookieStr.split(';').map(p => p.trim());
    const [nameValue, ...attrs] = parts;
    const [name, value] = nameValue.split('=');
    
    const options: any = { path: '/' };
    attrs.forEach(attr => {
      const [k, v] = attr.split('=');
      const key = k.toLowerCase();
      if (key === 'path') options.path = v;
      else if (key === 'max-age') options.maxAge = parseInt(v, 10);
      else if (key === 'same-site') options.sameSite = v.toLowerCase() as any;
      else if (key === 'secure') options.secure = true;
      else if (key === 'httponly') options.httpOnly = true;
    });

    cookieStore.set(name, value, options);
  });
}

export async function loginAction(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    const response = await fetch(`${EXPRESS_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const resJson = await response.json();
    if (!response.ok) {
      return { error: resJson.error || 'Authentication failed.' }
    }

    await copyResponseCookies(response);

    return { success: true }
  } catch (err: any) {
    console.error('Login connection failure:', err)
    return { success: false, error: "Network connection failed. Please ensure your backend is running." }
  }
}

export async function signupAction(state: any, formData: FormData) {
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!username || !email || !password) {
    return { error: 'All fields are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  try {
    const response = await fetch(`${EXPRESS_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });

    const resJson = await response.json();
    if (!response.ok) {
      return { error: resJson.error || 'Signup failed.' }
    }

    await copyResponseCookies(response);

    return { success: true }
  } catch (err: any) {
    console.error('Signup connection failure:', err)
    return { error: 'Network connection failed. Please ensure your backend is running.' }
  }
}

export async function signOutAction() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('chatbuzz_token')?.value;

    await fetch(`${EXPRESS_API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    cookieStore.delete('chatbuzz_token')
    cookieStore.delete('chatbuzz_refresh_token')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Logout failed.' }
  }
}

export async function resetPasswordAction(state: any, formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  return { success: true }
}
