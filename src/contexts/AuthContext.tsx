import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { generateKeyPair, exportPublicKey, exportPrivateKey } from '@/utils/crypto';

interface Profile {
  id: string;
  username: string;
  user_tag: string;
  avatar_url: string | null;
  bio: string | null;
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
              id: clerkUser.id,
              username: data.username,
              user_tag: data.user_tag,
              avatar_url: data.avatar_url,
              bio: data.bio
            };
            setProfile(p);
            
            setUser({
              id: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              username: data.username,
              user_tag: data.user_tag,
              avatar_url: data.avatar_url,
              avatar: data.avatar_url,
              bio: data.bio,
              publicKey: data.publicKey
            });

            // Key handling
            let privKey = localStorage.getItem('e2e_privKey');
            let pubKey = localStorage.getItem('e2e_pubKey');
            
            if (!privKey || !pubKey || !data.publicKey) {
               const keyPair = await generateKeyPair();
               pubKey = await exportPublicKey(keyPair.publicKey);
               privKey = await exportPrivateKey(keyPair.privateKey);
               
               localStorage.setItem('e2e_privKey', privKey);
               localStorage.setItem('e2e_pubKey', pubKey);
               
               // Update user on backend
               await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
                 method: 'PATCH',
                 headers: {
                   'Content-Type': 'application/json',
                   Authorization: `Bearer ${token}`
                 },
                 body: JSON.stringify({ publicKey: pubKey })
               });
            } else {
              // Fallback to clerkUser details if backend is down to prevent infinite redirect loop
              const p: Profile = {
                id: clerkUser.id,
                username: clerkUser.username || clerkUser.firstName || "User",
                user_tag: "0000",
                avatar_url: clerkUser.imageUrl,
                bio: ""
              };
              setProfile(p);
              setUser({
                id: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                username: p.username,
                user_tag: p.user_tag,
                avatar_url: p.avatar_url,
                avatar: p.avatar_url,
                bio: p.bio
              });
            }
          }
        } catch (err) {
          console.error("Failed to fetch profile", err);
          // Fallback on throw as well
          const p: Profile = {
            id: clerkUser.id,
            username: clerkUser.username || clerkUser.firstName || "User",
            user_tag: "0000",
            avatar_url: clerkUser.imageUrl,
            bio: ""
          };
          setProfile(p);
          setUser({
            id: clerkUser.id,
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
        id: clerkUser!.id,
        username: data.username,
        user_tag: data.user_tag,
        avatar_url: data.avatar_url,
        bio: data.bio
      };
      setProfile(p);
      
      setUser({
        id: clerkUser!.id,
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