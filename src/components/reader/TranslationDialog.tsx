
'use client';

import { useState, useEffect, useMemo } from 'react';
import { translateChapterAction } from '@/actions/translationActions';
import type { TranslateChapterInput } from '@/ai/flows/translate-chapter-flow';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, Languages, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TranslationDialogProps {
  originalHtmlContent: string;
  targetLanguage: TranslateChapterInput['targetLanguage'] | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLanguageChangeRequest: () => void;
  onApplyTranslation: (translatedHtml: string) => void;
}

export default function TranslationDialog({
  originalHtmlContent,
  targetLanguage,
  isOpen,
  onOpenChange,
  onLanguageChangeRequest,
  onApplyTranslation
}: TranslationDialogProps) {
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!targetLanguage || !originalHtmlContent) return;

    setIsLoading(true);
    setError(null);
    setTranslatedContent(null);

    const result = await translateChapterAction(originalHtmlContent, targetLanguage);
    if (result.translatedContent) {
      setTranslatedContent(result.translatedContent);
    } else {
      setError(result.error || 'Failed to translate content.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && targetLanguage && originalHtmlContent) {
      handleTranslate();
    } else if (!isOpen) {
      // Do not clear translatedContent here to allow quick reopen
      setIsLoading(false);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, targetLanguage, originalHtmlContent]); // handleTranslate is memoized by useCallback implicitly if not defined inside useEffect

  const handleApplyAndClose = () => {
    if (translatedContent) {
      onApplyTranslation(translatedContent);
      onOpenChange(false);
    }
  };

  const title = useMemo(() => {
    if (!targetLanguage) return "Traducir Capítulo";
    return `Traducción del Capítulo (a ${targetLanguage})`;
  }, [targetLanguage]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] md:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Languages className="mr-2 h-6 w-6"/> {title}
          </DialogTitle>
          {targetLanguage && (
            <DialogDescription>
              Traducción generada por IA del capítulo actual a {targetLanguage}. Se intenta preservar el formato HTML.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4 space-y-4 flex-grow min-h-[250px] flex flex-col overflow-hidden">
          {isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center space-y-3 p-4 text-center">
              <div className="relative mb-2">
                <Languages className="h-20 w-20 text-primary animate-pulse opacity-50" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary animate-spin" />
              </div>
              <p className="text-xl font-semibold text-primary">Gemini está traduciendo...</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                Convirtiendo el texto a {targetLanguage}. Este proceso puede tardar unos segundos.
              </p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center text-destructive p-4 bg-destructive/10 rounded-md text-center">
              <AlertTriangle className="h-10 w-10 mb-3" />
              <p className="text-lg font-semibold">Error al Traducir Capítulo</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={handleTranslate} variant="outline" className="mt-4">
                <Languages className="mr-2 h-4 w-4" />
                 Reintentar Traducción
              </Button>
            </div>
          )}
          {translatedContent && !isLoading && (
            <ScrollArea className="flex-grow rounded-md border p-4 prose prose-sm sm:prose md:prose-lg max-w-none bg-muted/20 shadow-inner">
              <div dangerouslySetInnerHTML={{ __html: translatedContent }} />
            </ScrollArea>
          )}
          {!targetLanguage && !isLoading && !error && (
             <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <Languages className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Selecciona un Idioma</p>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                  Por favor, elige un idioma de destino para iniciar la traducción del capítulo.
                </p>
                <Button onClick={onLanguageChangeRequest} variant="default" size="lg">
                   Elegir Idioma de Traducción
                </Button>
             </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between mt-auto pt-4 border-t flex-wrap">
          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
            {targetLanguage && (hasAttemptedGeneration || error) && !isLoading && (
              <Button onClick={handleTranslate} variant="outline" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                {error ? 'Reintentar' : 'Regenerar Traducción'}
              </Button>
            )}
            {targetLanguage && (
                <Button onClick={onLanguageChangeRequest} variant="secondary">
                    Cambiar Idioma
                </Button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
            {translatedContent && !isLoading && !error && (
              <Button onClick={handleApplyAndClose} variant="default">
                <CheckCircle className="mr-2 h-4 w-4" />
                Aplicar Traducción
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)} variant={(!targetLanguage || (error && !isLoading)) ? "default" : "secondary"}>Cerrar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
