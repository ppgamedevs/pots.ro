"use client";

import { useState, useEffect } from 'react';

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

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
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
      console.error('Error fetching user:', error);
      setError('Eroare de conexiune');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchUser();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        setUser(null);
        window.location.href = '/autentificare';
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
