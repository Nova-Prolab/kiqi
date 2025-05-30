
'use client';

import { useState, useEffect, useCallback } from 'react';

const AUTH_USER_STORAGE_KEY = 'literaryNexusCurrentUser';

interface CurrentUser {
  username: string;
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until localStorage is checked

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.warn('Could not parse current user from localStorage:', error);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY); // Clear corrupted data
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((username: string) => {
    const user: CurrentUser = { username };
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  return { currentUser, login, logout, isLoading };
}
