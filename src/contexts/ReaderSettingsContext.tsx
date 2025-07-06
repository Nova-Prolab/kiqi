
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { 
  ReaderTheme, 
  ReaderFontSize, 
  ReaderFontFamily, 
  ReaderSettings, 
  ReaderLineHeight,
  ReaderLetterSpacing,
  ReaderTextAlign,
  ReaderTextWidth,
  ReaderParagraphSpacing
} from '@/lib/types';
import { 
  Type, Columns, Palette, RefreshCcw, Sun, Moon, Coffee, MoonStar, FileTextIcon as PaperIcon, Trees, Paintbrush, 
  CaseSensitive, Text, AlignLeft, AlignJustify, ALargeSmall, Pilcrow, ArrowLeftRight, Baseline, Settings2 
} from 'lucide-react';


interface ReaderSettingsContextType extends ReaderSettings {
  setTheme: (theme: ReaderTheme) => void;
  setFontSize: (fontSize: ReaderFontSize) => void;
  setLineHeight: (lineHeight: ReaderLineHeight) => void;
  setIsImmersive: (isImmersive: boolean) => void;
  setCustomBackground: (color: string) => void;
  setCustomForeground: (color: string) => void;
  setFontFamily: (font: ReaderFontFamily) => void;
  setCustomFontFamily: (fontName: string) => void;
  setLetterSpacing: (spacing: ReaderLetterSpacing) => void;
  setTextAlign: (align: ReaderTextAlign) => void;
  setTextWidth: (width: ReaderTextWidth) => void;
  setParagraphSpacing: (spacing: ReaderParagraphSpacing) => void;
  resetSettings: () => void;

