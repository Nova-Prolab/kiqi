'use client';

import { useState, useEffect } from 'react';
import { getChapterSummaryAction } from '@/actions/summaryActions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChapterSummaryDialogProps {
  chapterHtmlContent: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ChapterSummaryDialog({ chapterHtmlContent, isOpen, onOpenChange }: ChapterSummaryDialogProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);
    setHasAttemptedGeneration(true);
    const result = await getChapterSummaryAction(chapterHtmlContent);
    if (result.summary) {
      setSummary(result.summary);
    } else {
      setError(result.error || 'Failed to generate summary.');
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog is closed to ensure fresh state on reopen
      setSummary(null);
      setIsLoading(false);
      setError(null);
      setHasAttemptedGeneration(false);
    } else if (isOpen && !hasAttemptedGeneration && !summary && !error) {
      // Optionally auto-generate on open if not already generated or loading
      // handleGenerateSummary(); 
      // For now, require explicit button click
    }
  }, [isOpen, hasAttemptedGeneration, summary, error]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Chapter Summary</DialogTitle>
          <DialogDescription>
            Get an AI-generated summary of the current chapter.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 min-h-[200px] flex flex-col">
          {!hasAttemptedGeneration && !isLoading && (
            <div className="flex-grow flex items-center justify-center">
               <Button onClick={handleGenerateSummary} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Summary
              </Button>
            </div>
          )}
          {isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating summary...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center text-destructive p-4 bg-destructive/10 rounded-md">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold text-center">Error Generating Summary</p>
              <p className="text-sm text-center">{error}</p>
            </div>
          )}
          {summary && !isLoading && (
            <ScrollArea className="max-h-[50vh] h-[300px] rounded-md border p-4">
              <p className="whitespace-pre-line leading-relaxed text-sm">{summary}</p>
            </ScrollArea>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {hasAttemptedGeneration && !isLoading && (
             <Button onClick={handleGenerateSummary} variant="outline" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Regenerate
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} variant={hasAttemptedGeneration && !isLoading ? "secondary" : "default"}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
