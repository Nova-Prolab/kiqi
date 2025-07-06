'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Define the structure for theme colors (HSL strings without hsl())
interface CustomColors {
  primary?: string;
  background?: string;
  accent?: string;
  foreground?: string;
}

interface CustomCss {
    raw?: string;
}

// Define the structure for the context
interface CustomThemeContextType {
  colors: CustomColors;
  setColors: (newColors: Partial<CustomColors>) => void;
  rawCss: CustomCss;
  setRawCss: (newCss: Partial<CustomCss>) => void;
  resetCustomTheme: () => void;
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

const CUSTOM_THEME_STORAGE_KEY = 'kiqiCustomTheme';

const applyCustomColors = (colors: CustomColors) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const colorMap: Record<keyof CustomColors, string> = {
        primary: '--primary',
        background: '--background',
        accent: '--accent',
        foreground: '--foreground',
    };

    Object.entries(colors).forEach(([key, value]) => {
        const cssVar = colorMap[key as keyof CustomColors];
        if (cssVar && value) {
            root.style.setProperty(cssVar, value);
        }
    });
};

const removeCustomColors = () => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    ['--primary', '--background', '--accent', '--foreground'].forEach(prop => {
        root.style.removeProperty(prop);
    });
};

const applyRawCss = (css: CustomCss) => {
    if (typeof window === 'undefined') return;
    const styleElementId = 'custom-user-css';
    let styleElement = document.getElementById(styleElementId) as HTMLStyleElement | null;
    
    if (css.raw && css.raw.trim() !== '') {
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleElementId;
            document.head.appendChild(styleElement);
        }
        styleElement.innerHTML = css.raw;
    } else if (styleElement) {
        styleElement.remove();
    }
};

export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [colors, setColorsState] = useState<CustomColors>({});
  const [rawCss, setRawCssState] = useState<CustomCss>({});

  // Load settings from localStorage on mount and apply them
  useEffect(() => {
    setIsMounted(true);
    try {
      const storedSettings = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
      if (storedSettings) {
        const { colors: savedColors, rawCss: savedCss } = JSON.parse(storedSettings);
        if (savedColors) {
            setColorsState(savedColors);
            applyCustomColors(savedColors);
        }
        if (savedCss) {
            setRawCssState(savedCss);
            applyRawCss(savedCss);
        }
      }
    } catch (error) {
      console.warn('Could not load custom theme settings:', error);
    }
  }, []);
  
  const saveSettings = (settings: {colors: CustomColors, rawCss: CustomCss}) => {
    if (isMounted) {
        try {
            localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Could not save custom theme settings:', error);
        }
    }
  }

  const setColors = (newColors: Partial<CustomColors>) => {
    const updatedColors = { ...colors, ...newColors };
    setColorsState(updatedColors);
    applyCustomColors(updatedColors);
    saveSettings({ colors: updatedColors, rawCss });
  };

  const setRawCss = (newCss: Partial<CustomCss>) => {
    const updatedCss = { ...rawCss, ...newCss };
    setRawCssState(updatedCss);
    applyRawCss(updatedCss);
    saveSettings({ colors, rawCss: updatedCss });
  };
  
  const resetCustomTheme = useCallback(() => {
    setColorsState({});
    setRawCssState({});
    removeCustomColors();
    applyRawCss({}); // this will remove the style tag
    if (isMounted) {
       localStorage.removeItem(CUSTOM_THEME_STORAGE_KEY);
    }
  }, [isMounted]);

  const value = { colors, setColors, rawCss, setRawCss, resetCustomTheme };

  return (
    <CustomThemeContext.Provider value={value}>
      {children}
    </CustomThemeContext.Provider>
  );
};

export const useCustomTheme = () => {
  const context = useContext(CustomThemeContext);
  if (context === undefined) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');
  }
  return context;
};
