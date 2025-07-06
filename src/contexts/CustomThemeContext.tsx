'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Define the structure for theme colors (HSL strings without hsl())
export interface CustomColors {
  primary?: string;
  'primary-foreground'?: string;
  secondary?: string;
  'secondary-foreground'?: string;
  muted?: string;
  'muted-foreground'?: string;
  accent?: string;
  'accent-foreground'?: string;
  destructive?: string;
  'destructive-foreground'?: string;
  background?: string;
  foreground?: string;
  card?: string;
  'card-foreground'?: string;
  popover?: string;
  'popover-foreground'?: string;
  border?: string;
  input?: string;
  ring?: string;
}

interface CustomCss {
    raw?: string;
}

export interface CustomThemeData {
    version: 1;
    colors: CustomColors;
    rawCss: CustomCss;
}

// Define the structure for the context
interface CustomThemeContextType {
  colors: CustomColors;
  setColors: (newColors: Partial<CustomColors>, replace?: boolean) => void;
  rawCss: CustomCss;
  setRawCss: (newCss: Partial<CustomCss>) => void;
  resetCustomTheme: (options?: { colors?: boolean; css?: boolean }) => void;
  exportTheme: () => CustomThemeData;
  importTheme: (themeData: CustomThemeData) => void;
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

const CUSTOM_THEME_STORAGE_KEY = 'kiqiCustomTheme';

const ALL_COLOR_VARS: (keyof CustomColors)[] = [
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 
    'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'destructive-foreground',
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'border', 'input', 'ring'
];

const applyCustomColors = (colors: CustomColors) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    
    ALL_COLOR_VARS.forEach(key => {
        const cssVar = `--${key}`;
        const value = colors[key];
        if (value) {
            root.style.setProperty(cssVar, value);
        } else {
            root.style.removeProperty(cssVar);
        }
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
        const { colors: savedColors, rawCss: savedCss }: CustomThemeData = JSON.parse(storedSettings);
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
  
  const saveSettings = (settings: CustomThemeData) => {
    if (isMounted) {
        try {
            localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Could not save custom theme settings:', error);
        }
    }
  }

  const setColors = (newColors: Partial<CustomColors>, replace = false) => {
    const updatedColors = replace ? newColors : { ...colors, ...newColors };
    setColorsState(updatedColors);
    applyCustomColors(updatedColors);
    saveSettings({ version: 1, colors: updatedColors, rawCss });
  };

  const setRawCss = (newCss: Partial<CustomCss>) => {
    const updatedCss = { ...rawCss, ...newCss };
    setRawCssState(updatedCss);
    applyRawCss(updatedCss);
    saveSettings({ version: 1, colors, rawCss: updatedCss });
  };
  
  const resetCustomTheme = useCallback((options: { colors?: boolean; css?: boolean } = { colors: true, css: true }) => {
    const currentSettings = { colors, rawCss };
    let newColors = currentSettings.colors;
    let newCss = currentSettings.rawCss;

    if (options.colors) {
      newColors = {};
      setColorsState({});
      applyCustomColors({});
    }
    if (options.css) {
      newCss = {};
      setRawCssState({});
      applyRawCss({});
    }

    if (isMounted) {
        const fullState = { version: 1, colors: newColors, rawCss: newCss };
        if (Object.keys(newColors).length === 0 && Object.keys(newCss).length === 0) {
            localStorage.removeItem(CUSTOM_THEME_STORAGE_KEY);
        } else {
            saveSettings(fullState);
        }
    }
  }, [isMounted, colors, rawCss]);

  const exportTheme = useCallback((): CustomThemeData => {
    return {
      version: 1,
      colors,
      rawCss
    };
  }, [colors, rawCss]);

  const importTheme = useCallback((themeData: CustomThemeData) => {
    if (themeData.version !== 1) {
      console.error("Invalid theme version");
      return;
    }
    const newColors = themeData.colors || {};
    const newCss = themeData.rawCss || {};

    setColorsState(newColors);
    applyCustomColors(newColors);

    setRawCssState(newCss);
    applyRawCss(newCss);

    saveSettings({ version: 1, colors: newColors, rawCss: newCss });
  }, []);

  const value = { colors, setColors, rawCss, setRawCss, resetCustomTheme, exportTheme, importTheme };

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
