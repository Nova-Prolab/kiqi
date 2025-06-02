
'use client';

import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import type { ReaderTheme, ReaderFontSize, ReaderFontFamily, ReaderLineHeight } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  CaseSensitive,
  AlignJustify,
  ALargeSmall,
  Loader2,
  Type, // Icon for general font
  Sparkles, // Icon for Cousine (monospace)
} from 'lucide-react';
import React, { useState, useEffect, ChangeEvent, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DynamicChapterSummaryDialog = dynamic(() => import('./ChapterSummaryDialog'), {
  suspense: true,
  loading: () => <div className="w-8 h-8 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>,
});
const DynamicTranslationDialog = dynamic(() => import('./TranslationDialog'), {
  suspense: true,
  loading: () => <div className="w-8 h-8 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>,
});


interface ReaderControlsProps {
  chapterHtmlContent: string;
  onToggleImmersive: () => void;
  isImmersive: boolean;
  novelId: string;
  isVisibleInImmersiveMode: boolean;
  onHoverStateChange: (isHovering: boolean) => void;
  onAppearanceMenuToggle: (isOpen: boolean) => void;
}

const FONT_SIZES: { label: string, value: ReaderFontSize }[] = [
  { label: 'Pequeño', value: 'sm' },
  { label: 'Normal', value: 'base' },
  { label: 'Grande', value: 'lg' },
  { label: 'Muy Grande', value: 'xl' },
  { label: 'Extra Grande', value: '2xl' },
];

const LINE_HEIGHTS: { label: string, value: ReaderLineHeight }[] = [
    { label: 'Estrecho', value: 'tight'},
    { label: 'Normal', value: 'normal' },
    { label: 'Relajado', value: 'relaxed' },
    { label: 'Amplio', value: 'loose' },
];

const THEMES: { label: string, value: ReaderTheme, icon: React.ElementType }[] = [
  { label: 'Claro', value: 'light', icon: Sun },
  { label: 'Sepia', value: 'sepia', icon: Coffee },
  { label: 'Oscuro', value: 'dark', icon: Moon },
  { label: 'Medianoche', value: 'midnight', icon: MoonStar },
  { label: 'Papel', value: 'paper', icon: FileTextIcon },
  { label: 'Bosque', value: 'forest', icon: Trees },
  { label: 'Personalizado', value: 'custom', icon: Paintbrush },
];

const FONT_FAMILIES: { label: string, value: ReaderFontFamily, style?: React.CSSProperties, icon?: React.ElementType }[] = [
  { label: 'Sans-serif (Sistema)', value: 'system-sans', style: { fontFamily: 'sans-serif'}, icon: Type },
  { label: 'Serif (Sistema)', value: 'system-serif', style: { fontFamily: 'serif'}, icon: Type },
  { label: 'Lora', value: 'lora', style: { fontFamily: 'var(--font-lora)'}, icon: Type },
  { label: 'Merriweather', value: 'merriweather', style: { fontFamily: 'var(--font-merriweather)'}, icon: Type },
  { label: 'Noto Serif', value: 'noto-serif', style: { fontFamily: 'var(--font-noto-serif)'}, icon: Type },
  { label: 'PT Serif', value: 'pt-serif', style: { fontFamily: 'var(--font-pt-serif)'}, icon: Type },
  { label: 'EB Garamond', value: 'eb-garamond', style: { fontFamily: 'var(--font-eb-garamond)'}, icon: Type },
  { label: 'Vollkorn', value: 'vollkorn', style: { fontFamily: 'var(--font-vollkorn)'}, icon: Type },
  { label: 'Bitter', value: 'bitter', style: { fontFamily: 'var(--font-bitter)'}, icon: Type },
  { label: 'Open Sans', value: 'open-sans', style: { fontFamily: 'var(--font-open-sans)'}, icon: Type },
  { label: 'Lato', value: 'lato', style: { fontFamily: 'var(--font-lato)'}, icon: Type },
  { label: 'Roboto', value: 'roboto', style: { fontFamily: 'var(--font-roboto)'}, icon: Type },
  { label: 'Source Sans Pro', value: 'source-sans-pro', style: { fontFamily: 'var(--font-source-sans-pro)'}, icon: Type },
  { label: 'Inter', value: 'inter', style: { fontFamily: 'var(--font-inter)'}, icon: Type },
  { label: 'Arimo', value: 'arimo', style: { fontFamily: 'var(--font-arimo)'}, icon: Type },
  { label: 'Tinos', value: 'tinos', style: { fontFamily: 'var(--font-tinos)'}, icon: Type },
  { label: 'Cousine (Mono)', value: 'cousine', style: { fontFamily: 'var(--font-cousine)'}, icon: Sparkles },
  { label: 'Personalizada', value: 'custom', icon: CaseSensitive },
];

const isValidHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

function ReaderControls({
  chapterHtmlContent,
  onToggleImmersive,
  isImmersive,
  novelId,
  isVisibleInImmersiveMode,
  onHoverStateChange,
  onAppearanceMenuToggle,
}: ReaderControlsProps) {
  const {
    theme,
    fontSize,
    fontFamily,
    lineHeight,
    customFontFamily,
    setTheme,
    setFontSize,
    setLineHeight,
    setCustomBackground,
    setCustomForeground,
    setFontFamily,
    setCustomFontFamily: setCtxCustomFontFamily,
    customBackground,
    customForeground
  } = useReaderSettings();

  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isTranslationDialogOpen, setIsTranslationDialogOpen] = useState(false);


  const [tempCustomFont, setTempCustomFont] = useState(customFontFamily || '');
  const [bgColorInput, setBgColorInput] = useState(customBackground || '#FFFFFF');
  const [fgColorInput, setFgColorInput] = useState(customForeground || '#000000');


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

  const handleCustomFontApply = () => {
    if (tempCustomFont.trim()) {
      setCtxCustomFontFamily(tempCustomFont.trim());
    }
  };

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
      onMouseLeave={() => {
        // No desactivar hover si el menú de apariencia está abierto
        // La lógica de visibilidad en ReaderView se encarga de mantenerlo visible
        // si isAppearanceMenuOpen es true.
        if (isImmersive) {
           onHoverStateChange(false);
        }
      }}
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
          <DropdownMenu onOpenChange={(isOpen) => {
            onAppearanceMenuToggle(isOpen);
            if (isOpen && isImmersive) {
              // Informa a ReaderView que mantenga los controles visibles
              // mientras el menú está abierto, incluso si el mouse se mueve al portal del menú.
              onHoverStateChange(true); 
            }
          }}>
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
            <DropdownMenuContent
              align="center"
              className="w-80 sm:w-96 !p-0"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <ScrollArea
                className="max-h-[60vh] sm:max-h-[70vh] md:max-h-[450px] lg:max-h-[500px]"
              >
                <div className="p-1">
                  <DropdownMenuLabel className="flex items-center px-2"><Palette className="mr-2 h-4 w-4" />Apariencia</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2"> 
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Tamaño de Fuente</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={fontSize} onValueChange={(value) => setFontSize(value as ReaderFontSize)}>
                      {FONT_SIZES.map(fs => (
                        <DropdownMenuRadioItem key={fs.value} value={fs.value}>
                          <ALargeSmall className="mr-2 h-4 w-4" /> {fs.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-xs text-muted-foreground">Interlineado</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={lineHeight} onValueChange={(value) => setLineHeight(value as ReaderLineHeight)}>
                      {LINE_HEIGHTS.map(lh => (
                        <DropdownMenuRadioItem key={lh.value} value={lh.value}>
                          <AlignJustify className="mr-2 h-4 w-4" /> {lh.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-xs text-muted-foreground">Fuente</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={fontFamily} onValueChange={(value) => setFontFamily(value as ReaderFontFamily)}>
                      {FONT_FAMILIES.map(ff => (
                        <DropdownMenuRadioItem key={ff.value} value={ff.value} style={ff.style}>
                          {ff.icon && <ff.icon className="mr-2 h-4 w-4" />}
                          {ff.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </div>
                  {fontFamily === 'custom' && (
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent mt-1">
                      <div className="w-full space-y-1.5 py-1 pl-8 pr-2"> 
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
                            onClick={(e) => e.stopPropagation()}
                          />
                           <Button size="sm" variant="outline" onClick={handleCustomFontApply} className="h-8 px-2.5 text-xs">Aplicar</Button>
                        </div>
                         <p className="text-xs text-muted-foreground leading-tight pt-0.5">
                          La fuente debe estar instalada en tu sistema.
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <div className="px-2">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Tema</DropdownMenuLabel>
                     <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ReaderTheme)}>
                      {THEMES.map(th => (
                        <DropdownMenuRadioItem key={th.value} value={th.value}>
                          <th.icon className="mr-2 h-4 w-4" />
                          {th.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </div>
                  {theme === 'custom' && (
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent mt-1">
                      <div className="w-full space-y-3 py-1 pl-8 pr-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="custom-bg-color" className="text-xs text-popover-foreground shrink-0 w-14">Fondo:</Label>
                            <input
                              id="custom-bg-color"
                              type="color"
                              value={customBackground || '#FFFFFF'}
                              onChange={handleCustomBgChange}
                              className="h-7 w-7 p-0 border rounded cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Input
                              type="text"
                              value={bgColorInput}
                              onChange={handleCustomBgInputChange}
                              placeholder="#FFFFFF"
                              className="h-8 text-sm flex-grow"
                              maxLength={7}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="custom-fg-color" className="text-xs text-popover-foreground shrink-0 w-14">Texto:</Label>
                            <input
                              id="custom-fg-color"
                              type="color"
                              value={customForeground || '#000000'}
                              onChange={handleCustomFgChange}
                              className="h-7 w-7 p-0 border rounded cursor-pointer"
                               onClick={(e) => e.stopPropagation()}
                            />
                            <Input
                              type="text"
                              value={fgColorInput}
                              onChange={handleCustomFgInputChange}
                              placeholder="#000000"
                              className="h-8 text-sm flex-grow"
                              maxLength={7}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                    </DropdownMenuItem>
                  )}
                </div>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSummaryDialogOpen(true)}
                  aria-label="Resumen del capítulo (Próximamente)"
                  disabled
                >
                  <TextQuote />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Resumen del Capítulo (Próximamente)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Suspense fallback={<div className="w-8 h-8 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>}>
            <DynamicChapterSummaryDialog
              chapterHtmlContent={chapterHtmlContent}
              isOpen={isSummaryDialogOpen}
              onOpenChange={setIsSummaryDialogOpen}
            />
          </Suspense>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Traducir Capítulo (Próximamente)"
                  disabled
                  onClick={() => setIsTranslationDialogOpen(true)}
                >
                  <Languages />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Traducir Capítulo (Próximamente)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
           <Suspense fallback={<div className="w-8 h-8 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>}>
            <DynamicTranslationDialog
                isOpen={isTranslationDialogOpen}
                onOpenChange={setIsTranslationDialogOpen}
                originalHtmlContent={chapterHtmlContent}
                targetLanguage={null}
                onLanguageChangeRequest={() => { setIsTranslationDialogOpen(false); }}
                onApplyTranslation={() => { /* No-op */ }}
              />
          </Suspense>
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

export default React.memo(ReaderControls);

