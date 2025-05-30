
'use client';

import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import type { ReaderTheme, ReaderFontSize, ReaderFontFamily } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { 
  Settings2, 
  TextQuote, 
  Minimize, 
  Maximize, 
  Sun, 
  Moon, 
  Coffee, 
  Languages, 
  BookText, 
  Palette, 
  FileTextIcon, 
  Trees, 
  MoonStar, 
  Paintbrush, 
  BookOpen,
  Type, // Icon for Font selection
  CaseSensitive // Icon for custom font input
} from 'lucide-react';
import React, { useState, useEffect, ChangeEvent } from 'react';
import ChapterSummaryDialog from './ChapterSummaryDialog';
import AudioPlayer from './AudioPlayer';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TranslateChapterInput } from '@/ai/flows/translate-chapter-flow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TARGET_LANGUAGES: {label: string, value: TranslateChapterInput['targetLanguage']}[] = [
  { label: "English", value: "English" },
  { label: "Português", value: "Portuguese" },
  { label: "Français", value: "French" },
  { label: "Italiano", value: "Italian" },
];

interface ReaderControlsProps {
  chapterHtmlContent: string;
  onToggleImmersive: () => void;
  isImmersive: boolean;
  novelId: string;
  onTranslateRequest: (language: TranslateChapterInput['targetLanguage']) => void;
  forceTranslationMenuOpen?: boolean;
  isTranslationApplied: boolean;
  onRevertToOriginal: () => void;
  isVisibleInImmersiveMode: boolean;
  onHoverStateChange: (isHovering: boolean) => void;
}

const FONT_SIZES: { label: string, value: ReaderFontSize }[] = [
  { label: 'Sml', value: 'sm' },
  { label: 'Base', value: 'base' },
  { label: 'Lrg', value: 'lg' },
  { label: 'XL', value: 'xl' },
  { label: 'XXL', value: '2xl' },
];

const THEMES: { label: string, value: ReaderTheme, icon: React.ElementType }[] = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Sepia', value: 'sepia', icon: Coffee },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'Midnight', value: 'midnight', icon: MoonStar },
  { label: 'Paper', value: 'paper', icon: FileTextIcon },
  { label: 'Forest', value: 'forest', icon: Trees },
  { label: 'Custom', value: 'custom', icon: Paintbrush },
];

const FONT_FAMILIES: { label: string, value: ReaderFontFamily, style?: React.CSSProperties }[] = [
  { label: 'System Serif', value: 'system-serif', style: { fontFamily: 'serif'} },
  { label: 'System Sans-serif', value: 'system-sans', style: { fontFamily: 'sans-serif'} },
  { label: 'Lora', value: 'lora', style: { fontFamily: 'var(--font-lora)'} },
  { label: 'Merriweather', value: 'merriweather', style: { fontFamily: 'var(--font-merriweather)'} },
  { label: 'Noto Serif', value: 'noto-serif', style: { fontFamily: 'var(--font-noto-serif)'} },
  { label: 'PT Serif', value: 'pt-serif', style: { fontFamily: 'var(--font-pt-serif)'} },
  { label: 'EB Garamond', value: 'eb-garamond', style: { fontFamily: 'var(--font-eb-garamond)'} },
  { label: 'Vollkorn', value: 'vollkorn', style: { fontFamily: 'var(--font-vollkorn)'} },
  { label: 'Bitter', value: 'bitter', style: { fontFamily: 'var(--font-bitter)'} },
  { label: 'Open Sans', value: 'open-sans', style: { fontFamily: 'var(--font-open-sans)'} },
  { label: 'Lato', value: 'lato', style: { fontFamily: 'var(--font-lato)'} },
  { label: 'Roboto', value: 'roboto', style: { fontFamily: 'var(--font-roboto)'} },
  { label: 'Source Sans Pro', value: 'source-sans-pro', style: { fontFamily: 'var(--font-source-sans-pro)'} },
  { label: 'Inter', value: 'inter', style: { fontFamily: 'var(--font-inter)'} },
  { label: 'Personalizada', value: 'custom' },
];


const isValidHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

