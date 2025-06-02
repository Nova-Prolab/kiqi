
'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import type { ReaderTheme, ReaderFontSize, ReaderFontFamily, ReaderLineHeight, ReaderLetterSpacing, ReaderTextAlign, ReaderTextWidth, ReaderParagraphSpacing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Type, Columns, Palette, RefreshCcw, Sun, Moon, Coffee, MoonStar, FileTextIcon as PaperIcon, Trees, Paintbrush, CaseSensitive, Text, AlignLeft, AlignJustify, ALargeSmall, Pilcrow, ArrowLeftRight, Baseline } from 'lucide-react';

// Re-defining constants for UI, could be exported from context if preferred
const FONT_SIZES_OPTIONS: { label: string, value: ReaderFontSize, icon: React.ElementType }[] = [
  { label: 'Pequeño', value: 'sm', icon: ALargeSmall }, { label: 'Normal', value: 'base', icon: ALargeSmall }, { label: 'Grande', value: 'lg', icon: ALargeSmall },
  { label: 'Muy Grande', value: 'xl', icon: ALargeSmall }, { label: 'Extra Grande', value: '2xl', icon: ALargeSmall },
];
const LINE_HEIGHTS_OPTIONS: { label: string, value: ReaderLineHeight, icon: React.ElementType }[] = [
  { label: 'Estrecho', value: 'tight', icon: Baseline }, { label: 'Normal', value: 'normal', icon: Baseline },
  { label: 'Relajado', value: 'relaxed', icon: Baseline }, { label: 'Amplio', value: 'loose', icon: Baseline },
];
const THEMES_OPTIONS: { label: string, value: ReaderTheme, icon: React.ElementType }[] = [
  { label: 'Claro', value: 'light', icon: Sun }, { label: 'Sepia', value: 'sepia', icon: Coffee }, { label: 'Oscuro', value: 'dark', icon: Moon }, 
  { label: 'Medianoche', value: 'midnight', icon: MoonStar }, { label: 'Papel', value: 'paper', icon: PaperIcon }, { label: 'Bosque', value: 'forest', icon: Trees },
  { label: 'Personalizado', value: 'custom', icon: Paintbrush },
];
const FONT_FAMILIES_OPTIONS: { label: string, value: ReaderFontFamily, style?: React.CSSProperties, icon: React.ElementType }[] = [
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
const LETTER_SPACINGS_OPTIONS: { label: string, value: ReaderLetterSpacing, icon: React.ElementType }[] = [
  { label: 'Normal', value: 'normal', icon: ArrowLeftRight }, { label: 'Ancho', value: 'wide', icon: ArrowLeftRight }, { label: 'Más Ancho', value: 'wider', icon: ArrowLeftRight },
];
const TEXT_ALIGNS_OPTIONS: { label: string, value: ReaderTextAlign, icon: React.ElementType }[] = [
  { label: 'Izquierda', value: 'left', icon: AlignLeft }, { label: 'Justificado', value: 'justify', icon: AlignJustify },
];
const TEXT_WIDTHS_OPTIONS: { label: string, value: ReaderTextWidth, icon: React.ElementType }[] = [
  { label: 'Estrecho', value: 'narrow', icon: Columns }, { label: 'Medio', value: 'medium', icon: Columns }, { label: 'Ancho', value: 'wide', icon: Columns },
];
const PARAGRAPH_SPACINGS_OPTIONS: { label: string, value: ReaderParagraphSpacing, icon: React.ElementType }[] = [
  { label: 'Predeterminado', value: 'default', icon: Pilcrow }, { label: 'Medio', value: 'medium', icon: Pilcrow }, { label: 'Amplio', value: 'large', icon: Pilcrow },
];

interface ReaderSettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ReaderSettingsSheet({ isOpen, onOpenChange }: ReaderSettingsSheetProps) {
  const {
    theme, fontSize, fontFamily, lineHeight, customFontFamily,
    setTheme, setFontSize, setLineHeight, setFontFamily, setCustomFontFamily,
    customBackground, customForeground, setCustomBackground, setCustomForeground,
    letterSpacing, setLetterSpacing, textAlign, setTextAlign,
    textWidth, setTextWidth, paragraphSpacing, setParagraphSpacing,
    resetSettings,
  } = useReaderSettings();

  const [tempCustomFont, setTempCustomFont] = useState(customFontFamily || '');
  const [bgColorInput, setBgColorInput] = useState(customBackground || '#FFFFFF');
  const [fgColorInput, setFgColorInput] = useState(customForeground || '#000000');

  useEffect(() => { setTempCustomFont(customFontFamily || ''); }, [customFontFamily]);
  useEffect(() => { setBgColorInput(customBackground || '#FFFFFF'); }, [customBackground]);
  useEffect(() => { setFgColorInput(customForeground || '#000000'); }, [customForeground]);

  const handleCustomFontApply = () => { if (tempCustomFont.trim()) { setCustomFontFamily(tempCustomFont.trim()); } };
  
  const isValidHexColor = (color: string): boolean => /^#[0-9A-F]{6}$/i.test(color);

  const handleCustomColorChange = (
    colorSetter: (hex: string) => void, 
    inputSetter: React.Dispatch<React.SetStateAction<string>>
  ) => (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    inputSetter(newColor); // Update local state for text input immediately
    if (isValidHexColor(newColor)) {
      colorSetter(newColor); // Update context and localStorage if valid hex
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm sm:max-w-md p-0 flex flex-col" data-vaul-drawer-direction="right">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle>Personalizar Lectura</SheetTitle>
          <SheetDescription>
            Ajusta la apariencia del lector a tu gusto. Tus preferencias se guardarán.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-6">
            
            {/* Section: Tipografía */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center"><Type className="mr-2 h-4 w-4" />TIPOGRAFÍA</Label>
              <div className="space-y-2">
                <Label htmlFor="font-family-select" className="text-sm">Fuente</Label>
                <Select value={fontFamily} onValueChange={(value) => setFontFamily(value as ReaderFontFamily)}>
                  <SelectTrigger id="font-family-select"><SelectValue placeholder="Selecciona una fuente" /></SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES_OPTIONS.map(ff => <SelectItem key={ff.value} value={ff.value} style={ff.style}><div className="flex items-center">{ff.icon && <ff.icon className="mr-2 h-4 w-4" />} {ff.label}</div></SelectItem>)}
                  </SelectContent>
                </Select>
                {fontFamily === 'custom' && (
                  <div className="pl-2 pt-1 space-y-1.5 border-l-2 ml-1">
                     <Label htmlFor="custom-font-input" className="text-xs text-muted-foreground flex items-center"><CaseSensitive className="mr-1.5 h-3 w-3" /> Nombre de la fuente personalizada:</Label>
                    <div className="flex items-center gap-2">
                      <Input id="custom-font-input" type="text" placeholder="Ej: Arial, Times New Roman" value={tempCustomFont} onChange={(e) => setTempCustomFont(e.target.value)} className="h-9 text-sm" />
                      <Button size="sm" variant="outline" onClick={handleCustomFontApply} className="h-9 text-xs px-2">Aplicar</Button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">La fuente debe estar instalada en tu dispositivo.</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-size-select" className="text-sm">Tamaño de Fuente</Label>
                <Select value={fontSize} onValueChange={(value) => setFontSize(value as ReaderFontSize)}>
                  <SelectTrigger id="font-size-select"><SelectValue placeholder="Selecciona un tamaño" /></SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES_OPTIONS.map(fs => <SelectItem key={fs.value} value={fs.value}><div className="flex items-center"><fs.icon className="mr-2 h-4 w-4" />{fs.label}</div></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />

            {/* Section: Espaciado y Disposición */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center"><Columns className="mr-2 h-4 w-4" />ESPACIADO Y DISPOSICIÓN</Label>
              <div className="space-y-2">
                <Label htmlFor="line-height-select" className="text-sm">Interlineado</Label>
                <Select value={lineHeight} onValueChange={(value) => setLineHeight(value as ReaderLineHeight)}>
                  <SelectTrigger id="line-height-select"><SelectValue placeholder="Selecciona interlineado" /></SelectTrigger>
                  <SelectContent>
                    {LINE_HEIGHTS_OPTIONS.map(lh => <SelectItem key={lh.value} value={lh.value}><div className="flex items-center"><lh.icon className="mr-2 h-4 w-4" />{lh.label}</div></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="letter-spacing-select" className="text-sm">Espaciado de Letras</Label>
                <Select value={letterSpacing} onValueChange={(value) => setLetterSpacing(value as ReaderLetterSpacing)}>
                  <SelectTrigger id="letter-spacing-select"><SelectValue placeholder="Selecciona espaciado" /></SelectTrigger>
                  <SelectContent>
                    {LETTER_SPACINGS_OPTIONS.map(ls => <SelectItem key={ls.value} value={ls.value}><div className="flex items-center"><ls.icon className="mr-2 h-4 w-4" />{ls.label}</div></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="text-align-select" className="text-sm">Alineación de Texto</Label>
                <Select value={textAlign} onValueChange={(value) => setTextAlign(value as ReaderTextAlign)}>
                  <SelectTrigger id="text-align-select"><SelectValue placeholder="Selecciona alineación" /></SelectTrigger>
                  <SelectContent>
                    {TEXT_ALIGNS_OPTIONS.map(ta => <SelectItem key={ta.value} value={ta.value}><div className="flex items-center"><ta.icon className="mr-2 h-4 w-4" />{ta.label}</div></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="text-width-select" className="text-sm">Ancho del Texto</Label>
                <Select value={textWidth} onValueChange={(value) => setTextWidth(value as ReaderTextWidth)}>
                  <SelectTrigger id="text-width-select"><SelectValue placeholder="Selecciona ancho" /></SelectTrigger>
                  <SelectContent>
                    {TEXT_WIDTHS_OPTIONS.map(tw => <SelectItem key={tw.value} value={tw.value}><div className="flex items-center"><tw.icon className="mr-2 h-4 w-4" />{tw.label}</div></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paragraph-spacing-select" className="text-sm">Espaciado de Párrafos</Label>
                <Select value={paragraphSpacing} onValueChange={(value) => setParagraphSpacing(value as ReaderParagraphSpacing)}>
                  <SelectTrigger id="paragraph-spacing-select"><SelectValue placeholder="Selecciona espaciado" /></SelectTrigger>
                  <SelectContent>
                    {PARAGRAPH_SPACINGS_OPTIONS.map(ps => <SelectItem key={ps.value} value={ps.value}><div className="flex items-center"><ps.icon className="mr-2 h-4 w-4" />{ps.label}</div></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />

            {/* Section: Tema y Colores */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center"><Palette className="mr-2 h-4 w-4" />TEMA Y COLORES</Label>
              <div className="space-y-2">
                <Label htmlFor="theme-select" className="text-sm">Tema de Lectura</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value as ReaderTheme)}>
                  <SelectTrigger id="theme-select"><SelectValue placeholder="Selecciona un tema" /></SelectTrigger>
                  <SelectContent>
                    {THEMES_OPTIONS.map(th => <SelectItem key={th.value} value={th.value}><div className="flex items-center"><th.icon className="mr-2 h-4 w-4" />{th.label}</div></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {theme === 'custom' && (
                <div className="pl-2 pt-1 space-y-3 border-l-2 ml-1">
                  <Label className="text-xs text-muted-foreground">Colores Personalizados:</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="custom-bg-color" className="text-xs text-popover-foreground shrink-0 w-12">Fondo:</Label>
                    <Input id="custom-bg-color" type="color" value={bgColorInput} onChange={handleCustomColorChange(setCustomBackground, setBgColorInput)} className="h-8 w-8 p-0.5 border rounded cursor-pointer shrink-0" />
                    <Input type="text" value={bgColorInput} onChange={handleCustomColorChange(setCustomBackground, setBgColorInput)} placeholder="#RRGGBB" className="h-9 text-sm flex-grow" maxLength={7} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="custom-fg-color" className="text-xs text-popover-foreground shrink-0 w-12">Texto:</Label>
                    <Input id="custom-fg-color" type="color" value={fgColorInput} onChange={handleCustomColorChange(setCustomForeground, setFgColorInput)} className="h-8 w-8 p-0.5 border rounded cursor-pointer shrink-0" />
                    <Input type="text" value={fgColorInput} onChange={handleCustomColorChange(setCustomForeground, setFgColorInput)} placeholder="#RRGGBB" className="h-9 text-sm flex-grow" maxLength={7} />
                  </div>
                </div>
              )}
            </div>

          </div>
        </ScrollArea>
        <SheetFooter className="p-4 border-t flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={resetSettings} className="w-full sm:w-auto">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Restaurar
            </Button>
          <SheetClose asChild>
            <Button className="w-full sm:w-auto">Hecho</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

