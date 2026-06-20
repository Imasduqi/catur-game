'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  rating_pvp: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isGuest: boolean;
  guestSessionId: string | null;
  loading: boolean;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUsername: (username: string) => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local guest status
    const savedGuest = localStorage.getItem('catur_guest_session');
    if (savedGuest) {
      setIsGuest(true);
      setGuestSessionId(localStorage.getItem('catur_guest_id'));
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        setIsGuest(false);
      } else {
        // If there's no session and they aren't marked as guest, loading ends
        if (!savedGuest) {
          setLoading(false);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        setIsGuest(false);
        setGuestSessionId(null);
        localStorage.removeItem('catur_guest_session');
        localStorage.removeItem('catur_guest_id');
      } else {
        setUser(null);
        setProfile(null);
        // Only end loading if not already in guest mode
        if (!localStorage.getItem('catur_guest_session')) {
          setIsGuest(false);
          setGuestSessionId(null);
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const loginAsGuest = () => {
    let guestId = localStorage.getItem('catur_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('catur_guest_id', guestId);
    }
    setGuestSessionId(guestId);
    setIsGuest(true);
    localStorage.setItem('catur_guest_session', 'true');
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem('catur_guest_session');
    localStorage.removeItem('catur_guest_id');
    setIsGuest(false);
    setGuestSessionId(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const updateUsername = async (username: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }
      setProfile((prev) => prev ? { ...prev, username } : null);
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isGuest,
        guestSessionId,
        loading,
        loginAsGuest,
        signOut: handleSignOut,
        refreshProfile,
        updateUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