  fontClass: string;
  themeClass: string;
  lineHeightClass: string;
  letterSpacingClass: string;
  textAlignClass: string;
  textWidthClass: string;
  paragraphSpacingClass: string;
  readerFontFamilyStyle: React.CSSProperties;
  combinedReaderClasses: string;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType | undefined>(undefined);

// --- MAPPINGS ---
export const FONT_SIZE_MAP: Record<ReaderFontSize, string> = { 'sm': 'text-sm', 'base': 'text-base', 'lg': 'text-lg', 'xl': 'text-xl', '2xl': 'text-2xl' };
export const LINE_HEIGHT_MAP: Record<ReaderLineHeight, string> = { 'tight': 'leading-tight', 'normal': 'leading-normal', 'relaxed': 'leading-relaxed', 'loose': 'leading-loose' };
export const THEME_CLASS_MAP: Record<Exclude<ReaderTheme, 'custom'>, string> = { 'light': 'theme-light', 'dark': 'theme-dark', 'sepia': 'theme-sepia', 'midnight': 'theme-midnight', 'paper': 'theme-paper', 'forest': 'theme-forest' };
export const FONT_FAMILY_CSS_MAP: Record<Exclude<ReaderFontFamily, 'custom' | 'system-serif' | 'system-sans'>, string> = { 'lora': 'var(--font-lora)', 'merriweather': 'var(--font-merriweather)', 'noto-serif': 'var(--font-noto-serif)', 'pt-serif': 'var(--font-pt-serif)', 'eb-garamond': 'var(--font-eb-garamond)', 'vollkorn': 'var(--font-vollkorn)', 'bitter': 'var(--font-bitter)', 'open-sans': 'var(--font-open-sans)', 'lato': 'var(--font-lato)', 'roboto': 'var(--font-roboto)', 'source-sans-3': 'var(--font-source-sans-3)', 'inter': 'var(--font-inter)', 'arimo': 'var(--font-arimo)', 'tinos': 'var(--font-tinos)', 'cousine': 'var(--font-cousine)' };
export const LETTER_SPACING_MAP: Record<ReaderLetterSpacing, string> = { 'normal': 'tracking-normal', 'wide': 'tracking-wide', 'wider': 'tracking-wider' };
export const TEXT_ALIGN_MAP: Record<ReaderTextAlign, string> = { 'left': 'text-left', 'justify': 'text-justify' };
export const TEXT_WIDTH_MAP: Record<ReaderTextWidth, string> = { 'narrow': 'max-w-2xl', 'medium': 'max-w-4xl', 'wide': 'max-w-6xl' };
export const PARAGRAPH_SPACING_MAP: Record<ReaderParagraphSpacing, string> = { 'default': 'paragraph-spacing-default', 'medium': 'paragraph-spacing-medium', 'large': 'paragraph-spacing-large' };

// --- DEFAULTS (Exported for reset functionality and UI) ---
export const DEFAULT_THEME: ReaderTheme = 'dark';
export const DEFAULT_FONT_SIZE: ReaderFontSize = 'base';
export const DEFAULT_LINE_HEIGHT: ReaderLineHeight = 'normal';
export const DEFAULT_FONT_FAMILY: ReaderFontFamily = 'system-sans';
export const DEFAULT_CUSTOM_FONT_FAMILY = 'Arial, sans-serif';
export const DEFAULT_CUSTOM_BACKGROUND = '#121212'; // Darker for "dark" theme base
export const DEFAULT_CUSTOM_FOREGROUND = '#E0E0E0'; // Lighter grey for "dark" theme base
export const DEFAULT_LETTER_SPACING: ReaderLetterSpacing = 'normal';
export const DEFAULT_TEXT_ALIGN: ReaderTextAlign = 'left';
export const DEFAULT_TEXT_WIDTH: ReaderTextWidth = 'medium';
export const DEFAULT_PARAGRAPH_SPACING: ReaderParagraphSpacing = 'default';

// --- OPTIONS FOR UI (Exported for ReaderSettingsSheet) ---
export const FONT_SIZES_OPTIONS: { label: string, value: ReaderFontSize, icon: React.ElementType }[] = [
  { label: 'Pequeño', value: 'sm', icon: ALargeSmall }, { label: 'Normal', value: 'base', icon: ALargeSmall }, { label: 'Grande', value: 'lg', icon: ALargeSmall },
  { label: 'Muy Grande', value: 'xl', icon: ALargeSmall }, { label: 'Extra Grande', value: '2xl', icon: ALargeSmall },
];
export const LINE_HEIGHTS_OPTIONS: { label: string, value: ReaderLineHeight, icon: React.ElementType }[] = [
  { label: 'Estrecho', value: 'tight', icon: Baseline }, { label: 'Normal', value: 'normal', icon: Baseline },
  { label: 'Relajado', value: 'relaxed', icon: Baseline }, { label: 'Amplio', value: 'loose', icon: Baseline },
];
export const THEMES_OPTIONS: { label: string, value: ReaderTheme, icon: React.ElementType }[] = [
  { label: 'Claro', value: 'light', icon: Sun }, { label: 'Sepia', value: 'sepia', icon: Coffee }, { label: 'Oscuro', value: 'dark', icon: Moon }, 
  { label: 'Medianoche', value: 'midnight', icon: MoonStar }, { label: 'Papel', value: 'paper', icon: PaperIcon }, { label: 'Bosque', value: 'forest', icon: Trees },
  { label: 'Personalizado', value: 'custom', icon: Paintbrush },
];
export const FONT_FAMILIES_OPTIONS: { label: string, value: ReaderFontFamily, style?: React.CSSProperties, icon: React.ElementType }[] = [
  { label: 'Sans-serif (Sistema)', value: 'system-sans', style: { fontFamily: 'sans-serif'}, icon: Type },
  { label: 'Serif (Sistema)', value: 'system-serif', style: { fontFamily: 'serif'}, icon: Text },
  { label: 'Lora', value: 'lora', style: { fontFamily: 'var(--font-lora)'}, icon: Text },
  { label: 'Merriweather', value: 'merriweather', style: { fontFamily: 'var(--font-merriweather)'}, icon: Text },
  { label: 'Noto Serif', value: 'noto-serif', style: { fontFamily: 'var(--font-noto-serif)'}, icon: Text },
  { label: 'PT Serif', value: 'pt-serif', style: { fontFamily: 'var(--font-pt-serif)'}, icon: Text },
  { label: 'EB Garamond', value: 'eb-garamond', style: { fontFamily: 'var(--font-eb-garamond)'}, icon: Text },
  { label: 'Vollkorn', value: 'vollkorn', style: { fontFamily: 'var(--font-vollkorn)'}, icon: Text },
  { label: 'Bitter', value: 'bitter', style: { fontFamily: 'var(--font-bitter)'}, icon: Text },
  { label: 'Open Sans', value: 'open-sans', style: { fontFamily: 'var(--font-open-sans)'}, icon: Type },
  { label: 'Lato', value: 'lato', style: { fontFamily: 'var(--font-lato)'}, icon: Type },
  { label: 'Roboto', value: 'roboto', style: { fontFamily: 'var(--font-roboto)'}, icon: Type },
  { label: 'Source Sans 3', value: 'source-sans-3', style: { fontFamily: 'var(--font-source-sans-3)'}, icon: Type },
  { label: 'Inter', value: 'inter', style: { fontFamily: 'var(--font-inter)'}, icon: Type },
  { label: 'Arimo', value: 'arimo', style: { fontFamily: 'var(--font-arimo)'}, icon: Type },
  { label: 'Tinos', value: 'tinos', style: { fontFamily: 'var(--font-tinos)'}, icon: Text },
  { label: 'Cousine (Mono)', value: 'cousine', style: { fontFamily: 'var(--font-cousine)'}, icon: CaseSensitive },
  { label: 'Personalizada', value: 'custom', icon: CaseSensitive },
];
export const LETTER_SPACINGS_OPTIONS: { label: string, value: ReaderLetterSpacing, icon: React.ElementType }[] = [
  { label: 'Normal', value: 'normal', icon: ArrowLeftRight }, { label: 'Ancho', value: 'wide', icon: ArrowLeftRight }, { label: 'Más Ancho', value: 'wider', icon: ArrowLeftRight },
];
export const TEXT_ALIGNS_OPTIONS: { label: string, value: ReaderTextAlign, icon: React.ElementType }[] = [
  { label: 'Izquierda', value: 'left', icon: AlignLeft }, { label: 'Justificado', value: 'justify', icon: AlignJustify },
];
export const TEXT_WIDTHS_OPTIONS: { label: string, value: ReaderTextWidth, icon: React.ElementType }[] = [
  { label: 'Estrecho', value: 'narrow', icon: Columns }, { label: 'Medio', value: 'medium', icon: Columns }, { label: 'Ancho', value: 'wide', icon: Columns },
];
export const PARAGRAPH_SPACINGS_OPTIONS: { label: string, value: ReaderParagraphSpacing, icon: React.ElementType }[] = [
  { label: 'Predeterminado', value: 'default', icon: Pilcrow }, { label: 'Medio', value: 'medium', icon: Pilcrow }, { label: 'Amplio', value: 'large', icon: Pilcrow },
];


export const ReaderSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  const [theme, setThemeState] = useState<ReaderTheme>(DEFAULT_THEME);
  const [fontSize, setFontSizeState] = useState<ReaderFontSize>(DEFAULT_FONT_SIZE);
  const [lineHeight, setLineHeightState] = useState<ReaderLineHeight>(DEFAULT_LINE_HEIGHT);
  const [fontFamily, setFontFamilyState] = useState<ReaderFontFamily>(DEFAULT_FONT_FAMILY);
  const [customFontFamily, setCustomFontFamilyState] = useState<string>(DEFAULT_CUSTOM_FONT_FAMILY);
  const [isImmersive, setIsImmersiveState] = useState<boolean>(false);
  const [customBackground, setCustomBackgroundState] = useState<string>(DEFAULT_CUSTOM_BACKGROUND);
  const [customForeground, setCustomForegroundState] = useState<string>(DEFAULT_CUSTOM_FOREGROUND);
  const [letterSpacing, setLetterSpacingState] = useState<ReaderLetterSpacing>(DEFAULT_LETTER_SPACING);
  const [textAlign, setTextAlignState] = useState<ReaderTextAlign>(DEFAULT_TEXT_ALIGN);
  const [textWidth, setTextWidthState] = useState<ReaderTextWidth>(DEFAULT_TEXT_WIDTH);
  const [paragraphSpacing, setParagraphSpacingState] = useState<ReaderParagraphSpacing>(DEFAULT_PARAGRAPH_SPACING);

