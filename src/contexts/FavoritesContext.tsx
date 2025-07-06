'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type FavoriteId = string;

interface FavoritesContextType {
  favoriteIds: FavoriteId[];
  addFavorite: (novelId: FavoriteId) => void;
  removeFavorite: (novelId: FavoriteId) => void;
  isFavorite: (novelId: FavoriteId) => boolean;
  isLoaded: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'kiqiFavorites';

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<FavoriteId[]>([]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        setFavoriteIds(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.warn('Could not load favorites:', error);
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveFavorites = useCallback((ids: FavoriteId[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Could not save favorites:', error);
    }
  }, []);

  const addFavorite = useCallback((novelId: FavoriteId) => {
    setFavoriteIds(prevIds => {
      const newIds = [...new Set([...prevIds, novelId])];
      saveFavorites(newIds);
      return newIds;
    });
  }, [saveFavorites]);

  const removeFavorite = useCallback((novelId: FavoriteId) => {
    setFavoriteIds(prevIds => {
      const newIds = prevIds.filter(id => id !== novelId);
      saveFavorites(newIds);
      return newIds;
    });
  }, [saveFavorites]);

  const isFavorite = useCallback((novelId: FavoriteId) => {
    return favoriteIds.includes(novelId);
  }, [favoriteIds]);

  const value = {
    favoriteIds,
    addFavorite,
    removeFavorite,
    isFavorite,
    isLoaded,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
