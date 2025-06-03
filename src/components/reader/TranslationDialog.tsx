
'use client';

import { useState, useEffect, useMemo } from 'react';
import { translateChapterAction } from '@/actions/translationActions';
import { TARGET_LANGUAGES, type TargetLanguage } from '@/ai/flows/translate-chapter-flow';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, Languages, CheckCircle, RotateCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

interface TranslationDialogProps {
  originalHtmlContent: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApplyTranslation: (translatedHtml: string) => void;
  onRevertToOriginal: () => void;
  isCurrentlyTranslated: boolean;
}

export default function TranslationDialog({
  originalHtmlContent,
  isOpen,
  onOpenChange,
  onApplyTranslation,
  onRevertToOriginal,
  isCurrentlyTranslated,
}: TranslationDialogProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<TargetLanguage | ''>('');
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedTranslation, setHasAttemptedTranslation] = useState(false);

  const handleTranslate = async () => {
    if (!selectedLanguage || !originalHtmlContent) {
      setError("Por favor, selecciona un idioma de destino.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranslatedContent(null);
    setHasAttemptedTranslation(true);

    const result = await translateChapterAction(originalHtmlContent, selectedLanguage);
    if (result.translatedContent) {
      setTranslatedContent(result.translatedContent);
    } else {
      setError(result.error || 'Falló la traducción del contenido.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes, except selected language for convenience
      // setTranslatedContent(null); // Keep translated content if user wants to re-apply
      // setIsLoading(false);
      // setError(null);
      // setHasAttemptedTranslation(false);
    }
  }, [isOpen]);

  const handleApplyAndClose = () => {
    if (translatedContent) {
      onApplyTranslation(translatedContent);
      onOpenChange(false);
    }
  };
  
  const handleRevertAndClose = () => {
    onRevertToOriginal();
    onOpenChange(false);
  };

  const title = "Traducir Capítulo con Gemini";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] md:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Languages className="mr-2 h-6 w-6"/> {title}
          </DialogTitle>
          <DialogDescription>
            Traduce el contenido del capítulo a otro idioma usando IA. La calidad puede variar.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 flex-grow min-h-[250px] flex flex-col overflow-hidden">
          <div className="space-y-2">
            <Label htmlFor="target-language-select">Selecciona Idioma de Destino:</Label>
            <Select
              value={selectedLanguage}
              onValueChange={(value) => setSelectedLanguage(value as TargetLanguage | '')}
              disabled={isLoading}
            >
              <SelectTrigger id="target-language-select" className="w-full">
                <SelectValue placeholder="Elige un idioma..." />
              </SelectTrigger>
              <SelectContent>
                {TARGET_LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!hasAttemptedTranslation && !isLoading && !isCurrentlyTranslated && (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <Languages className="h-16 w-16 text-primary/70 mb-4" />
                <p className="text-lg font-medium mb-2">¿Listo para traducir?</p>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                  Selecciona un idioma y Gemini intentará traducir el capítulo.
                </p>
                <Button onClick={handleTranslate} disabled={isLoading || !selectedLanguage} size="lg">
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-5 w-5" />}
                 Traducir a {selectedLanguage || "..."}
               </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center space-y-3 p-4 text-center">
              <div className="relative mb-2">
                <Languages className="h-20 w-20 text-primary animate-pulse opacity-50" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary animate-spin" />
              </div>
              <p className="text-xl font-semibold text-primary">Gemini está traduciendo...</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                Convirtiendo el texto a {selectedLanguage}. Este proceso puede tardar unos segundos.
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center text-destructive p-4 bg-destructive/10 rounded-md text-center">
              <AlertTriangle className="h-10 w-10 mb-3" />
              <p className="text-lg font-semibold">Error al Traducir</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={handleTranslate} variant="outline" className="mt-4" disabled={!selectedLanguage}>
                <Languages className="mr-2 h-4 w-4" />
                 Reintentar Traducción
              </Button>
            </div>
          )}

          {translatedContent && !isLoading && !error && (
            <ScrollArea className="flex-grow rounded-md border p-4 prose prose-sm sm:prose md:prose-lg max-w-none bg-muted/20 shadow-inner">
              <div dangerouslySetInnerHTML={{ __html: translatedContent }} />
            </ScrollArea>
          )}
          
          {isCurrentlyTranslated && !isLoading && !error && !translatedContent && (
             <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <RotateCcw className="h-16 w-16 text-primary/70 mb-4" />
                <p className="text-lg font-medium mb-2">Viendo traducción.</p>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                  Puedes volver al original o seleccionar otro idioma para traducir de nuevo.
                </p>
            </div>
          )}

        </div>

        <DialogFooter className="gap-2 sm:justify-between mt-auto pt-4 border-t flex-wrap">
          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
            {isCurrentlyTranslated && (
              <Button onClick={handleRevertAndClose} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Volver al Original
              </Button>
            )}
             <Button 
                onClick={handleTranslate} 
                variant={(translatedContent || error || isCurrentlyTranslated) ? "secondary" : "default"}
                disabled={isLoading || !selectedLanguage}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                {hasAttemptedTranslation || error ? 'Regenerar' : 'Traducir'}
              </Button>
          </div>
          <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
            {translatedContent && !isLoading && !error && (
              <Button onClick={handleApplyAndClose} variant="default">
                <CheckCircle className="mr-2 h-4 w-4" />
                Aplicar Traducción
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)} variant="secondary">Cerrar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

