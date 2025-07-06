'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Palette, Languages, Code, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import { useCustomTheme } from '@/contexts/CustomThemeContext';
import { TARGET_LANGUAGES, type TargetLanguage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface GlobalSettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// --- Helper Functions for Color Conversion ---

const isValidHslString = (hslString: string): boolean => {
  if (!hslString) return false;
  const hslRegex = /^\s*(-?\d*\.?\d+)(deg|rad|turn)?\s+(-?\d*\.?\d+)%\s+(-?\d*\.?\d+)%\s*$/;
  return hslRegex.test(hslString);
}

const hslStringToHex = (hslStr: string): string => {
  const match = hslStr.match(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)%\s+(-?\d*\.?\d+)%/);
  if (!match) return '#000000';

  let h = parseFloat(match[1]);
  let s = parseFloat(match[2]) / 100;
  let l = parseFloat(match[3]) / 100;
  
  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2,
      r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
  else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
  else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
  else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
  else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
  else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHslString = (hex: string): string => {
  let r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
  r /= 255; g /= 255; b /= 255;
  
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
};

const predefinedThemes = [
  { name: 'Vacío', value: 'empty', css: `` },
  { name: 'Pride 🏳️‍🌈', value: 'pride', css: `
    @keyframes pride-gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    :root {
      --primary: 338 90% 60% !important;
    }
    body {
      background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab) !important;
      background-size: 400% 400% !important;
      animation: pride-gradient 15s ease infinite !important;
    }
    .card, .bg-card, .bg-background { background-color: rgba(255,255,255,0.8) !important; backdrop-filter: blur(5px); }
    .dark .card, .dark .bg-card, .dark .bg-background { background-color: rgba(0,0,0,0.7) !important; backdrop-filter: blur(5px); }
  `},
  { name: 'Vaporwave 🌴', value: 'vaporwave', css: `
    body { 
      background: linear-gradient(to bottom, #ff71ce, #01cdfe, #05ffa1);
      font-family: 'Lucida Console', 'Courier New', monospace;
    }
    :root {
      --primary: 320 100% 60%;
      --accent: 195 100% 50%;
      --foreground: 0 0% 100%;
      --background: 260 50% 10%;
    }
    .card, .bg-card { background-color: rgba(0,0,50,0.5) !important; border: 1px solid #ff71ce; }
    h1, h2, .text-primary { text-shadow: 2px 2px 5px #01cdfe; }
  `},
  { name: 'The Matrix 📟', value: 'matrix', css: `
    body {
      background-color: #000 !important;
      color: #00FF41 !important;
      font-family: 'Courier New', Courier, monospace !important;
    }
    :root {
      --background: 0 0% 0% !important;
      --foreground: 135 100% 50% !important;
      --primary: 135 100% 60% !important;
      --primary-foreground: 0 0% 0% !important;
      --accent: 135 100% 30% !important;
      --border: 135 100% 25% !important;
      --input: 135 100% 15% !important;
    }
    .card, .bg-card { background-color: #080808 !important; border: 1px solid #00FF41; box-shadow: 0 0 5px #00FF41; }
    a, button { text-shadow: 0 0 3px #00FF41; }
  `},
  { name: 'Terminal 📠', value: 'terminal', css: `
    body { 
      background-color: #1a1a1a !important;
      color: #F8B41E !important;
      font-family: 'VT323', 'Fira Code', monospace !important;
    }
    :root {
      --background: 0 0% 10% !important;
      --foreground: 41 95% 56% !important;
      --primary: 41 95% 65% !important;
      --primary-foreground: 0 0% 5% !important;
      --border: 41 95% 30% !important;
    }
    .card, .bg-card { background-color: #111 !important; border: 1px solid #444; }
  `},
  { name: 'GitHub Dark Dimmed 🐙', value: 'github-dimmed', css: `
    :root {
      --background: 222 24% 11% !important;
      --foreground: 215 15% 75% !important;
      --primary: 212 92% 64% !important;
      --primary-foreground: 222 24% 11% !important;
      --card: 222 24% 15% !important;
      --border: 217 19% 27% !important;
      --input: 222 24% 11% !important;
      --accent: 212 92% 64% !important;
    }
  `},
  { name: 'Discord Dark 👾', value: 'discord-dark', css: `
    :root {
      --background: 226 23% 18% !important;
      --foreground: 220 17% 89% !important;
      --primary: 235 86% 65% !important;
      --primary-foreground: 0 0% 100% !important;
      --card: 226 23% 21% !important;
      --border: 226 23% 14% !important;
      --input: 226 23% 14% !important;
      --accent: 235 86% 65% !important;
    }
  `},
  { name: 'Spotify 🎧', value: 'spotify', css: `
    :root {
      --background: 0 0% 7% !important;
      --foreground: 0 0% 95% !important;
      --primary: 83 76% 51% !important;
      --primary-foreground: 0 0% 7% !important;
      --card: 0 0% 10% !important;
      --border: 0 0% 20% !important;
      --input: 0 0% 15% !important;
      --accent: 83 76% 51% !important;
    }
  `},
  { name: 'Solarized Light ☀️', value: 'solarized-light', css: `
    :root {
      --background: 46 52% 95% !important;
      --foreground: 202 12% 41% !important;
      --primary: 205 69% 47% !important;
      --primary-foreground: 46 52% 95% !important;
      --card: 46 100% 99% !important;
      --border: 45 33% 88% !important;
      --accent: 196 90% 41% !important;
    }
  `},
  { name: 'Nord ❄️', value: 'nord', css: `
    :root {
      --background: 220 13% 20% !important;
      --foreground: 220 14% 87% !important;
      --primary: 207 38% 61% !important;
      --primary-foreground: 220 13% 20% !important;
      --card: 220 13% 25% !important;
      --border: 220 13% 30% !important;
      --accent: 194 43% 66% !important;
    }
  `},
  { name: 'Gruvbox Dark 📦', value: 'gruvbox-dark', css: `
    :root {
      --background: 0 0% 16% !important;
      --foreground: 45 52% 86% !important;
      --primary: 26 98% 55% !important;
      --primary-foreground: 0 0% 16% !important;
      --card: 0 0% 22% !important;
      --border: 0 0% 31% !important;
      --accent: 40 82% 64% !important;
    }
  `}
];

export default function GlobalSettingsSheet({ isOpen, onOpenChange }: GlobalSettingsSheetProps) {
  const { 
    autoTranslate, setAutoTranslate, 
    autoTranslateLanguage, setAutoTranslateLanguage 
  } = useReaderSettings();
  
  const { 
    colors, setColors, 
    rawCss, setRawCss,
    resetCustomTheme
  } = useCustomTheme();

  const { toast } = useToast();

  const [tempColors, setTempColors] = useState({
      primary: '', background: '', accent: '', foreground: ''
  });
  const [tempRawCss, setTempRawCss] = useState('');

  const getCssVariableValue = (variable: string) => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  };

  useEffect(() => {
    if (isOpen) {
      setTempColors({
        primary: colors.primary || getCssVariableValue('--primary'),
        background: colors.background || getCssVariableValue('--background'),
        accent: colors.accent || getCssVariableValue('--accent'),
        foreground: colors.foreground || getCssVariableValue('--foreground'),
      });
      setTempRawCss(rawCss.raw || '');
    }
  }, [isOpen, colors, rawCss]);

  const handleColorChange = (colorName: keyof typeof tempColors, value: string) => {
    setTempColors(prev => ({ ...prev, [colorName]: value }));
  };
  
  const applyThemeChanges = () => {
    const validColors: typeof colors = {};
    for (const [key, value] of Object.entries(tempColors)) {
      if (isValidHslString(value)) {
        validColors[key as keyof typeof colors] = value;
      }
    }
    setColors(validColors);
    toast({ title: "Apariencia Actualizada", description: "Los colores personalizados han sido aplicados." });
  };
  
  const applyAdvancedCss = () => {
    setRawCss({ raw: tempRawCss });
    toast({ title: "CSS Aplicado", description: "El estilo CSS personalizado ha sido aplicado." });
  };
  
  const handleReset = () => {
      resetCustomTheme();
      setTimeout(() => {
        setTempColors({
          primary: getCssVariableValue('--primary'),
          background: getCssVariableValue('--background'),
          accent: getCssVariableValue('--accent'),
          foreground: getCssVariableValue('--foreground'),
        });
      }, 50);
      setTempRawCss('');
      toast({ title: "Personalización Restaurada", description: "Se han eliminado todos los estilos personalizados." });
  };

  const ColorInput = ({ label, id, value, onHslStringChange, onHexChange }: { label: string, id: string, value: string, onHslStringChange: (hslString: string) => void, onHexChange: (hex: string) => void }) => {
    const isValueValid = isValidHslString(value);
    const colorStyle = isValueValid ? `hsl(${value})` : 'transparent';
    const hexValue = isValueValid ? hslStringToHex(value) : '#000000';
    
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex items-center gap-2">
          <Input 
            id={id} 
            value={value} 
            onChange={e => onHslStringChange(e.target.value)} 
            placeholder="Ej: 338 80% 65%" 
            className="font-mono"
          />
          <Input 
            type="color" 
            value={hexValue}
            onChange={e => onHexChange(e.target.value)}
            className="h-9 w-10 shrink-0 rounded-md p-1 border-2 cursor-pointer"
            style={{
                backgroundColor: colorStyle,
                borderColor: isValueValid ? 'hsl(var(--border))' : 'hsl(var(--destructive))',
            }}
            aria-label={`Selector de color para ${label}`}
          />
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-lg sm:max-w-xl p-0 flex flex-col z-[250]">
        <SheetHeader className="p-4 pb-3 border-b">
          <SheetTitle>Configuración Global</SheetTitle>
          <SheetDescription>
            Ajusta las opciones de la aplicación. Los cambios se guardarán para tus futuras visitas.
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="appearance" className="flex-grow flex flex-col">
          <TabsList className="m-4 mx-auto">
            <TabsTrigger value="appearance"><Palette className="mr-2" />Apariencia</TabsTrigger>
            <TabsTrigger value="translation"><Languages className="mr-2" />Traducción</TabsTrigger>
            <TabsTrigger value="advanced-css"><Code className="mr-2" />CSS Avanzado</TabsTrigger>
          </TabsList>
          
          <div className="flex-grow overflow-y-auto">
            <TabsContent value="appearance" className="m-0 p-4 space-y-6">
              <h3 className="font-semibold text-lg">Colores del Tema</h3>
              <p className="text-sm text-muted-foreground -mt-4">
                Personaliza los colores principales de la interfaz. Usa el selector de color o introduce valores HSL (ej: <code className="bg-muted px-1 py-0.5 rounded">240 10% 3.9%</code>).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <ColorInput label="Primario" id="primary-color" value={tempColors.primary} onHslStringChange={hsl => handleColorChange('primary', hsl)} onHexChange={hex => handleColorChange('primary', hexToHslString(hex))} />
                 <ColorInput label="Fondo" id="background-color" value={tempColors.background} onHslStringChange={hsl => handleColorChange('background', hsl)} onHexChange={hex => handleColorChange('background', hexToHslString(hex))} />
                 <ColorInput label="Acento" id="accent-color" value={tempColors.accent} onHslStringChange={hsl => handleColorChange('accent', hsl)} onHexChange={hex => handleColorChange('accent', hexToHslString(hex))} />
                 <ColorInput label="Texto Principal" id="foreground-color" value={tempColors.foreground} onHslStringChange={hsl => handleColorChange('foreground', hsl)} onHexChange={hex => handleColorChange('foreground', hexToHslString(hex))} />
              </div>
              <Button onClick={applyThemeChanges} className="w-full">Aplicar Colores</Button>
            </TabsContent>
            
            <TabsContent value="translation" className="m-0 p-4 space-y-6">
               <h3 className="font-semibold text-lg">Traducción Automática</h3>
               <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                        <Label htmlFor="auto-translate-switch" className="font-medium">Habilitar traducción automática</Label>
                        <p className="text-sm text-muted-foreground">Traduce automáticamente los capítulos al idioma que elijas.</p>
                    </div>
                    <Switch
                        id="auto-translate-switch"
                        checked={autoTranslate}
                        onCheckedChange={setAutoTranslate}
                    />
               </div>
               {autoTranslate && (
                 <div className="space-y-2">
                    <Label htmlFor="auto-translate-lang">Idioma de destino</Label>
                    <Select value={autoTranslateLanguage} onValueChange={val => setAutoTranslateLanguage(val as TargetLanguage)}>
                        <SelectTrigger id="auto-translate-lang">
                            <SelectValue placeholder="Selecciona un idioma..." />
                        </SelectTrigger>
                        <SelectContent>
                            {TARGET_LANGUAGES.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
               )}
            </TabsContent>

            <TabsContent value="advanced-css" className="m-0 p-4 space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>¡Zona para Expertos!</AlertTitle>
                <AlertDescription>
                  Esta opción es para usuarios que saben CSS. Estilos incorrectos pueden romper la apariencia del sitio. Úsalo bajo tu propio riesgo.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="predefined-themes-select">Cargar Tema Prediseñado</Label>
                <Select onValueChange={(value) => {
                    const selectedTheme = predefinedThemes.find(t => t.value === value);
                    setTempRawCss(selectedTheme ? selectedTheme.css : '');
                  }}>
                    <SelectTrigger id="predefined-themes-select">
                        <SelectValue placeholder="Selecciona un tema para empezar..." />
                    </SelectTrigger>
                    <SelectContent>
                        {predefinedThemes.map(theme => (
                            <SelectItem key={theme.name} value={theme.value}>{theme.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="raw-css-input">Editor de CSS Personalizado</Label>
                <Textarea 
                    id="raw-css-input"
                    value={tempRawCss}
                    onChange={(e) => setTempRawCss(e.target.value)}
                    placeholder="/* Escribe tu CSS aquí. Ejemplo: */
body {
  text-transform: uppercase !important;
}"
                    className="font-mono h-64"
                />
              </div>
               <Button onClick={applyAdvancedCss} className="w-full">Aplicar CSS</Button>
            </TabsContent>
          </div>
        </Tabs>
        <SheetFooter className="p-4 border-t flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={handleReset}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Restaurar Personalización
            </Button>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
