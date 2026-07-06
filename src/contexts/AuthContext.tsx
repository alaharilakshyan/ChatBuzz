import React, { createContext, useContext, useState, useEffect } from 'react';

// Intercept window.fetch to automatically include credentials (cookies) for our backend API
const VITE_API_URL = import.meta.env.VITE_API_URL || '/api';
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
  if (urlStr.startsWith(VITE_API_URL) || urlStr.includes('/api/')) {
    init = init || {};
    init.credentials = 'include';
    
    // Inject custom header to prevent CSRF
    init.headers = init.headers || {};
    if (init.headers instanceof Headers) {
      init.headers.set('X-Requested-With', 'XMLHttpRequest');
    } else if (Array.isArray(init.headers)) {
      const hasHeader = init.headers.some(h => h[0].toLowerCase() === 'x-requested-with');
      if (!hasHeader) {
        init.headers.push(['X-Requested-With', 'XMLHttpRequest']);
      }
    } else {
      init.headers['X-Requested-With'] = 'XMLHttpRequest';
    }
  }
  return originalFetch.apply(this, [input, init]);
};

interface Profile {
  id: string;
  username: string;
  user_tag: string;
  avatar_url: string | null;
  bio: string | null;
  preferences?: {
    onlineStatusVisible: boolean;
    readReceiptsEnabled: boolean;
    typingIndicatorsEnabled: boolean;
    messageNotificationsEnabled: boolean;
    soundEnabled: boolean;
  };
}

interface AuthUser {
  id: string;
  email: string;
  username: string;
  user_tag: string;
  avatar_url: string | null;
  avatar: string | null;
  bio: string | null;
  publicKey?: string | null;
  preferences?: {
    onlineStatusVisible: boolean;
    readReceiptsEnabled: boolean;
    typingIndicatorsEnabled: boolean;
    messageNotificationsEnabled: boolean;
    soundEnabled: boolean;
  };
}

interface AuthSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  const fetchProfile = async () => {
    try {
      const sessionRes = await window.fetch(`${VITE_API_URL}/auth/session`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!sessionRes.ok) throw new Error('Failed to fetch Auth.js session');
      
      const sessionText = await sessionRes.text();
      let sessionData;
      try {
        sessionData = JSON.parse(sessionText);
      } catch (err) {
        console.error('Failed to parse session as JSON. Response text:', sessionText);
        throw err;
      }

      if (!sessionData || !sessionData.user) {
        setUser(null);
        setProfile(null);
        setSession(null);
        return;
      }

      setSession(sessionData);

      // Fetch profile from our backend /users/me using the cookie session
      const meRes = await window.fetch(`${VITE_API_URL}/users/me`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (meRes.ok) {
        const meText = await meRes.text();
        let data;
        try {
          data = JSON.parse(meText);
        } catch (err) {
          console.error('Failed to parse /users/me as JSON. Response text:', meText);
          throw err;
        }

        const p: Profile = {
          id: data._id,
          username: data.username,
          user_tag: data.user_tag,
          avatar_url: data.avatar_url,
          bio: data.bio,
          preferences: data.preferences
        };
        setProfile(p);
        setUser({
          id: data._id,
          email: data.email,
          username: data.username,
          user_tag: data.user_tag,
          avatar_url: data.avatar_url,
          avatar: data.avatar_url,
          bio: data.bio,
          publicKey: data.publicKey,
          preferences: data.preferences
        });
      } else {
        console.warn('/users/me returned non-OK status:', meRes.status);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // 1. Fetch CSRF token
      const csrfRes = await window.fetch(`${VITE_API_URL}/auth/csrf`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!csrfRes.ok) throw new Error('Failed to fetch CSRF token');
      
      const csrfText = await csrfRes.text();
      let csrfData;
      try {
        csrfData = JSON.parse(csrfText);
      } catch (err) {
        console.error('Failed to parse CSRF as JSON. Response text:', csrfText);
        throw err;
      }
      const { csrfToken } = csrfData;

      // 2. Submit credentials
      const loginRes = await window.fetch(`${VITE_API_URL}/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          email,
          password,
          csrfToken,
          redirect: 'false',
          json: 'true'
        })
      });

      if (!loginRes.ok) {
        throw new Error('Invalid email or password');
      }

      const loginText = await loginRes.text();
      let responseData;
      try {
        responseData = JSON.parse(loginText);
      } catch (err) {
        console.error('Failed to parse login response as JSON. Response text:', loginText);
        throw err;
      }

      if (responseData.url && responseData.url.includes('error=')) {
        throw new Error('Invalid credentials');
      }

      await fetchProfile();
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await window.fetch(`${VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      if (!res.ok) {
        const errText = await res.text();
        let data;
        try {
          data = JSON.parse(errText);
        } catch (err) {
          console.error('Failed to parse registration error as JSON. Response text:', errText);
          throw err;
        }
        throw new Error(data.error || 'Registration failed');
      }

      // Automatically log in after registration
      await login(email, password);
    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const csrfRes = await window.fetch(`${VITE_API_URL}/auth/csrf`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!csrfRes.ok) throw new Error('Failed to fetch CSRF token for signout');
      
      const csrfText = await csrfRes.text();
      let csrfToken;
      try {
        const csrfData = JSON.parse(csrfText);
        csrfToken = csrfData.csrfToken;
      } catch (err) {
        console.error('Failed to parse signout CSRF as JSON. Response text:', csrfText);
        throw err;
      }

      await window.fetch(`${VITE_API_URL}/auth/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          csrfToken,
          redirect: 'false',
          json: 'true'
        })
      });

      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const res = await window.fetch(`${VITE_API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      
      const p: Profile = {
        id: data._id,
        username: data.username,
        user_tag: data.user_tag,
        avatar_url: data.avatar_url,
        bio: data.bio,
        preferences: data.preferences
      };
      setProfile(p);
      
      setUser({
        id: data._id,
        email: data.email,
        username: data.username,
        user_tag: data.user_tag,
        avatar_url: data.avatar_url,
        avatar: data.avatar_url,
        bio: data.bio,
        publicKey: data.publicKey,
        preferences: data.preferences
      });
    } catch (err) {
      console.error("Failed to update profile", err);
      throw err;
    }
  };

  const deleteAccount = async () => {
    // Implement delete logic if needed
  };

  // Retain dummy getToken for backward-compatibility with other fetch headers
  const getToken = async () => {
    return 'session-auth';
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      login,
      register,
      logout,
      loading,
      updateProfile,
      deleteAccount,
      getToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};