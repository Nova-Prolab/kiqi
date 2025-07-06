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

const getCssVariableValue = (variable: string) => {
    if (typeof window === 'undefined') return '';
    // This function will now run only on client, so window is safe
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

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

  useEffect(() => {
    if (isOpen) {
      // When opening, initialize temp state from context or computed styles
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
    setColors({
        primary: tempColors.primary,
        background: tempColors.background,
        accent: tempColors.accent,
        foreground: tempColors.foreground
    });
    toast({ title: "Apariencia Actualizada", description: "Los colores personalizados han sido aplicados." });
  };
  
  const applyAdvancedCss = () => {
    setRawCss({ raw: tempRawCss });
    toast({ title: "CSS Aplicado", description: "El estilo CSS personalizado ha sido aplicado." });
  };
  
  const handleReset = () => {
      resetCustomTheme();
      // After resetting, we need to read the default values from the DOM again
      // a slight delay might be needed for styles to re-apply from CSS file
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
                Personaliza los colores principales de la interfaz. Introduce los valores HSL sin paréntesis (ej: <code className="bg-muted px-1 py-0.5 rounded">240 10% 3.9%</code>).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="primary-color">Primario</Label>
                    <Input id="primary-color" value={tempColors.primary} onChange={e => handleColorChange('primary', e.target.value)} placeholder="Ej: 338 80% 65%"/>
                 </div>
                 <div>
                    <Label htmlFor="background-color">Fondo</Label>
                    <Input id="background-color" value={tempColors.background} onChange={e => handleColorChange('background', e.target.value)} placeholder="Ej: 0 0% 98%"/>
                 </div>
                 <div>
                    <Label htmlFor="accent-color">Acento</Label>
                    <Input id="accent-color" value={tempColors.accent} onChange={e => handleColorChange('accent', e.target.value)} placeholder="Ej: 58 85% 60%"/>
                 </div>
                 <div>
                    <Label htmlFor="foreground-color">Texto Principal</Label>
                    <Input id="foreground-color" value={tempColors.foreground} onChange={e => handleColorChange('foreground', e.target.value)} placeholder="Ej: 240 10% 20%"/>
                 </div>
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
                <Label htmlFor="raw-css-input">Editor de CSS Personalizado</Label>
                <Textarea 
                    id="raw-css-input"
                    value={tempRawCss}
                    onChange={(e) => setTempRawCss(e.target.value)}
                    placeholder=".mi-clase-personalizada { color: red !important; }"
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
