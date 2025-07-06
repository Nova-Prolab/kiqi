'use client';

import { useState, useEffect } from 'react';
import { translateChapterAction } from '@/actions/translationActions';
import { TARGET_LANGUAGES, type TargetLanguage } from '@/lib/types';
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

  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow for closing animation and prevent content flash
      const timer = setTimeout(() => {
        setTranslatedContent(null);
        setError(null);
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleTranslate = async () => {
    if (!selectedLanguage) {
      setError("Por favor, selecciona un idioma de destino.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setTranslatedContent(null);
    const result = await translateChapterAction(originalHtmlContent, selectedLanguage);
    if (result.translatedContent) {
      setTranslatedContent(result.translatedContent);
    } else {
      setError(result.error || 'Falló la traducción del contenido.');
    }
    setIsLoading(false);
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Languages className="mr-2 h-6 w-6"/> Traducir Capítulo (IA)
          </DialogTitle>
          <DialogDescription>
            Traduce el contenido a otro idioma usando IA. La calidad y el formato pueden variar.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 flex-grow min-h-[300px] flex flex-col">
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <Label htmlFor="target-language-select" className="sm:sr-only">Idioma:</Label>
            <Select
              value={selectedLanguage}
              onValueChange={(value) => setSelectedLanguage(value as TargetLanguage | '')}
              disabled={isLoading}
            >
              <SelectTrigger id="target-language-select" className="flex-grow">
                <SelectValue placeholder="Elige un idioma de destino..." />
              </SelectTrigger>
              <SelectContent>
                {TARGET_LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleTranslate} disabled={isLoading || !selectedLanguage} className="w-full sm:w-auto flex-shrink-0">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
              Traducir
            </Button>
          </div>

          <div className="flex-grow flex flex-col justify-center items-center border rounded-md p-2 bg-muted/20">
            {isLoading ? (
              <div className="text-center space-y-2">
                <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
                <p className="font-semibold text-primary">Traduciendo a {selectedLanguage}...</p>
                <p className="text-xs text-muted-foreground">Este proceso puede tardar unos segundos.</p>
              </div>
            ) : error ? (
              <div className="text-center text-destructive p-4">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Error al Traducir</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : translatedContent ? (
              <ScrollArea className="w-full h-[35vh] sm:h-[40vh]">
                 <div className="prose prose-sm sm:prose md:prose-lg max-w-none p-4" dangerouslySetInnerHTML={{ __html: translatedContent }} />
              </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                <Languages className="mx-auto h-12 w-12 mb-4 opacity-50"/>
                <p className="font-medium">
                  {isCurrentlyTranslated 
                    ? "Viendo una versión traducida." 
                    : "Selecciona un idioma y presiona 'Traducir'."
                  }
                </p>
                <p className="text-sm mt-1">
                  {isCurrentlyTranslated 
                    ? "Puedes volver al original o generar una nueva traducción." 
                    : "La vista previa de la traducción aparecerá aquí."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-auto pt-4 border-t flex-col sm:flex-row sm:justify-between">
            <div>
              {isCurrentlyTranslated && (
                <Button onClick={handleRevertAndClose} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" /> Volver al Original
                </Button>
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button onClick={() => onOpenChange(false)} variant="secondary">Cerrar</Button>
                {translatedContent && !isLoading && !error && (
                  <Button onClick={handleApplyAndClose} variant="default">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aplicar Traducción y Cerrar
                  </Button>
                )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
