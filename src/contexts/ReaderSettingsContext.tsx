
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ReaderTheme, ReaderFontSize, ReaderSettings } from '@/lib/types';

interface ReaderSettingsContextType extends ReaderSettings {
  setTheme: (theme: ReaderTheme) => void;
  setFontSize: (fontSize: ReaderFontSize) => void;
  setIsImmersive: (isImmersive: boolean) => void;
  setCustomBackground: (color: string) => void;
  setCustomForeground: (color: string) => void;
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

const THEME_CLASS_MAP: Record<Exclude<ReaderTheme, 'custom'>, string> = {
  'light': 'theme-light',
  'dark': 'theme-dark',
  'sepia': 'theme-sepia',
  'midnight': 'theme-midnight',
  'paper': 'theme-paper',
  'forest': 'theme-forest',
};

const DEFAULT_CUSTOM_BACKGROUND = '#FFFFFF';
const DEFAULT_CUSTOM_FOREGROUND = '#000000';

export const ReaderSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setThemeState] = useState<ReaderTheme>('light');
  const [fontSize, setFontSizeState] = useState<ReaderFontSize>('base');
  const [isImmersive, setIsImmersiveState] = useState<boolean>(false);
  const [customBackground, setCustomBackgroundState] = useState<string>(DEFAULT_CUSTOM_BACKGROUND);
  const [customForeground, setCustomForegroundState] = useState<string>(DEFAULT_CUSTOM_FOREGROUND);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedTheme = localStorage.getItem('readerTheme') as ReaderTheme | null;
      const storedFontSize = localStorage.getItem('readerFontSize') as ReaderFontSize | null;
      const storedImmersive = localStorage.getItem('readerImmersive');
      const storedCustomBg = localStorage.getItem('customReaderBg');
      const storedCustomFg = localStorage.getItem('customReaderFg');

      if (storedTheme && (THEME_CLASS_MAP[storedTheme as Exclude<ReaderTheme, 'custom'>] || storedTheme === 'custom')) setThemeState(storedTheme);
      if (storedFontSize && FONT_SIZE_MAP[storedFontSize]) setFontSizeState(storedFontSize);
      if (storedImmersive) setIsImmersiveState(JSON.parse(storedImmersive) as boolean);
      if (storedCustomBg) setCustomBackgroundState(storedCustomBg);
      if (storedCustomFg) setCustomForegroundState(storedCustomFg);

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

  const setCustomBackground = (color: string) => {
    setCustomBackgroundState(color);
    if (isMounted) {
      try {
        localStorage.setItem('customReaderBg', color);
      } catch (error) {
        console.warn("Could not save custom background to localStorage:", error);
      }
    }
  };

  const setCustomForeground = (color: string) => {
    setCustomForegroundState(color);
    if (isMounted) {
      try {
        localStorage.setItem('customReaderFg', color);
      } catch (error) {
        console.warn("Could not save custom foreground to localStorage:", error);
      }
    }
  };

  const fontClass = FONT_SIZE_MAP[fontSize] || FONT_SIZE_MAP['base'];
  const themeClass = theme === 'custom' ? '' : (THEME_CLASS_MAP[theme as Exclude<ReaderTheme, 'custom'>] || THEME_CLASS_MAP['light']);

  const contextValue = {
    theme,
    fontSize,
    isImmersive,
    customBackground: customBackground || DEFAULT_CUSTOM_BACKGROUND,
    customForeground: customForeground || DEFAULT_CUSTOM_FOREGROUND,
    setTheme,
    setFontSize,
    setIsImmersive,
    setCustomBackground,
    setCustomForeground,
    fontClass,
    themeClass,
  };
  
  if (!isMounted && typeof window !== 'undefined') {
     const initialContextValue = {
        theme: 'light' as ReaderTheme,
        fontSize: 'base' as ReaderFontSize,
        isImmersive: false,
        customBackground: DEFAULT_CUSTOM_BACKGROUND,
        customForeground: DEFAULT_CUSTOM_FOREGROUND,
        setTheme: () => {},
        setFontSize: () => {},
        setIsImmersive: () => {},
        setCustomBackground: () => {},
        setCustomForeground: () => {},
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
