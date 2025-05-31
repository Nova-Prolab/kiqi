
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types'; // Import User type

const AUTH_USER_STORAGE_KEY = 'literaryNexusCurrentUser';

// Store a subset of user info, or the full user object if needed
interface CurrentAuthUser extends Pick<User, 'id' | 'username'> {}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<CurrentAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser) as CurrentAuthUser);
      }
    } catch (error) {
      console.warn('Could not parse current user from localStorage:', error);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((user: CurrentAuthUser) => {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  return { currentUser, login, logout, isLoading };
}
