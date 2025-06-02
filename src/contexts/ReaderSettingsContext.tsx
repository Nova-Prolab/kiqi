
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ReaderTheme, ReaderFontSize, ReaderFontFamily, ReaderSettings, ReaderLineHeight } from '@/lib/types';

interface ReaderSettingsContextType extends ReaderSettings {
  setTheme: (theme: ReaderTheme) => void;
  setFontSize: (fontSize: ReaderFontSize) => void;
  setLineHeight: (lineHeight: ReaderLineHeight) => void;
  setIsImmersive: (isImmersive: boolean) => void;
  setCustomBackground: (color: string) => void;
  setCustomForeground: (color: string) => void;
  setFontFamily: (font: ReaderFontFamily) => void;
  setCustomFontFamily: (fontName: string) => void;
  fontClass: string; // For font size
  themeClass: string; // For pre-defined themes
  lineHeightClass: string; // For line height
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

const LINE_HEIGHT_MAP: Record<ReaderLineHeight, string> = {
  'tight': 'leading-tight',   // 1.25
  'normal': 'leading-normal', // 1.5
  'relaxed': 'leading-relaxed', // 1.625
  'loose': 'leading-loose',   // 2
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


const DEFAULT_CUSTOM_BACKGROUND = '#212121'; // Darker default for custom if user switches to it
const DEFAULT_CUSTOM_FOREGROUND = '#E0E0E0'; // Lighter default for custom
const DEFAULT_FONT_FAMILY: ReaderFontFamily = 'system-sans'; // Changed
const DEFAULT_CUSTOM_FONT_FAMILY = 'Arial, sans-serif'; // Changed for sans-serif example
const DEFAULT_LINE_HEIGHT: ReaderLineHeight = 'normal';
const DEFAULT_THEME: ReaderTheme = 'dark'; // Changed


export const ReaderSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setThemeState] = useState<ReaderTheme>(DEFAULT_THEME);
  const [fontSize, setFontSizeState] = useState<ReaderFontSize>('base');
  const [lineHeight, setLineHeightState] = useState<ReaderLineHeight>(DEFAULT_LINE_HEIGHT);
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
      const storedLineHeight = localStorage.getItem('readerLineHeight') as ReaderLineHeight | null;
      const storedImmersive = localStorage.getItem('readerImmersive');
      const storedCustomBg = localStorage.getItem('customReaderBg');
      const storedCustomFg = localStorage.getItem('customReaderFg');
      const storedFontFamily = localStorage.getItem('readerFontFamily') as ReaderFontFamily | null;
      const storedCustomFont = localStorage.getItem('customReaderFont');

      if (storedTheme && (THEME_CLASS_MAP[storedTheme as Exclude<ReaderTheme, 'custom'>] || storedTheme === 'custom')) setThemeState(storedTheme);
      else setThemeState(DEFAULT_THEME);

      if (storedFontSize && FONT_SIZE_MAP[storedFontSize]) setFontSizeState(storedFontSize);
      if (storedLineHeight && LINE_HEIGHT_MAP[storedLineHeight]) setLineHeightState(storedLineHeight);
      if (storedImmersive) setIsImmersiveState(JSON.parse(storedImmersive) as boolean);
      
      if (storedCustomBg) setCustomBackgroundState(storedCustomBg);
      else setCustomBackgroundState(DEFAULT_CUSTOM_BACKGROUND);

      if (storedCustomFg) setCustomForegroundState(storedCustomFg);
      else setCustomForegroundState(DEFAULT_CUSTOM_FOREGROUND);

      if (storedFontFamily) setFontFamilyState(storedFontFamily);
      else setFontFamilyState(DEFAULT_FONT_FAMILY);
      
