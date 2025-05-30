
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ReaderTheme, ReaderFontSize, ReaderFontFamily, ReaderSettings } from '@/lib/types';

interface ReaderSettingsContextType extends ReaderSettings {
  setTheme: (theme: ReaderTheme) => void;
  setFontSize: (fontSize: ReaderFontSize) => void;
  setIsImmersive: (isImmersive: boolean) => void;
  setCustomBackground: (color: string) => void;
  setCustomForeground: (color: string) => void;
  setFontFamily: (font: ReaderFontFamily) => void;
  setCustomFontFamily: (fontName: string) => void;
  fontClass: string; // For font size
  themeClass: string; // For pre-defined themes
  readerFontFamilyStyle: React.CSSProperties; // For applying font family
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

const FONT_FAMILY_CSS_MAP: Record<Exclude<ReaderFontFamily, 'custom' | 'system-serif' | 'system-sans'>, string> = {
  'lora': 'var(--font-lora)',
  'merriweather': 'var(--font-merriweather)',
  'noto-serif': 'var(--font-noto-serif)',
  'pt-serif': 'var(--font-pt-serif)',
  'eb-garamond': 'var(--font-eb-garamond)',
  'vollkorn': 'var(--font-vollkorn)',
  'bitter': 'var(--font-bitter)',
  'open-sans': 'var(--font-open-sans)',
  'lato': 'var(--font-lato)',
  'roboto': 'var(--font-roboto)',
  'source-sans-pro': 'var(--font-source-sans-pro)',
  'inter': 'var(--font-inter)',
};


const DEFAULT_CUSTOM_BACKGROUND = '#FFFFFF';
const DEFAULT_CUSTOM_FOREGROUND = '#000000';
const DEFAULT_FONT_FAMILY: ReaderFontFamily = 'lora';
const DEFAULT_CUSTOM_FONT_FAMILY = 'Georgia, serif';


export const ReaderSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setThemeState] = useState<ReaderTheme>('light');
  const [fontSize, setFontSizeState] = useState<ReaderFontSize>('base');
  const [isImmersive, setIsImmersiveState] = useState<boolean>(false);
  const [customBackground, setCustomBackgroundState] = useState<string>(DEFAULT_CUSTOM_BACKGROUND);
  const [customForeground, setCustomForegroundState] = useState<string>(DEFAULT_CUSTOM_FOREGROUND);
  const [fontFamily, setFontFamilyState] = useState<ReaderFontFamily>(DEFAULT_FONT_FAMILY);
  const [customFontFamily, setCustomFontFamilyState] = useState<string>(DEFAULT_CUSTOM_FONT_FAMILY);


  useEffect(() => {
    setIsMounted(true);
    try {
      const storedTheme = localStorage.getItem('readerTheme') as ReaderTheme | null;
      const storedFontSize = localStorage.getItem('readerFontSize') as ReaderFontSize | null;
      const storedImmersive = localStorage.getItem('readerImmersive');
      const storedCustomBg = localStorage.getItem('customReaderBg');
      const storedCustomFg = localStorage.getItem('customReaderFg');
      const storedFontFamily = localStorage.getItem('readerFontFamily') as ReaderFontFamily | null;
      const storedCustomFont = localStorage.getItem('customReaderFont');

      if (storedTheme && (THEME_CLASS_MAP[storedTheme as Exclude<ReaderTheme, 'custom'>] || storedTheme === 'custom')) setThemeState(storedTheme);
      if (storedFontSize && FONT_SIZE_MAP[storedFontSize]) setFontSizeState(storedFontSize);
      if (storedImmersive) setIsImmersiveState(JSON.parse(storedImmersive) as boolean);
      if (storedCustomBg) setCustomBackgroundState(storedCustomBg);
      if (storedCustomFg) setCustomForegroundState(storedCustomFg);
      if (storedFontFamily) setFontFamilyState(storedFontFamily);
      if (storedCustomFont) setCustomFontFamilyState(storedCustomFont);

    } catch (error) {
      console.warn("Could not access localStorage for reader settings:", error);
    }
  }, []);

  const setTheme = (newTheme: ReaderTheme) => {
    setThemeState(newTheme);
    if (isMounted) localStorage.setItem('readerTheme', newTheme);
  };

  const setFontSize = (newFontSize: ReaderFontSize) => {
    setFontSizeState(newFontSize);
    if (isMounted) localStorage.setItem('readerFontSize', newFontSize);
  };

  const setIsImmersive = (newIsImmersive: boolean) => {
    setIsImmersiveState(newIsImmersive);
    if (isMounted) localStorage.setItem('readerImmersive', JSON.stringify(newIsImmersive));
  };

  const setCustomBackground = (color: string) => {
    setCustomBackgroundState(color);
    if (isMounted) localStorage.setItem('customReaderBg', color);
  };

  const setCustomForeground = (color: string) => {
    setCustomForegroundState(color);
    if (isMounted) localStorage.setItem('customReaderFg', color);
  };

  const setFontFamily = (newFontFamily: ReaderFontFamily) => {
    setFontFamilyState(newFontFamily);
    if (isMounted) localStorage.setItem('readerFontFamily', newFontFamily);
  };

  const setCustomFontFamily = (newCustomFont: string) => {
    setCustomFontFamilyState(newCustomFont);
    if (isMounted) localStorage.setItem('customReaderFont', newCustomFont);
  };


  const fontClass = FONT_SIZE_MAP[fontSize] || FONT_SIZE_MAP['base'];
  const themeClass = theme === 'custom' ? '' : (THEME_CLASS_MAP[theme as Exclude<ReaderTheme, 'custom'>] || THEME_CLASS_MAP['light']);
  
  let currentReaderFontFamily: string;
  if (fontFamily === 'custom') {
    currentReaderFontFamily = customFontFamily || DEFAULT_CUSTOM_FONT_FAMILY;
  } else if (fontFamily === 'system-serif') {
    currentReaderFontFamily = 'serif';
  } else if (fontFamily === 'system-sans') {
    currentReaderFontFamily = 'sans-serif';
  } else {
    currentReaderFontFamily = FONT_FAMILY_CSS_MAP[fontFamily as Exclude<ReaderFontFamily, 'custom' | 'system-serif' | 'system-sans'>] || FONT_FAMILY_CSS_MAP['lora'];
  }
  const readerFontFamilyStyle: React.CSSProperties = { fontFamily: currentReaderFontFamily };


  const contextValue = {
    theme,
    fontSize,
    isImmersive,
    customBackground: customBackground || DEFAULT_CUSTOM_BACKGROUND,
    customForeground: customForeground || DEFAULT_CUSTOM_FOREGROUND,
    fontFamily,
    customFontFamily: customFontFamily || DEFAULT_CUSTOM_FONT_FAMILY,
    setTheme,
    setFontSize,
    setIsImmersive,
    setCustomBackground,
    setCustomForeground,
    setFontFamily,
    setCustomFontFamily,
    fontClass,
    themeClass,
    readerFontFamilyStyle,
  };
  
  // Fallback for SSR or when not mounted yet
  if (!isMounted && typeof window !== 'undefined') {
     const initialFontFamilyStyle: React.CSSProperties = { fontFamily: FONT_FAMILY_CSS_MAP[DEFAULT_FONT_FAMILY] || 'serif' };
     const initialContextValue = {
        theme: 'light' as ReaderTheme,
        fontSize: 'base' as ReaderFontSize,
        isImmersive: false,
        customBackground: DEFAULT_CUSTOM_BACKGROUND,
        customForeground: DEFAULT_CUSTOM_FOREGROUND,
        fontFamily: DEFAULT_FONT_FAMILY,
        customFontFamily: DEFAULT_CUSTOM_FONT_FAMILY,
        setTheme: () => {},
        setFontSize: () => {},
        setIsImmersive: () => {},
        setCustomBackground: () => {},
        setCustomForeground: () => {},
        setFontFamily: () => {},
        setCustomFontFamily: () => {},
        fontClass: FONT_SIZE_MAP['base'],
        themeClass: THEME_CLASS_MAP['light'],
        readerFontFamilyStyle: initialFontFamilyStyle,
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

    