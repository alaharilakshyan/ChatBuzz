import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

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
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email?: string) => {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.warn('Profile not found, building safe default on-the-fly:', error);
      const emailUsername = email ? email.split('@')[0] : 'user';
      const userTag = Math.floor(1000 + Math.random() * 9000).toString();
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: `${emailUsername}_${userTag}`,
          user_tag: userTag,
          status: 'online'
        })
        .select('*')
        .single();
      
      if (insertError) {
        console.error('Failed to auto-create missing user profile:', insertError);
        return null;
      }
      return newProfile;
    }
    return data;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email).then((profileData) => {
          if (profileData) {
            setProfile(profileData);
              setUser({
                id: session.user.id,
                email: session.user.email!,
                username: profileData.username,
                user_tag: profileData.user_tag,
                avatar_url: profileData.avatar_url,
                avatar: profileData.avatar_url,
                bio: profileData.bio,
              });
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id, session.user.email).then((profileData) => {
            if (profileData) {
              setProfile(profileData);
              setUser({
                id: session.user.id,
                email: session.user.email!,
                username: profileData.username,
                user_tag: profileData.user_tag,
                avatar_url: profileData.avatar_url,
                avatar: profileData.avatar_url,
                bio: profileData.bio,
              });
            }
          });
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profileData = await fetchProfile(data.user.id, data.user.email);
        if (profileData) {
          setProfile(profileData);
          setUser({
            id: data.user.id,
            email: data.user.email!,
            username: profileData.username,
            user_tag: profileData.user_tag,
            avatar_url: profileData.avatar_url,
            avatar: profileData.avatar_url,
            bio: profileData.bio,
          });
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data.user) {
        const profileData = await fetchProfile(data.user.id, data.user.email);
        if (profileData) {
          setProfile(profileData);
          setUser({
            id: data.user.id,
            email: data.user.email!,
            username: profileData.username,
            user_tag: profileData.user_tag,
            avatar_url: profileData.avatar_url,
            avatar: profileData.avatar_url,
            bio: profileData.bio,
          });
        }
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    const updatedProfile = { ...profile, ...updates } as Profile;
    setProfile(updatedProfile);
    setUser({
      ...user,
      ...updates,
    });
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('No user logged in');

    // Delete user profile and related data
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);
    
    if (error) throw error;

    await logout();
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};