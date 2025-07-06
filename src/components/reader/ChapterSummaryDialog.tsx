'use client';

import { useState, useEffect } from 'react';
import { getChapterSummaryAction } from '@/actions/summaryActions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, BrainCircuit, RotateCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChapterSummaryDialogProps {
  chapterHtmlContent: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const countWordsInHtml = (html: string): number => {
  if (!html) return 0;
  // This check avoids trying to create DOM elements during SSR
  if (typeof document === 'undefined') {
    // A simple regex can approximate word count on the server
    const text = html.replace(/<[^>]*>?/gm, ' ');
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export default function ChapterSummaryDialog({ chapterHtmlContent, isOpen, onOpenChange }: ChapterSummaryDialogProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setWordCount(countWordsInHtml(chapterHtmlContent));
    } else {
      // Reset state when closing for a fresh start next time
      const timer = setTimeout(() => {
        setSummary(null);
        setIsLoading(false);
        setError(null);
      }, 300); // Delay reset to allow for closing animation
      return () => clearTimeout(timer);
    }
  }, [isOpen, chapterHtmlContent]);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);
    const result = await getChapterSummaryAction(chapterHtmlContent);
    if (result.summary) {
      setSummary(result.summary);
    } else {
      setError(result.error || 'Failed to generate summary.');
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <BrainCircuit className="mr-2 h-6 w-6"/> Resumen del Capítulo (IA)
          </DialogTitle>
          <DialogDescription>
            Obtén un resumen por IA del capítulo actual. Original: {wordCount.toLocaleString()} palabras.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-grow min-h-[300px] flex flex-col">
          {isLoading ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-3 p-4 text-center">
              <div className="relative mb-2">
                <BrainCircuit className="h-20 w-20 text-primary animate-pulse opacity-50" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary animate-spin" />
              </div>
              <p className="text-xl font-semibold text-primary">Gemini está pensando...</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                Analizando el texto y elaborando un resumen conciso para ti. ¡Un momento!
              </p>
            </div>
          ) : error ? (
            <div className="flex-grow flex flex-col items-center justify-center text-destructive p-4 bg-destructive/10 rounded-md text-center">
              <AlertTriangle className="h-10 w-10 mb-3" />
              <p className="text-lg font-semibold">Error al Generar Resumen</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : summary ? (
            <ScrollArea className="flex-grow rounded-md border p-4 bg-muted/20 shadow-inner">
              <p className="whitespace-pre-line leading-relaxed text-sm">{summary}</p>
            </ScrollArea>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
               <BrainCircuit className="h-16 w-16 text-primary/70 mb-4" />
               <p className="text-lg font-medium mb-2">¿Listo para un resumen rápido?</p>
               <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                 Gemini analizará el contenido del capítulo y te proporcionará los puntos clave en español.
               </p>
               <Button onClick={handleGenerateSummary} size="lg">
                <BrainCircuit className="mr-2 h-5 w-5" />
                Generar Resumen con Gemini
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-auto pt-4 border-t">
          {(!summary && !error) || isLoading ? null : (
             <Button onClick={handleGenerateSummary} variant="outline">
              {error ? <RotateCcw className="mr-2 h-4 w-4" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
              {error ? 'Intentar de Nuevo' : 'Regenerar Resumen'}
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} variant="default">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
