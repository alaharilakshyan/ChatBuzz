import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { setRefreshPromise } from '@/api/apiClient';

export interface Profile {
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

export interface AuthUser {
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

export interface AuthSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
    user_tag?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    publicKey?: string | null;
    preferences?: any;
  };
}

export interface AuthContextType {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Track if a refresh request is already pending to avoid multiple identical requests (Token Refresh Guard)
let activeRefreshPromise: Promise<void> | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  const refreshSession = async () => {
    if (activeRefreshPromise) {
      return activeRefreshPromise;
    }

    activeRefreshPromise = (async () => {
      try {
        const sessionData = await authService.getSession();
        
        if (!sessionData || !sessionData.user) {
          setUser(null);
          setProfile(null);
          setSession(null);
          return;
        }

        setSession(sessionData);

        // OPTIMIZATION: If the session payload already contains user profile details,
        // we can populate everything in a single request. If not, fallback to calling me.
        const sUser = sessionData.user;
        if (sUser.username && sUser.user_tag) {
          const p: Profile = {
            id: sUser.id,
            username: sUser.username,
            user_tag: sUser.user_tag,
            avatar_url: sUser.avatar_url || null,
            bio: sUser.bio || null,
            preferences: sUser.preferences
          };
          setProfile(p);
          setUser({
            id: sUser.id,
            email: sUser.email || '',
            username: sUser.username,
            user_tag: sUser.user_tag,
            avatar_url: sUser.avatar_url || null,
            avatar: sUser.avatar_url || null,
            bio: sUser.bio || null,
            publicKey: sUser.publicKey || null,
            preferences: sUser.preferences
          });
        } else {
          // Fallback to fetch profile via API
          const data = await userService.getProfile();
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
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
        setUser(null);
        setProfile(null);
        setSession(null);
      } finally {
        activeRefreshPromise = null;
        setRefreshPromise(null);
      }
    })();

    setRefreshPromise(activeRefreshPromise);
    return activeRefreshPromise;
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshSession();
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.login(email, password);
      await refreshSession();
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      await authService.register(username, email, password);
      // Register does NOT auto-login, caller handles redirecting to login page.
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
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
      const data = await userService.updateProfile(updates);
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
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const deleteAccount = async () => {
    // Optional account deletion placeholder
  };

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

export { useAuth } from '@/hooks/useAuth';