  useEffect(() => {
    setIsMounted(true);
    try {
      const settingsToLoad: Array<keyof ReaderSettings> = [
        'theme', 'fontSize', 'lineHeight', 'fontFamily', 'customFontFamily', 
        'isImmersive', 'customBackground', 'customForeground', 
        'letterSpacing', 'textAlign', 'textWidth', 'paragraphSpacing'
      ];
      const loadedSettings: Partial<ReaderSettings> = {};

      settingsToLoad.forEach(key => {
        const item = localStorage.getItem(`reader${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (item !== null) {
          if (key === 'isImmersive') {
            (loadedSettings as any)[key] = JSON.parse(item);
          } else {
            (loadedSettings as any)[key] = item;
          }
        }
      });
      
      setThemeState((loadedSettings.theme as ReaderTheme) || DEFAULT_THEME);
      setFontSizeState((loadedSettings.fontSize as ReaderFontSize) || DEFAULT_FONT_SIZE);
      setLineHeightState((loadedSettings.lineHeight as ReaderLineHeight) || DEFAULT_LINE_HEIGHT);
      setFontFamilyState((loadedSettings.fontFamily as ReaderFontFamily) || DEFAULT_FONT_FAMILY);
      setCustomFontFamilyState(loadedSettings.customFontFamily || DEFAULT_CUSTOM_FONT_FAMILY);
      setIsImmersiveState(loadedSettings.isImmersive === undefined ? false : loadedSettings.isImmersive);
      setCustomBackgroundState(loadedSettings.customBackground || DEFAULT_CUSTOM_BACKGROUND);
      setCustomForegroundState(loadedSettings.customForeground || DEFAULT_CUSTOM_FOREGROUND);
      setLetterSpacingState((loadedSettings.letterSpacing as ReaderLetterSpacing) || DEFAULT_LETTER_SPACING);
      setTextAlignState((loadedSettings.textAlign as ReaderTextAlign) || DEFAULT_TEXT_ALIGN);
      setTextWidthState((loadedSettings.textWidth as ReaderTextWidth) || DEFAULT_TEXT_WIDTH);
      setParagraphSpacingState((loadedSettings.paragraphSpacing as ReaderParagraphSpacing) || DEFAULT_PARAGRAPH_SPACING);

    } catch (error) {
      console.warn("Could not access localStorage for reader settings:", error);
      setThemeState(DEFAULT_THEME);
      setFontSizeState(DEFAULT_FONT_SIZE);
      setLineHeightState(DEFAULT_LINE_HEIGHT);
      setFontFamilyState(DEFAULT_FONT_FAMILY);
      setCustomFontFamilyState(DEFAULT_CUSTOM_FONT_FAMILY);
      setIsImmersiveState(false);
      setCustomBackgroundState(DEFAULT_CUSTOM_BACKGROUND);
      setCustomForegroundState(DEFAULT_CUSTOM_FOREGROUND);
      setLetterSpacingState(DEFAULT_LETTER_SPACING);
      setTextAlignState(DEFAULT_TEXT_ALIGN);
      setTextWidthState(DEFAULT_TEXT_WIDTH);
      setParagraphSpacingState(DEFAULT_PARAGRAPH_SPACING);
    }
  }, []);

  const createSetter = <T extends keyof ReaderSettings>(
    key: T, 
    setStateFunc: React.Dispatch<React.SetStateAction<ReaderSettings[T]>>
  ) => {
    return (newValue: ReaderSettings[T]) => {
      setStateFunc(newValue);
      if (isMounted) {
        const storageKey = `reader${key.charAt(0).toUpperCase() + key.slice(1)}`;
        localStorage.setItem(storageKey, typeof newValue === 'boolean' ? JSON.stringify(newValue) : String(newValue));
      }
    };
  };

  const setTheme = createSetter('theme', setThemeState);
  const setFontSize = createSetter('fontSize', setFontSizeState);
  const setLineHeight = createSetter('lineHeight', setLineHeightState);
  const setFontFamily = createSetter('fontFamily', setFontFamilyState);
  const setCustomFontFamily = createSetter('customFontFamily', setCustomFontFamilyState);
  const setIsImmersive = createSetter('isImmersive', setIsImmersiveState);
  const setCustomBackground = createSetter('customBackground', setCustomBackgroundState);
  const setCustomForeground = createSetter('customForeground', setCustomForegroundState);
  const setLetterSpacing = createSetter('letterSpacing', setLetterSpacingState);
  const setTextAlign = createSetter('textAlign', setTextAlignState);
  const setTextWidth = createSetter('textWidth', setTextWidthState);
  const setParagraphSpacing = createSetter('paragraphSpacing', setParagraphSpacingState);
  
  const resetSettings = useCallback(() => {
    setTheme(DEFAULT_THEME);
    setFontSize(DEFAULT_FONT_SIZE);
    setLineHeight(DEFAULT_LINE_HEIGHT);
    setFontFamily(DEFAULT_FONT_FAMILY);
    setCustomFontFamily(DEFAULT_CUSTOM_FONT_FAMILY);
    setIsImmersive(false); 
    setCustomBackground(DEFAULT_CUSTOM_BACKGROUND);
    setCustomForeground(DEFAULT_CUSTOM_FOREGROUND);
    setLetterSpacing(DEFAULT_LETTER_SPACING);
    setTextAlign(DEFAULT_TEXT_ALIGN);
    setTextWidth(DEFAULT_TEXT_WIDTH);
    setParagraphSpacing(DEFAULT_PARAGRAPH_SPACING);
  }, [isMounted, setTheme, setFontSize, setLineHeight, setFontFamily, setCustomFontFamily, setIsImmersive, setCustomBackground, setCustomForeground, setLetterSpacing, setTextAlign, setTextWidth, setParagraphSpacing]);


  const fontClass = FONT_SIZE_MAP[fontSize] || FONT_SIZE_MAP[DEFAULT_FONT_SIZE];
  const themeClass = theme === 'custom' ? '' : (THEME_CLASS_MAP[theme as Exclude<ReaderTheme, 'custom'>] || THEME_CLASS_MAP[DEFAULT_THEME as Exclude<ReaderTheme, 'custom'>]);
  const lineHeightClass = LINE_HEIGHT_MAP[lineHeight] || LINE_HEIGHT_MAP[DEFAULT_LINE_HEIGHT];
  const letterSpacingClass = LETTER_SPACING_MAP[letterSpacing] || LETTER_SPACING_MAP[DEFAULT_LETTER_SPACING];
  const textAlignClass = TEXT_ALIGN_MAP[textAlign] || TEXT_ALIGN_MAP[DEFAULT_TEXT_ALIGN];
  const textWidthClass = TEXT_WIDTH_MAP[textWidth] || TEXT_WIDTH_MAP[DEFAULT_TEXT_WIDTH];
  const paragraphSpacingClass = PARAGRAPH_SPACING_MAP[paragraphSpacing] || PARAGRAPH_SPACING_MAP[DEFAULT_PARAGRAPH_SPACING];
  
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

  const combinedReaderClasses = `${fontClass} ${lineHeightClass} ${letterSpacingClass} ${textAlignClass} ${paragraphSpacingClass}`;

  const contextValue: ReaderSettingsContextType = {
    theme, fontSize, lineHeight, fontFamily, customFontFamily, isImmersive, customBackground, customForeground,
    letterSpacing, textAlign, textWidth, paragraphSpacing,
    setTheme, setFontSize, setLineHeight, setFontFamily, setCustomFontFamily, setIsImmersive, setCustomBackground, setCustomForeground,
    setLetterSpacing, setTextAlign, setTextWidth, setParagraphSpacing,
    resetSettings,
    fontClass, themeClass, lineHeightClass, letterSpacingClass, textAlignClass, textWidthClass, paragraphSpacingClass,
    readerFontFamilyStyle, combinedReaderClasses
  };
  
  if (!isMounted && typeof window !== 'undefined') {
     const initialFontFamilyStyle: React.CSSProperties = { fontFamily: (FONT_FAMILY_CSS_MAP[DEFAULT_FONT_FAMILY as Exclude<ReaderFontFamily, 'custom' | 'system-serif' | 'system-sans'>] || (DEFAULT_FONT_FAMILY === 'system-sans' ? 'sans-serif' : 'serif')) };
     const initialContextValue = {
        theme: DEFAULT_THEME,
        fontSize: DEFAULT_FONT_SIZE,
        lineHeight: DEFAULT_LINE_HEIGHT,
        fontFamily: DEFAULT_FONT_FAMILY,
        customFontFamily: DEFAULT_CUSTOM_FONT_FAMILY,
        isImmersive: false,
        customBackground: DEFAULT_CUSTOM_BACKGROUND,
        customForeground: DEFAULT_CUSTOM_FOREGROUND,
        letterSpacing: DEFAULT_LETTER_SPACING,
        textAlign: DEFAULT_TEXT_ALIGN,
        textWidth: DEFAULT_TEXT_WIDTH,
        paragraphSpacing: DEFAULT_PARAGRAPH_SPACING,
        setTheme: () => {}, setFontSize: () => {}, setLineHeight: () => {}, setFontFamily: () => {}, setCustomFontFamily: () => {}, setIsImmersive: () => {}, setCustomBackground: () => {}, setCustomForeground: () => {},
        setLetterSpacing: () => {}, setTextAlign: () => {}, setTextWidth: () => {}, setParagraphSpacing: () => {},
        resetSettings: () => {},
        fontClass: FONT_SIZE_MAP[DEFAULT_FONT_SIZE],
        themeClass: THEME_CLASS_MAP[DEFAULT_THEME as Exclude<ReaderTheme, 'custom'>],
        lineHeightClass: LINE_HEIGHT_MAP[DEFAULT_LINE_HEIGHT],
        letterSpacingClass: LETTER_SPACING_MAP[DEFAULT_LETTER_SPACING],
        textAlignClass: TEXT_ALIGN_MAP[DEFAULT_TEXT_ALIGN],
        textWidthClass: TEXT_WIDTH_MAP[DEFAULT_TEXT_WIDTH],
        paragraphSpacingClass: PARAGRAPH_SPACING_MAP[DEFAULT_PARAGRAPH_SPACING],
        readerFontFamilyStyle: initialFontFamilyStyle,
        combinedReaderClasses: `${FONT_SIZE_MAP[DEFAULT_FONT_SIZE]} ${LINE_HEIGHT_MAP[DEFAULT_LINE_HEIGHT]} ${LETTER_SPACING_MAP[DEFAULT_LETTER_SPACING]} ${TEXT_ALIGN_MAP[DEFAULT_TEXT_ALIGN]} ${PARAGRAPH_SPACING_MAP[DEFAULT_PARAGRAPH_SPACING]}`,
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
