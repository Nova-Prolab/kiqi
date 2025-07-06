
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { AgeRating, NovelStatus } from '@/lib/types';

// The types of items that can be blocked.
export type BlockableItem = string;
export type BlockableCategory = 'blockedAuthors' | 'blockedTranslators' | 'blockedCategories' | 'blockedTags' | 'blockedAgeRatings' | 'blockedStatuses';

// The structure of the stored data.
export interface ContentFilterSettings {
  blockedAuthors: BlockableItem[];
  blockedTranslators: BlockableItem[];
  blockedCategories: BlockableItem[];
  blockedTags: BlockableItem[];
  blockedAgeRatings: AgeRating[];
  blockedStatuses: NovelStatus[];
}

// The context type.
interface ContentFilterContextType extends ContentFilterSettings {
  isLoaded: boolean;
  addBlockedItem: (category: BlockableCategory, item: BlockableItem) => void;
  removeBlockedItem: (category: BlockableCategory, item: BlockableItem) => void;
  clearAllBlocked: () => void;
}

const ContentFilterContext = createContext<ContentFilterContextType | undefined>(undefined);

const CONTENT_FILTER_STORAGE_KEY = 'kiqiContentFilters';

const defaultSettings: ContentFilterSettings = {
  blockedAuthors: [],
  blockedTranslators: [],
  blockedCategories: [],
  blockedTags: [],
  blockedAgeRatings: [],
  blockedStatuses: [],
};

export const ContentFilterProvider = ({ children }: { children: ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<ContentFilterSettings>(defaultSettings);

  // Load settings from localStorage on initial mount.
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(CONTENT_FILTER_STORAGE_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.warn('Could not load content filter settings:', error);
      localStorage.removeItem(CONTENT_FILTER_STORAGE_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change.
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CONTENT_FILTER_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Could not save content filter settings:', error);
      }
    }
  }, [settings, isLoaded]);

  const addBlockedItem = useCallback((category: BlockableCategory, item: BlockableItem) => {
    if (!item || item.trim() === '') return;
    const trimmedItem = item.trim();
    
    setSettings(prevSettings => {
      const listKey = category as keyof ContentFilterSettings;
      const list = prevSettings[listKey] as BlockableItem[];
      // Avoid duplicates, case-insensitive for text fields
      const isDuplicate = list.some(existingItem => existingItem.toLowerCase() === trimmedItem.toLowerCase());
      if (isDuplicate) return prevSettings;
      
      const updatedList = [...list, trimmedItem];
      return { ...prevSettings, [listKey]: updatedList };
    });
  }, []);

  const removeBlockedItem = useCallback((category: BlockableCategory, itemToRemove: BlockableItem) => {
    setSettings(prevSettings => {
      const listKey = category as keyof ContentFilterSettings;
      const list = prevSettings[listKey] as BlockableItem[];
      const updatedList = list.filter(item => item.toLowerCase() !== itemToRemove.toLowerCase());
      return { ...prevSettings, [listKey]: updatedList };
    });
  }, []);

  const clearAllBlocked = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = {
    ...settings,
    isLoaded,
    addBlockedItem,
    removeBlockedItem,
    clearAllBlocked,
  };

  return (
    <ContentFilterContext.Provider value={value}>
      {children}
    </ContentFilterContext.Provider>
  );
};

export const useContentFilter = () => {
  const context = useContext(ContentFilterContext);
  if (context === undefined) {
    throw new Error('useContentFilter must be used within a ContentFilterProvider');
  }
  return context;
};
