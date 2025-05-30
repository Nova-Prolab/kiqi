
'use client';

import { useState, useEffect, useMemo } from 'react';
import { translateChapterAction } from '@/actions/translationActions';
import type { TranslateChapterInput } from '@/ai/flows/translate-chapter-flow';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, Languages } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TranslationDialogProps {
  originalHtmlContent: string;
  targetLanguage: TranslateChapterInput['targetLanguage'] | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLanguageChangeRequest: () => void; // To reopen language selection
}

export default function TranslationDialog({ 
  originalHtmlContent, 
  targetLanguage, 
  isOpen, 
  onOpenChange,
  onLanguageChangeRequest 
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
      // Reset state when dialog is closed
      setTranslatedContent(null);
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen, targetLanguage, originalHtmlContent]);

  const title = useMemo(() => {
    if (!targetLanguage) return "Translate Chapter";
    return `Chapter Translation (to ${targetLanguage})`;
  }, [targetLanguage]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] md:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Languages className="mr-2 h-5 w-5"/> {title}
          </DialogTitle>
          {targetLanguage && (
            <DialogDescription>
              AI-generated translation of the current chapter to {targetLanguage}. HTML formatting is preserved where possible.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4 space-y-4 flex-grow min-h-[200px] flex flex-col overflow-hidden">
          {isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Translating to {targetLanguage} with Gemini...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center text-destructive p-4 bg-destructive/10 rounded-md">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold text-center">Error Translating Chapter</p>
              <p className="text-sm text-center">{error}</p>
            </div>
          )}
          {translatedContent && !isLoading && (
            <ScrollArea className="flex-grow rounded-md border p-4 prose prose-sm sm:prose md:prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: translatedContent }} />
            </ScrollArea>
          )}
          {!targetLanguage && !isLoading && !error && (
             <div className="flex-grow flex flex-col items-center justify-center">
                <p className="text-muted-foreground">Please select a target language first.</p>
             </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between mt-auto">
          {targetLanguage && (
             <Button onClick={handleTranslate} variant="outline" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Retry Translation
            </Button>
          )}
           <Button onClick={onLanguageChangeRequest} variant="secondary">
             Change Language
           </Button>
          <Button onClick={() => onOpenChange(false)} variant={!targetLanguage && !isLoading && !error ? "default" : "secondary"}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
