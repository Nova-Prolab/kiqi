
'use client';

import { useState, useEffect } from 'react';
import { getChapterSummaryAction } from '@/actions/summaryActions';
import { SummaryLengthOptions, SummaryStyleOptions } from '@/lib/types';
import type { GenerateChapterSummaryInput } from '@/ai/flows/generate-chapter-summary';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, BrainCircuit, RotateCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';


interface ChapterSummaryDialogProps {
  chapterHtmlContent: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const countWordsInHtml = (html: string): number => {
  if (!html) return 0;
  // Use a simple regex for server-side or non-DOM environments as a fallback.
  const text = html.replace(/<[^>]*>?/gm, ' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export default function ChapterSummaryDialog({ chapterHtmlContent, isOpen, onOpenChange }: ChapterSummaryDialogProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const [summaryLength, setSummaryLength] = useState<GenerateChapterSummaryInput['summaryLength']>('normal');
  const [summaryStyle, setSummaryStyle] = useState<GenerateChapterSummaryInput['summaryStyle']>('Narrativo');

  useEffect(() => {
    if (isOpen) {
      setWordCount(countWordsInHtml(chapterHtmlContent));
    } else {
      // Delay reset to allow for closing animation
      const timer = setTimeout(() => {
        setSummary(null);
        setIsLoading(false);
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, chapterHtmlContent]);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);
    const result = await getChapterSummaryAction(chapterHtmlContent, {
      length: summaryLength,
      style: summaryStyle,
    });
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

        <div className="space-y-4 flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="font-semibold">Longitud</Label>
                     <RadioGroup value={summaryLength} onValueChange={(val) => setSummaryLength(val as any)} className="flex space-x-4">
                        {SummaryLengthOptions.map(option => (
                            <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`len-${option}`} />
                                <Label htmlFor={`len-${option}`} className="capitalize font-normal">{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <div className="space-y-2">
                    <Label className="font-semibold">Estilo</Label>
                    <RadioGroup value={summaryStyle} onValueChange={(val) => setSummaryStyle(val as any)} className="flex space-x-4">
                        {SummaryStyleOptions.map(option => (
                             <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`style-${option}`} />
                                <Label htmlFor={`style-${option}`} className="capitalize font-normal">{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </div>
             <Button onClick={handleGenerateSummary} size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <BrainCircuit className="mr-2 h-5 w-5" />}
                {isLoading ? 'Generando...' : 'Generar Resumen'}
            </Button>
        </div>
        
        <Separator className="my-4"/>
        
        <div className="py-2 space-y-4 flex-grow min-h-0 flex flex-col">
          {isLoading ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-3 p-4 text-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-lg font-semibold text-primary">Generando resumen...</p>
                <p className="text-muted-foreground text-sm max-w-xs">
                    La IA está procesando el texto. Esto puede tardar unos segundos.
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
               <p className="text-lg font-medium mb-2">Resumen listo para generar</p>
               <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                 Ajusta las opciones de arriba y presiona "Generar Resumen" para que la IA cree un resumen para ti.
               </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-auto pt-4 border-t flex-shrink-0">
          {error && (
             <Button onClick={handleGenerateSummary} variant="outline" disabled={isLoading}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Intentar de Nuevo
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} variant="default">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
