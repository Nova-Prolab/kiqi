
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Palette, Languages, Code, AlertTriangle, RefreshCcw, Download as ImportIcon, Share as ExportIcon, ClipboardCopy, Check } from 'lucide-react';
import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import { useCustomTheme, type CustomColors, type CustomThemeData } from '@/contexts/CustomThemeContext';
import { TARGET_LANGUAGES, type TargetLanguage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

interface GlobalSettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// --- Helper Functions for Color Conversion ---
const isValidHslString = (hslString: string): boolean => {
  if (typeof hslString !== 'string' || !hslString) return false;
  const hslRegex = /^\s*(-?\d*\.?\d+)(deg|rad|turn)?\s+(-?\d*\.?\d+)%\s+(-?\d*\.?\d+)%\s*$/;
  return hslRegex.test(hslString);
}

const hslStringToHex = (hslStr: string): string => {
  if (!isValidHslString(hslStr)) return '#000000';

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

// --- PREDEFINED THEMES ---
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
    :root.dark, :root {
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
    :root.dark, :root {
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
    :root.dark, :root {
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
    :root.dark, :root {
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
    :root.dark, :root {
      --background: 0 0% 16% !important;
      --foreground: 45 52% 86% !important;
      --primary: 26 98% 55% !important;
      --primary-foreground: 0 0% 16% !important;
      --card: 0 0% 22% !important;
      --border: 0 0% 31% !important;
      --accent: 40 82% 64% !important;
    }
  `},
  { name: 'País de las Maravillas Invernal ⛄', value: 'winter-wonderland', css: `
    :root {
      --background: 210 40% 96% !important;
      --foreground: 215 28% 25% !important;
      --primary: 205 78% 55% !important;
      --primary-foreground: 0 0% 100% !important;
      --card: 210 40% 100% !important;
      --border: 214 32% 91% !important;
      --accent: 190 95% 68% !important;
    }
  `},
  { name: 'Nieve Cayendo 🌨️', value: 'falling-snow', css: `
    @keyframes snow-fall-1 { 0% { transform: translateY(-100vh); } 100% { transform: translateY(100vh); } }
    @keyframes snow-fall-2 { 0% { transform: translateY(-100vh); } 100% { transform: translateY(100vh); } }
    body { 
        position: relative;
        overflow-x: hidden !important; 
        background-color: #3e5c76 !important;
    }
    body::before, body::after {
        content: '';
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        background-repeat: repeat;
        z-index: 1000;
        opacity: 0.8;
    }
    body::before {
        background-image: radial-gradient(circle, white 1px, transparent 1.5px);
        background-size: 30px 30px;
        animation: snow-fall-1 25s linear infinite;
    }
    body::after {
        background-image: radial-gradient(circle, white 2px, transparent 2.5px);
        background-size: 70px 70px;
        animation: snow-fall-2 18s linear infinite;
        animation-delay: -7s;
    }
    :root.dark, :root {
        --background: 210 26% 23% !important;
        --foreground: 210 40% 98% !important;
        --primary: 190 95% 68% !important;
        --primary-foreground: 210 26% 15% !important;
        --card: 210 26% 28% !important;
        --border: 210 26% 40% !important;
        --accent: 190 95% 68% !important;
    }
  `},
  { name: 'Brillo del Atardecer 🌇', value: 'sunset-glow', css: `
    :root {
      --background: 25 56% 92% !important;
      --foreground: 20 20% 25% !important;
      --primary: 350 80% 60% !important;
      --primary-foreground: 0 0% 100% !important;
      --card: 15 60% 97% !important;
      --border: 10 40% 85% !important;
      --accent: 25 95% 60% !important;
    }
    body {
      background: linear-gradient(to top, #fddb92, #d1fdff) !important;
    }
  `},
  { name: 'Sueño de Sakura 🌸', value: 'sakura-dream', css: `
    :root {
      --background: 340 100% 98% !important;
      --foreground: 340 30% 30% !important;
      --primary: 335 85% 70% !important;
      --primary-foreground: 340 100% 10% !important;
      --card: 0 0% 100% !important;
      --border: 340 50% 90% !important;
      --accent: 280 60% 75% !important;
    }
  `},
  { name: 'Outrun 🚗', value: 'outrun', css: `
    :root.dark, :root {
      --background: 260 50% 10% !important;
      --foreground: 240 20% 90% !important;
      --primary: 320 100% 55% !important;
      --primary-foreground: 0 0% 100% !important;
      --card: 260 50% 15% !important;
      --border: 320 100% 30% !important;
      --accent: 195 100% 50% !important;
    }
    body {
      background: #1a0629 !important;
    }
    h1, h2, h3, h4, button, .text-primary {
      text-shadow: 0 0 5px hsl(var(--primary)), 0 0 10px hsl(var(--primary));
    }
  `},
  { name: 'Océano Profundo 🌊', value: 'deep-ocean', css: `
    :root.dark, :root {
      --background: 210 50% 10% !important;
      --foreground: 190 30% 85% !important;
      --primary: 180 90% 50% !important;
      --primary-foreground: 210 50% 5% !important;
      --card: 210 50% 15% !important;
      --border: 200 40% 25% !important;
      --accent: 170 100% 65% !important;
    }
  `},
  { name: 'Vibras de la Selva 🌴', value: 'jungle-vibes', css: `
    :root.dark, :root {
      --background: 100 20% 20% !important;
      --foreground: 80 25% 85% !important;
      --primary: 75 70% 45% !important;
      --primary-foreground: 90 60% 10% !important;
      --card: 100 20% 25% !important;
      --border: 90 15% 35% !important;
      --accent: 40 80% 60% !important;
    }
  `},
  { name: 'Cafetería ☕', value: 'coffee-house', css: `
    :root {
      --background: 25 35% 92% !important;
      --foreground: 25 25% 25% !important;
      --primary: 30 40% 40% !important;
      --primary-foreground: 25 35% 95% !important;
      --card: 25 45% 98% !important;
      --border: 25 30% 85% !important;
      --accent: 20 60% 55% !important;
    }
  `},
  { name: 'Mono Noir 🎥', value: 'mono-noir', css: `
    :root.dark, :root {
      --background: 0 0% 10% !important;
      --foreground: 0 0% 95% !important;
      --primary: 0 0% 90% !important;
      --primary-foreground: 0 0% 5% !important;
      --card: 0 0% 15% !important;
      --border: 0 0% 30% !important;
      --accent: 0 0% 70% !important;
    }
    body {
      filter: grayscale(1);
    }
  `},
  { name: 'Art Deco Dorado ✨', value: 'golden-deco', css: `
    :root.dark, :root {
      --background: 0 0% 8% !important;
      --foreground: 45 30% 85% !important;
      --primary: 45 80% 60% !important;
      --primary-foreground: 0 0% 5% !important;
      --card: 0 0% 12% !important;
      --border: 45 50% 30% !important;
      --accent: 40 70% 70% !important;
    }
  `},
  { name: 'Sueño Pastel 🍭', value: 'pastel-dream', css: `
    :root {
      --background: 200 40% 95% !important;
      --foreground: 250 20% 40% !important;
      --primary: 320 80% 80% !important;
      --primary-foreground: 320 30% 20% !important;
      --card: 0 0% 100% !important;
      --border: 270 30% 90% !important;
      --accent: 170 70% 75% !important;
    }
  `},
  { name: 'Libro de Cómics 💥', value: 'comic-book', css: `
    :root {
      --background: 50 100% 95% !important;
      --foreground: 220 80% 20% !important;
      --primary: 0 85% 55% !important;
      --primary-foreground: 0 0% 100% !important;
      --card: 0 0% 100% !important;
      --border: 220 80% 20% !important;
      --accent: 45 100% 50% !important;
    }
    body {
        font-family: 'Comic Sans MS', 'Bangers', cursive !important;
    }
    .card, button, input, select, textarea {
        border-width: 2px !important;
        border-color: hsl(var(--foreground)) !important;
        box-shadow: 2px 2px 0px hsl(var(--foreground)) !important;
    }
  `},
  { name: 'Fuego y Hielo 🔥❄️', value: 'fire-and-ice', css: `
    :root.dark, :root {
      --background: 220 30% 15% !important;
      --foreground: 210 20% 90% !important;
      --primary: 15 90% 55% !important;
      --primary-foreground: 0 0% 100% !important;
      --card: 220 30% 20% !important;
      --border: 210 20% 40% !important;
      --accent: 190 100% 60% !important;
    }
  `},
  { name: 'Steampunk ⚙️', value: 'steampunk-gear', css: `
    :root {
      --background: 30 25% 85% !important;
      --foreground: 30 30% 20% !important;
      --primary: 35 60% 45% !important;
      --primary-foreground: 30 25% 95% !important;
      --card: 35 30% 92% !important;
      --border: 30 35% 60% !important;
      --accent: 190 40% 50% !important;
    }
  `},
  { name: 'Púrpura Real 👑', value: 'royal-purple', css: `
    :root.dark, :root {
      --background: 270 30% 15% !important;
      --foreground: 270 20% 90% !important;
      --primary: 265 80% 70% !important;
      --primary-foreground: 270 30% 10% !important;
      --card: 270 30% 20% !important;
      --border: 270 20% 40% !important;
      --accent: 50 80% 65% !important;
    }
  `},
  { name: 'Menta con Chocolate 🍦', value: 'mint-chip', css: `
    :root {
      --background: 150 40% 95% !important;
      --foreground: 25 40% 20% !important;
      --primary: 25 40% 30% !important;
      --primary-foreground: 150 40% 95% !important;
      --card: 0 0% 100% !important;
      --border: 150 20% 85% !important;
      --accent: 150 70% 60% !important;
    }
  `},
  { name: 'Oasis del Desierto 🏜️', value: 'desert-oasis', css: `
    :root {
      --background: 35 60% 90% !important;
      --foreground: 25 40% 25% !important;
      --primary: 200 80% 45% !important;
      --primary-foreground: 0 0% 100% !important;
      --card: 40 50% 95% !important;
      --border: 35 40% 80% !important;
      --accent: 30 90% 60% !important;
    }
  `},
  { name: 'Aventura 8-bit 👾', value: '8-bit-adventure', css: `
    :root.dark, :root {
      --background: 220 30% 10% !important;
      --foreground: 0 0% 95% !important;
      --primary: 50 100% 50% !important;
      --primary-foreground: 220 30% 10% !important;
      --card: 220 30% 15% !important;
      --border: 0 0% 95% !important;
      --accent: 0 80% 60% !important;
    }
    body {
        font-family: 'Press Start 2P', 'VT323', monospace !important;
    }
  `},
  { name: 'Temporada de Miedo 🎃', value: 'spooky-season', css: `
    :root.dark, :root {
      --background: 25 10% 10% !important;
      --foreground: 30 80% 90% !important;
      --primary: 25 90% 55% !important;
      --primary-foreground: 25 10% 5% !important;
      --card: 25 10% 15% !important;
      --border: 25 15% 30% !important;
      --accent: 270 80% 65% !important;
    }
  `},
  { name: 'Algodón de Azúcar 🍬', value: 'cotton-candy', css: `
    :root {
      --background: 0 0% 100% !important;
      --foreground: 230 40% 30% !important;
      --primary: 330 100% 85% !important;
      --primary-foreground: 330 50% 25% !important;
      --card: 200 100% 98% !important;
      --border: 200 70% 90% !important;
      --accent: 200 100% 80% !important;
    }
    body {
      background: linear-gradient(135deg, #ffc3e1, #cdefff) !important;
    }
  `},
  { name: 'Limonada de Fresa 🍓', value: 'strawberry-lemonade', css: `
    :root {
      --background: 50 100% 97% !important;
      --foreground: 350 50% 40% !important;
      --primary: 350 90% 65% !important;
      --primary-foreground: 0 0% 100% !important;
      --card: 0 0% 100% !important;
      --border: 10 70% 90% !important;
      --accent: 50 100% 60% !important;
    }
  `},
];

// --- MAIN COMPONENT ---
export default function GlobalSettingsSheet({ isOpen, onOpenChange }: GlobalSettingsSheetProps) {
  const { 
    autoTranslate, setAutoTranslate, 
    autoTranslateLanguage, setAutoTranslateLanguage 
  } = useReaderSettings();
  
  const { 
    colors, setColors, 
    rawCss, setRawCss,
    resetCustomTheme,
    exportTheme,
    importTheme,
  } = useCustomTheme();

  const { toast } = useToast();
  
  const [tempColors, setTempColors] = useState<CustomColors>({});
  const [tempRawCss, setTempRawCss] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [importJsonString, setImportJsonString] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  // Helper to get computed style for defaults
  const getCssVariableValue = (variable: string) => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  };
  
  const allColorKeys: (keyof CustomColors)[] = [
    'background', 'foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
    'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'ring',
    'card', 'card-foreground', 'popover', 'popover-foreground', 'border', 'input', 'muted', 'muted-foreground'
  ];

  // Populate temp state when sheet opens
  useEffect(() => {
    if (isOpen) {
      const currentComputedColors: CustomColors = {};
      
      // This ensures we get the "live" values from the DOM
      for (const key of allColorKeys) {
        currentComputedColors[key as keyof CustomColors] = getCssVariableValue(`--${key}`);
      }
      
      setTempColors({ ...currentComputedColors, ...colors });
      setTempRawCss(rawCss.raw || '');
    }
  }, [isOpen, colors, rawCss]);

  const handleColorChange = (colorName: keyof CustomColors, value: string) => {
    setTempColors(prev => ({ ...prev, [colorName]: value }));
  };
  
  const applyThemeChanges = () => {
    const validColors: CustomColors = {};
    for (const [key, value] of Object.entries(tempColors)) {
      if (isValidHslString(value)) {
        validColors[key as keyof CustomColors] = value;
      }
    }
    setColors(validColors);
    toast({ title: "Apariencia Actualizada", description: "Los colores personalizados han sido aplicados." });
  };
  
  const applyAdvancedCss = () => {
    setRawCss({ raw: tempRawCss });
    toast({ title: "CSS Aplicado", description: "El estilo CSS personalizado ha sido aplicado." });
  };
  
  const handleReset = (options: { colors?: boolean, css?: boolean }) => {
      resetCustomTheme(options);
      
      // We need a slight delay to let the CSS variables reset in the DOM before reading them again
      setTimeout(() => {
        if(options.colors) {
            const defaultComputedColors: CustomColors = {};
            allColorKeys.forEach(key => {
                 defaultComputedColors[key] = getCssVariableValue(`--${key}`);
            });
            setTempColors(defaultComputedColors);
        }
        if(options.css) {
            setTempRawCss('');
        }
      }, 50);

      toast({ title: "Personalización Restaurada", description: "Se han restaurado las opciones seleccionadas." });
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJsonString);
      if (typeof parsed !== 'object' || parsed === null || parsed.version !== 1) {
        throw new Error("Formato JSON inválido o versión no compatible.");
      }
      importTheme(parsed as CustomThemeData);
      toast({ title: "Tema Importado", description: "El tema se ha aplicado correctamente." });
      setIsImportDialogOpen(false);
      setImportJsonString('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error al Importar", description: e.message || "Por favor, comprueba el texto del tema." });
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  // --- SUB COMPONENTS ---

  const ColorInput = ({ label, id, value, onHslStringChange, onHexChange }: { label: string, id: keyof CustomColors, value: string, onHslStringChange: (hslString: string) => void, onHexChange: (hex: string) => void }) => {
    const isValueValid = isValidHslString(value);
    const colorStyle = isValueValid ? `hsl(${value})` : 'transparent';
    const hexValue = isValueValid ? hslStringToHex(value) : '#000000';
    
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="capitalize">{label.replace(/-/g, ' ')}</Label>
        <div className="flex items-center gap-2">
          <Input 
            id={id} 
            value={value || ''} 
            onChange={e => onHslStringChange(e.target.value)} 
            placeholder="Ej: 338 80% 65%" 
            className="font-mono text-xs h-9"
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

  const colorFields: { group: string, fields: (keyof CustomColors)[] }[] = [
      {
        group: 'Paleta Principal',
        fields: ['background', 'foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground']
      },
      {
        group: 'Acentos y Estados',
        fields: ['accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'ring']
      },
      {
        group: 'Componentes y Bordes',
        fields: ['card', 'card-foreground', 'popover', 'popover-foreground', 'border', 'input', 'muted', 'muted-foreground']
      }
  ];

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
            <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" />Apariencia</TabsTrigger>
            <TabsTrigger value="translation"><Languages className="mr-2 h-4 w-4" />Traducción</TabsTrigger>
            <TabsTrigger value="advanced-css"><Code className="mr-2 h-4 w-4" />CSS Avanzado</TabsTrigger>
          </TabsList>
          
          <div className="flex-grow overflow-y-auto px-4">
            <TabsContent value="appearance" className="m-0 space-y-6">
              <p className="text-sm text-muted-foreground">
                Personaliza los colores de la interfaz. Usa el selector de color o introduce valores HSL (ej: <code className="bg-muted px-1 py-0.5 rounded">240 10% 3.9%</code>).
              </p>
              <Accordion type="multiple" defaultValue={['item-0']} className="w-full">
                {colorFields.map((group, index) => (
                    <AccordionItem value={`item-${index}`} key={group.group}>
                        <AccordionTrigger className="text-base">{group.group}</AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 pt-2">
                                {group.fields.map(field => (
                                    <ColorInput 
                                        key={field} 
                                        label={field} 
                                        id={field} 
                                        value={tempColors[field] || ''} 
                                        onHslStringChange={hsl => handleColorChange(field, hsl)} 
                                        onHexChange={hex => handleColorChange(field, hexToHslString(hex))} 
                                    />
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>

              <Button onClick={applyThemeChanges} className="w-full">Aplicar Colores Personalizados</Button>

              <Separator />

              <div className="space-y-3 text-center">
                <h4 className="font-semibold text-foreground">Gestionar Tema</h4>
                <p className="text-sm text-muted-foreground">Guarda o carga tu configuración de apariencia personalizada (colores + CSS).</p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}><ImportIcon className="mr-2 h-4 w-4"/> Importar</Button>
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}><ExportIcon className="mr-2 h-4 w-4"/> Exportar</Button>
                </div>
              </div>

            </TabsContent>
            
            <TabsContent value="translation" className="m-0 space-y-6">
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

            <TabsContent value="advanced-css" className="m-0 space-y-4">
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
                    setTempRawCss(selectedTheme ? selectedTheme.css.trim() : '');
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
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Restaurar...
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleReset({ colors: true })}>
                        Restaurar Colores
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleReset({ css: true })}>
                        Restaurar CSS
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleReset({ colors: true, css: true })} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        Restaurar Todo
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </SheetFooter>
      </SheetContent>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Importar Tema</DialogTitle>
                  <DialogDescription>Pega el texto del tema (JSON) en el campo de abajo para aplicarlo.</DialogDescription>
              </DialogHeader>
              <Textarea 
                placeholder='Pega aquí el JSON de tu tema...'
                value={importJsonString}
                onChange={(e) => setImportJsonString(e.target.value)}
                className="font-mono h-48"
              />
              <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsImportDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleImport}>Importar y Aplicar Tema</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Exportar Tema</DialogTitle>
                  <DialogDescription>Copia este texto y guárdalo. Puedes importarlo más tarde o compartirlo.</DialogDescription>
              </DialogHeader>
              <Textarea 
                value={JSON.stringify(exportTheme(), null, 2)}
                readOnly
                className="font-mono h-48 bg-muted"
              />
              <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cerrar</Button>
                  </DialogClose>
                  <Button onClick={() => handleCopyToClipboard(JSON.stringify(exportTheme(), null, 2))}>
                      {hasCopied ? <Check className="mr-2 h-4 w-4"/> : <ClipboardCopy className="mr-2 h-4 w-4"/>}
                      {hasCopied ? 'Copiado' : 'Copiar al Portapapeles'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </Sheet>
  );
}
