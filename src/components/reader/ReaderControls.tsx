
'use client';

import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import type { ReaderTheme, ReaderFontSize } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { Settings2, TextQuote, Minimize, Maximize, Sun, Moon, Coffee, BookOpen, Languages, BookText, Palette, FileTextIcon, Trees, MoonStar, Paintbrush } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import ChapterSummaryDialog from './ChapterSummaryDialog';
import AudioPlayer from './AudioPlayer';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TranslateChapterInput } from '@/ai/flows/translate-chapter-flow';

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

export default function ReaderControls({ 
  chapterHtmlContent, 
  onToggleImmersive, 
  isImmersive, 
  novelId,
  onTranslateRequest,
  forceTranslationMenuOpen = false,
  isTranslationApplied,
  onRevertToOriginal
}: ReaderControlsProps) {
  const { 
    theme, 
    fontSize, 
    setTheme, 
    setFontSize, 
    customBackground, 
    customForeground, 
    setCustomBackground, 
    setCustomForeground 
  } = useReaderSettings();
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isTranslateMenuOpen, setIsTranslateMenuOpen] = useState(forceTranslationMenuOpen);

  // State for color picker inputs, local to this component
  // Initialize with context values or defaults if context values are somehow null/undefined initially
  const [bgColor, setBgColor] = useState(customBackground || '#FFFFFF');
  const [fgColor, setFgColor] = useState(customForeground || '#000000');

  useEffect(() => {
    if (forceTranslationMenuOpen) {
      setIsTranslateMenuOpen(true);
    }
  }, [forceTranslationMenuOpen]);
  
  // Sync local color picker state with context if context changes (e.g., loaded from localStorage)
  useEffect(() => {
    setBgColor(customBackground || '#FFFFFF');
  }, [customBackground]);

  useEffect(() => {
    setFgColor(customForeground || '#000000');
  }, [customForeground]);

  const handleCustomBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBgColor(e.target.value);
    setCustomBackground(e.target.value);
  };

  const handleCustomFgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFgColor(e.target.value);
    setCustomForeground(e.target.value);
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
  
  const translateButtonTooltip = isTranslationApplied ? "Ver Texto Original" : "Traducir Capítulo";
  const TranslateIcon = isTranslationApplied ? BookText : Languages;

  return (
    <div className={`reader-controls p-2 bg-card/90 backdrop-blur-sm shadow-md border-b transition-all duration-300 ${isImmersive ? 'opacity-0 hover:opacity-100 fixed top-0 left-0 right-0 z-[110] pt-2' : 'sticky top-0 z-40 rounded-t-lg border-x'}`}>
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
            <DropdownMenuContent align="center" className="w-60">
              <DropdownMenuLabel>Tamaño de Fuente</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={fontSize} onValueChange={(value) => setFontSize(value as ReaderFontSize)}>
                {FONT_SIZES.map(fs => (
                  <DropdownMenuRadioItem key={fs.value} value={fs.value}>
                    {fs.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
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
                  {/* Using DropdownMenuItem to contain the inputs to prevent menu close on click */}
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent">
                    <div className="w-full space-y-2 py-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="custom-bg-color" className="text-sm mr-2 text-popover-foreground">Fondo</label>
                        <input
                          id="custom-bg-color"
                          type="color"
                          value={bgColor}
                          onChange={handleCustomBgChange}
                          className="w-10 h-6 p-0 border rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="custom-fg-color" className="text-sm mr-2 text-popover-foreground">Texto</label>
                        <input
                          id="custom-fg-color"
                          type="color"
                          value={fgColor}
                          onChange={handleCustomFgChange}
                          className="w-10 h-6 p-0 border rounded cursor-pointer"
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