      if (storedCustomFont) setCustomFontFamilyState(storedCustomFont);
      else setCustomFontFamilyState(DEFAULT_CUSTOM_FONT_FAMILY);


    } catch (error) {
      console.warn("Could not access localStorage for reader settings:", error);
      // Set defaults if localStorage fails
      setThemeState(DEFAULT_THEME);
      setFontFamilyState(DEFAULT_FONT_FAMILY);
      setCustomBackgroundState(DEFAULT_CUSTOM_BACKGROUND);
      setCustomForegroundState(DEFAULT_CUSTOM_FOREGROUND);
      setCustomFontFamilyState(DEFAULT_CUSTOM_FONT_FAMILY);
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

  const setLineHeight = (newLineHeight: ReaderLineHeight) => {
    setLineHeightState(newLineHeight);
    if (isMounted) localStorage.setItem('readerLineHeight', newLineHeight);
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
  const themeClass = theme === 'custom' ? '' : (THEME_CLASS_MAP[theme as Exclude<ReaderTheme, 'custom'>] || THEME_CLASS_MAP[DEFAULT_THEME as Exclude<ReaderTheme, 'custom'>]);
  const lineHeightClass = LINE_HEIGHT_MAP[lineHeight] || LINE_HEIGHT_MAP['normal'];
  
  let currentReaderFontFamily: string;
  if (fontFamily === 'custom') {
    currentReaderFontFamily = customFontFamily || DEFAULT_CUSTOM_FONT_FAMILY;
  } else if (fontFamily === 'system-serif') {
    currentReaderFontFamily = 'serif';
  } else if (fontFamily === 'system-sans') {
    currentReaderFontFamily = 'sans-serif';
  } else {
    currentReaderFontFamily = FONT_FAMILY_CSS_MAP[fontFamily as Exclude<ReaderFontFamily, 'custom' | 'system-serif' | 'system-sans'>] || FONT_FAMILY_CSS_MAP[DEFAULT_FONT_FAMILY as Exclude<ReaderFontFamily, 'custom' | 'system-serif' | 'system-sans'>] || 'sans-serif';
  }
  const readerFontFamilyStyle: React.CSSProperties = { fontFamily: currentReaderFontFamily };


  const contextValue = {
    theme,
    fontSize,
    lineHeight,
    isImmersive,
    customBackground: customBackground || DEFAULT_CUSTOM_BACKGROUND,
    customForeground: customForeground || DEFAULT_CUSTOM_FOREGROUND,
    fontFamily,
    customFontFamily: customFontFamily || DEFAULT_CUSTOM_FONT_FAMILY,
    setTheme,
    setFontSize,
    setLineHeight,
    setIsImmersive,
    setCustomBackground,
    setCustomForeground,
    setFontFamily,
    setCustomFontFamily,
    fontClass,
    themeClass,
    lineHeightClass,
    readerFontFamilyStyle,
  };
  
  // Fallback for SSR or when not mounted yet
  if (!isMounted && typeof window !== 'undefined') {
     const initialFontFamilyStyle: React.CSSProperties = { fontFamily: (FONT_FAMILY_CSS_MAP[DEFAULT_FONT_FAMILY as Exclude<ReaderFontFamily, 'custom' | 'system-serif' | 'system-sans'>] || (DEFAULT_FONT_FAMILY === 'system-sans' ? 'sans-serif' : 'serif')) };
     const initialContextValue = {
        theme: DEFAULT_THEME,
        fontSize: 'base' as ReaderFontSize,
        lineHeight: DEFAULT_LINE_HEIGHT,
        isImmersive: false,
        customBackground: DEFAULT_CUSTOM_BACKGROUND,
        customForeground: DEFAULT_CUSTOM_FOREGROUND,
        fontFamily: DEFAULT_FONT_FAMILY,
        customFontFamily: DEFAULT_CUSTOM_FONT_FAMILY,
        setTheme: () => {},
        setFontSize: () => {},
        setLineHeight: () => {},
        setIsImmersive: () => {},
        setCustomBackground: () => {},
        setCustomForeground: () => {},
        setFontFamily: () => {},
        setCustomFontFamily: () => {},
        fontClass: FONT_SIZE_MAP['base'],
        themeClass: THEME_CLASS_MAP[DEFAULT_THEME as Exclude<ReaderTheme, 'custom'>],
        lineHeightClass: LINE_HEIGHT_MAP[DEFAULT_LINE_HEIGHT],
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

    