export default function ReaderControls({ 
  chapterHtmlContent, 
  onToggleImmersive, 
  isImmersive, 
  novelId,
  onTranslateRequest,
  forceTranslationMenuOpen = false,
  isTranslationApplied,
  onRevertToOriginal,
  isVisibleInImmersiveMode,
  onHoverStateChange
}: ReaderControlsProps) {
  const { 
    theme, 
    fontSize, 
    fontFamily,
    customFontFamily,
    setTheme, 
    setFontSize, 
    setCustomBackground, 
    setCustomForeground,
    setFontFamily,
    setCustomFontFamily: setCtxCustomFontFamily, // Renamed to avoid conflict
    customBackground, 
    customForeground 
  } = useReaderSettings();

  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isTranslateMenuOpen, setIsTranslateMenuOpen] = useState(forceTranslationMenuOpen);

  const [tempCustomFont, setTempCustomFont] = useState(customFontFamily || '');
  const [bgColorInput, setBgColorInput] = useState(customBackground || '#FFFFFF');
  const [fgColorInput, setFgColorInput] = useState(customForeground || '#000000');

  useEffect(() => {
    if (forceTranslationMenuOpen) {
      setIsTranslateMenuOpen(true);
    }
  }, [forceTranslationMenuOpen]);
  
  useEffect(() => {
    setBgColorInput(customBackground || '#FFFFFF');
  }, [customBackground]);

  useEffect(() => {
    setFgColorInput(customForeground || '#000000');
  }, [customForeground]);

  useEffect(() => {
    setTempCustomFont(customFontFamily || '');
  }, [customFontFamily]);


  const handleCustomBgChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setBgColorInput(newColor);
    if (isValidHexColor(newColor)) {
      setCustomBackground(newColor);
    }
  };
  
  const handleCustomBgInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setBgColorInput(newColor);
    if (isValidHexColor(newColor)) {
      setCustomBackground(newColor);
    }
  };

  const handleCustomFgChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setFgColorInput(newColor);
    if (isValidHexColor(newColor)) {
      setCustomForeground(newColor);
    }
  };

  const handleCustomFgInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setFgColorInput(newColor);
    if (isValidHexColor(newColor)) {
      setCustomForeground(newColor);
    }
  };

  const handleLanguageSelect = (language: TranslateChapterInput['targetLanguage']) => {
    onTranslateRequest(language);
    setIsTranslateMenuOpen(false); 
  };

  const handleTranslateButtonClick = () => {
    if (isTranslationApplied) {
      onRevertToOriginal();
    } else {
      setIsTranslateMenuOpen(true);
    }
  };

  const handleCustomFontApply = () => {
    if (tempCustomFont.trim()) {
      setCtxCustomFontFamily(tempCustomFont.trim());
    }
  };
  
  const translateButtonTooltip = isTranslationApplied ? "Ver Texto Original" : "Traducir Capítulo";
  const TranslateIcon = isTranslationApplied ? BookText : Languages;

  const baseClasses = "reader-controls p-2 bg-card/90 backdrop-blur-sm shadow-md border-b transition-transform duration-300 ease-in-out";
  let immersiveSpecificClasses = "";
  if (isImmersive) {
    immersiveSpecificClasses = `fixed top-0 left-0 right-0 z-[110] transform ${isVisibleInImmersiveMode ? 'translate-y-0' : '-translate-y-full'}`;
  } else {
    immersiveSpecificClasses = "sticky top-0 z-40 rounded-t-lg border-x";
  }

  return (
    <div 
      className={`${baseClasses} ${immersiveSpecificClasses}`}
      onMouseEnter={() => isImmersive && onHoverStateChange(true)}
      onMouseLeave={() => isImmersive && onHoverStateChange(false)}
    >
      <div className="mx-auto flex items-center justify-between gap-1 max-w-4xl px-2 sm:px-0">
        
        <div className="flex items-center gap-0.5 min-w-[40px]">
           {isImmersive && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                      <Link href={`/novels/${novelId}`} aria-label="Volver a Detalles de la Novela">
                          <BookOpen />
                      </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Detalles de la Novela</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex items-center gap-0.5 flex-grow justify-center">
          <DropdownMenu>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ajustes de apariencia">
                      <Settings2 />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Ajustes de Apariencia</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="center" className="w-80 sm:w-96"> {/* Increased width */}
              <DropdownMenuLabel>Tamaño de Fuente</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={fontSize} onValueChange={(value) => setFontSize(value as ReaderFontSize)}>
                {FONT_SIZES.map(fs => (
                  <DropdownMenuRadioItem key={fs.value} value={fs.value}>
                    {fs.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />

              <DropdownMenuLabel>Fuente</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={fontFamily} onValueChange={(value) => setFontFamily(value as ReaderFontFamily)}>
                {FONT_FAMILIES.map(ff => (
                  <DropdownMenuRadioItem key={ff.value} value={ff.value} style={ff.style}>
                    {ff.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {fontFamily === 'custom' && (
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent mt-1">
                  <div className="w-full space-y-1.5 py-1 pl-6">
                    <Label htmlFor="custom-font-input" className="text-xs text-muted-foreground flex items-center">
                      <CaseSensitive className="mr-1.5 h-3.5 w-3.5" /> Nombre de la fuente:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="custom-font-input"
                        type="text"
                        placeholder="Ej: Arial, Times New Roman"
                        value={tempCustomFont}
                        onChange={(e) => setTempCustomFont(e.target.value)}
                        className="h-8 text-sm flex-grow"
                      />
                       <Button size="sm" variant="outline" onClick={handleCustomFontApply} className="h-8 px-2.5 text-xs">Aplicar</Button>
                    </div>
                     <p className="text-xs text-muted-foreground leading-tight pt-0.5">
                      La fuente debe estar instalada en tu sistema o ser una fuente web.
                    </p>
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />

              <DropdownMenuLabel>Tema</DropdownMenuLabel>
               <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ReaderTheme)}>
                {THEMES.map(th => (
                  <DropdownMenuRadioItem key={th.value} value={th.value}>
                    <th.icon className="mr-2 h-4 w-4" />
                    {th.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {theme === 'custom' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Colores Personalizados</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent">
                    <div className="w-full space-y-3 py-1 pl-6">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="custom-bg-color" className="text-sm text-popover-foreground shrink-0 w-12">Fondo:</Label>
                        <input
                          id="custom-bg-color"
                          type="color"
                          value={customBackground || '#FFFFFF'}
                          onChange={handleCustomBgChange}
                          className="h-8 w-8 p-0 border rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={bgColorInput}
                          onChange={handleCustomBgInputChange}
                          placeholder="#FFFFFF"
                          className="h-8 text-sm flex-grow"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="custom-fg-color" className="text-sm text-popover-foreground shrink-0 w-12">Texto:</Label>
                        <input
                          id="custom-fg-color"
                          type="color"
                          value={customForeground || '#000000'}
                          onChange={handleCustomFgChange}
                          className="h-8 w-8 p-0 border rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={fgColorInput}
                          onChange={handleCustomFgInputChange}
                          placeholder="#000000"
                          className="h-8 text-sm flex-grow"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsSummaryDialogOpen(true)} aria-label="Resumen del capítulo">
                  <TextQuote />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Resumen del Capítulo</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ChapterSummaryDialog 
            chapterHtmlContent={chapterHtmlContent} 
            isOpen={isSummaryDialogOpen} 
            onOpenChange={setIsSummaryDialogOpen} 
          />
          
          <DropdownMenu open={!isTranslationApplied && isTranslateMenuOpen} onOpenChange={!isTranslationApplied ? setIsTranslateMenuOpen : undefined}>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label={translateButtonTooltip}
                    onClick={handleTranslateButtonClick}
                  >
                    <TranslateIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{translateButtonTooltip}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!isTranslationApplied && (
              <DropdownMenuContent align="center">
                <DropdownMenuLabel>Traducir a</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TARGET_LANGUAGES.map(lang => (
                  <DropdownMenuItem key={lang.value} onClick={() => handleLanguageSelect(lang.value)}>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            )}
          </DropdownMenu>

          <AudioPlayer textToRead={chapterHtmlContent} />
        </div>

        <div className="flex items-center gap-0.5 min-w-[40px]">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleImmersive} aria-label={isImmersive ? "Salir de Pantalla Completa" : "Lectura en Pantalla Completa"}>
                  {isImmersive ? <Minimize /> : <Maximize />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isImmersive ? "Salir de Pantalla Completa" : "Lectura en Pantalla Completa"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

    