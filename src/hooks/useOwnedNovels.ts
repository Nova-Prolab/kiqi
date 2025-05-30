
'use client';

import { useState, useEffect, useCallback } from 'react';

const OWNED_NOVELS_STORAGE_KEY = 'literaryNexusOwnedNovels';

function getStoredOwnedNovelIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = localStorage.getItem(OWNED_NOVELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Could not parse owned novel IDs from localStorage:', error);
    return [];
  }
}

function saveStoredOwnedNovelIds(ids: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(OWNED_NOVELS_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving owned novel IDs to localStorage:', error);
  }
}

export function useOwnedNovels() {
  const [ownedNovelIds, setOwnedNovelIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setOwnedNovelIds(getStoredOwnedNovelIds());
  }, []);

  const addOwnedNovel = useCallback((novelId: string) => {
    if (!isMounted || !novelId) return;
    setOwnedNovelIds((prevIds) => {
      if (prevIds.includes(novelId)) {
        return prevIds;
      }
      const newIds = [...prevIds, novelId];
      saveStoredOwnedNovelIds(newIds);
      return newIds;
    });
  }, [isMounted]);

  const removeOwnedNovel = useCallback((novelId: string) => {
    if (!isMounted || !novelId) return;
    setOwnedNovelIds((prevIds) => {
      const newIds = prevIds.filter(id => id !== novelId);
      saveStoredOwnedNovelIds(newIds);
      return newIds;
    });
  }, [isMounted]);

  const isNovelOwned = useCallback((novelId: string): boolean => {
    if (!isMounted) return false; // Default to not owned if not mounted to prevent hydration issues
    return ownedNovelIds.includes(novelId);
  }, [isMounted, ownedNovelIds]);

  return { addOwnedNovel, removeOwnedNovel, isNovelOwned, getOwnedNovelIds: () => ownedNovelIds, isMounted };
}
