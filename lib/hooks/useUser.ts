"use client";

import { useState, useEffect, useRef } from 'react';

export interface User {
  id: string;
  email: string;
  name: string | null;
  displayId: string;
  role: 'buyer' | 'seller' | 'admin';
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if fetch is in progress and prevent duplicate calls
  const isFetchingRef = useRef(false);

  const fetchUser = async () => {
    // Guard: Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        // User not authenticated
        setUser(null);
      } else {
        setError('Eroare la încărcarea utilizatorului');
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching user:', error);
      setError('Eroare de conexiune');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for profile updates (only fetch once per event)
    const handleProfileUpdate = () => {
      if (!isFetchingRef.current) {
        fetchUser();
      }
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []); // Empty deps: only run on mount

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        setUser(null);
        // Use replace to avoid history entry and prevent middleware interception
        window.location.replace('/');
      } else {
        setError('Eroare la logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setError('Eroare de conexiune');
    }
  };

  return {
    user,
    loading,
    error,
    logout,
    refreshUser: fetchUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSeller: user?.role === 'seller' || user?.role === 'admin',
    isBuyer: user?.role === 'buyer',
  };
}
