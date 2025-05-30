
'use client';

import type { RecentChapterInfo, StoredRecentlyReadData } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

const MAX_RECENT_PER_NOVEL = 5; // Store up to 5 recent chapters per novel
const RECENTLY_READ_STORAGE_KEY = 'literaryNexusRecentlyRead';

export function useRecentlyRead() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getStoredData = useCallback((): StoredRecentlyReadData => {
    if (!isMounted) return {};
    try {
      const stored = localStorage.getItem(RECENTLY_READ_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Could not parse recently read chapters from localStorage:', error);
      // Attempt to clear corrupted data
      try {
        localStorage.removeItem(RECENTLY_READ_STORAGE_KEY);
      } catch (removeError) {
        console.error('Failed to remove corrupted recently read data:', removeError);
      }
      return {};
    }
  }, [isMounted]);

  const saveStoredData = useCallback((data: StoredRecentlyReadData) => {
    if (!isMounted) return;
    try {
      localStorage.setItem(RECENTLY_READ_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving recently read chapters to localStorage:', error);
    }
  }, [isMounted]);

  const addRecentlyReadChapter = useCallback(
    (chapterData: Omit<RecentChapterInfo, 'timestamp'>) => {
      if (!isMounted || !chapterData.novelId || !chapterData.id) return;

      const newRecentEntry: RecentChapterInfo = {
        ...chapterData,
        timestamp: Date.now(),
      };

      const allRecentData = getStoredData();
      const novelRecentList = allRecentData[chapterData.novelId] || [];

      // Remove the chapter if it already exists to move it to the top (most recent)
      const filteredList = novelRecentList.filter(c => c.id !== newRecentEntry.id);

      // Add the new entry to the beginning and trim the list
      const updatedNovelList = [newRecentEntry, ...filteredList].slice(0, MAX_RECENT_PER_NOVEL);

      saveStoredData({
        ...allRecentData,
        [chapterData.novelId]: updatedNovelList,
      });
    },
    [isMounted, getStoredData, saveStoredData]
  );

  const getRecentlyReadChaptersForNovel = useCallback(
    (novelId: string): RecentChapterInfo[] => {
      if (!isMounted || !novelId) return [];
      const allRecentData = getStoredData();
      // Already sorted by timestamp when adding, but good to ensure if ever needed.
      return (allRecentData[novelId] || []).sort((a, b) => b.timestamp - a.timestamp); 
    },
    [isMounted, getStoredData]
  );

  return { addRecentlyReadChapter, getRecentlyReadChaptersForNovel };
}
