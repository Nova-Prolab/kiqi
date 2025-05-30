
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ReaderTheme, ReaderFontSize, ReaderSettings } from '@/lib/types';

interface ReaderSettingsContextType extends ReaderSettings {
  setTheme: (theme: ReaderTheme) => void;
  setFontSize: (fontSize: ReaderFontSize) => void;
  setIsImmersive: (isImmersive: boolean) => void; // Added setter for immersive mode
  fontClass: string;
  themeClass: string;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType | undefined>(undefined);

const FONT_SIZE_MAP: Record<ReaderFontSize, string> = {
  'sm': 'text-sm',
  'base': 'text-base',
  'lg': 'text-lg',
  'xl': 'text-xl',
  '2xl': 'text-2xl',
};

const THEME_CLASS_MAP: Record<ReaderTheme, string> = {
  'light': 'theme-light',
  'dark': 'theme-dark',
  'sepia': 'theme-sepia',
};

export const ReaderSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setThemeState] = useState<ReaderTheme>('light');
  const [fontSize, setFontSizeState] = useState<ReaderFontSize>('base');
  const [isImmersive, setIsImmersiveState] = useState<boolean>(false); // State for immersive mode

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedTheme = localStorage.getItem('readerTheme') as ReaderTheme | null;
      const storedFontSize = localStorage.getItem('readerFontSize') as ReaderFontSize | null;
      const storedImmersive = localStorage.getItem('readerImmersive');

      if (storedTheme && THEME_CLASS_MAP[storedTheme]) setThemeState(storedTheme);
      if (storedFontSize && FONT_SIZE_MAP[storedFontSize]) setFontSizeState(storedFontSize);
      if (storedImmersive) setIsImmersiveState(JSON.parse(storedImmersive) as boolean);

    } catch (error) {
      console.warn("Could not access localStorage for reader settings:", error);
    }
  }, []);

  const setTheme = (newTheme: ReaderTheme) => {
    setThemeState(newTheme);
    if (isMounted) {
      try {
        localStorage.setItem('readerTheme', newTheme);
      } catch (error) {
        console.warn("Could not save reader theme to localStorage:", error);
      }
    }
  };

  const setFontSize = (newFontSize: ReaderFontSize) => {
    setFontSizeState(newFontSize);
    if (isMounted) {
      try {
        localStorage.setItem('readerFontSize', newFontSize);
      } catch (error) {
        console.warn("Could not save reader font size to localStorage:", error);
      }
    }
  };

  const setIsImmersive = (newIsImmersive: boolean) => {
    setIsImmersiveState(newIsImmersive);
    if (isMounted) {
      try {
        localStorage.setItem('readerImmersive', JSON.stringify(newIsImmersive));
      } catch (error) {
        console.warn("Could not save reader immersive mode to localStorage:", error);
      }
    }
  };

  const fontClass = FONT_SIZE_MAP[fontSize] || FONT_SIZE_MAP['base'];
  const themeClass = THEME_CLASS_MAP[theme] || THEME_CLASS_MAP['light'];

  const contextValue = {
    theme,
    fontSize,
    isImmersive, // Provide immersive state
    setTheme,
    setFontSize,
    setIsImmersive, // Provide setter for immersive state
    fontClass,
    themeClass,
  };
  
  if (!isMounted && typeof window !== 'undefined') {
     const initialContextValue = {
        theme: 'light' as ReaderTheme,
        fontSize: 'base' as ReaderFontSize,
        isImmersive: false,
        setTheme: () => {},
        setFontSize: () => {},
        setIsImmersive: () => {},
        fontClass: FONT_SIZE_MAP['base'],
        themeClass: THEME_CLASS_MAP['light'],
     }
     return <ReaderSettingsContext.Provider value={initialContextValue}>{children}</ReaderSettingsContext.Provider>;
  }

  return (
    <ReaderSettingsContext.Provider value={contextValue}>
      {children}
    </ReaderSettingsContext.Provider>
  );
};

export const useReaderSettings = () => {
  const context = useContext(ReaderSettingsContext);
  if (context === undefined) {
    throw new Error('useReaderSettings must be used within a ReaderSettingsProvider');
  }
  return context;
};
