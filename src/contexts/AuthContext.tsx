import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';


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

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
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
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken: getClerkToken } = useClerkAuth();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (clerkUser) {
      // Create a mapped user that matches the old interface
      // Fetch our own profile from backend or use Clerk's for now
      const fetchProfileFromBackend = async () => {
        try {
          const token = await getClerkToken();
          const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            const p: Profile = {
              id: data._id, // Use MongoDB _id for encryption key consistency
              username: data.username,
              user_tag: data.user_tag,
              avatar_url: data.avatar_url,
              bio: data.bio
            };
            setProfile(p);

            setUser({
              id: data._id, // Use MongoDB _id for encryption key consistency
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              username: data.username,
              user_tag: data.user_tag,
              avatar_url: data.avatar_url,
              avatar: data.avatar_url,
              bio: data.bio,
              publicKey: data.publicKey
            });
          } else {
            // Backend /users/me returned non-OK: log details and fall back to Clerk user
            const resText = await res.text();
            console.error('/users/me returned non-OK', { status: res.status, body: resText, url: `${import.meta.env.VITE_API_URL}/users/me` });

            // Fallback to Clerk profile to avoid redirect loops while backend is unavailable
            // Note: Using Clerk ID here may cause encryption issues, but it's a fallback
            const fallbackProfile: Profile = {
              id: clerkUser.id, // Fallback to Clerk ID (encryption may not work)
              username: clerkUser.username || clerkUser.firstName || 'User',
              user_tag: '0000',
              avatar_url: clerkUser.imageUrl,
              bio: ''
            };
            setProfile(fallbackProfile);
            setUser({
              id: clerkUser.id, // Fallback to Clerk ID (encryption may not work)
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              username: fallbackProfile.username,
              user_tag: fallbackProfile.user_tag,
              avatar_url: fallbackProfile.avatar_url,
              avatar: fallbackProfile.avatar_url,
              bio: fallbackProfile.bio,
              publicKey: null
            });
            console.warn('/users/me returned non-OK; using Clerk fallback profile (encryption may not work)');
          }
        } catch (err) {
          console.error("Failed to fetch profile", err);
          // Fallback on throw as well
          // Note: Using Clerk ID here may cause encryption issues, but it's a fallback
          const p: Profile = {
            id: clerkUser.id, // Fallback to Clerk ID (encryption may not work)
            username: clerkUser.username || clerkUser.firstName || "User",
            user_tag: "0000",
            avatar_url: clerkUser.imageUrl,
            bio: ""
          };
          setProfile(p);
          setUser({
            id: clerkUser.id, // Fallback to Clerk ID (encryption may not work)
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            username: p.username,
            user_tag: p.user_tag,
            avatar_url: p.avatar_url,
            avatar: p.avatar_url,
            bio: p.bio
          });
        } finally {
          setLoading(false);
        }
      };

      fetchProfileFromBackend();
    } else {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, [clerkUser, isLoaded, getClerkToken]);

  // We are using Clerk's built-in components for login/register, so these can be empty or redirect
  const login = async () => {};
  const register = async () => {};

  const logout = async () => {
    await signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const token = await getClerkToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      
      const p: Profile = {
        id: data._id, // Use MongoDB _id for encryption key consistency
        username: data.username,
        user_tag: data.user_tag,
        avatar_url: data.avatar_url,
        bio: data.bio
      };
      setProfile(p);
      
      setUser({
        id: data._id, // Use MongoDB _id for encryption key consistency
        email: clerkUser!.primaryEmailAddress?.emailAddress || '',
        username: data.username,
        user_tag: data.user_tag,
        avatar_url: data.avatar_url,
        avatar: data.avatar_url,
        bio: data.bio
      });
    } catch (err) {
      console.error("Failed to update profile", err);
      throw err;
    }
  };

  const deleteAccount = async () => {
    // Need backend logic for this later
  };
  
  const getToken = async () => {
    return await getClerkToken();
  }

  return (
    <AuthContext.Provider value={{
      user,
      session: null,
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