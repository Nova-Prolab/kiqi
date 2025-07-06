'use client';

import type { Novel, Chapter } from '@/lib/types';
import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import { useReadingPosition } from '@/hooks/useReadingPosition';
import { useRecentlyRead } from '@/hooks/useRecentlyRead';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReaderControls from './ReaderControls';
import ReaderSettingsSheet from './ReaderSettingsSheet'; 
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { translateChapterAction } from '@/actions/translationActions';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import ChapterComments from './ChapterComments';

interface ReaderViewProps {
  novel: Novel;
  currentChapter: Chapter;
}

const DOUBLE_CLICK_REVEAL_TIMEOUT = 2500;

export default function ReaderView({ novel, currentChapter }: ReaderViewProps) {
  const {
    themeClass, 
    isImmersive,
    setIsImmersive,
    theme, 
    customBackground,
    customForeground,
    readerFontFamilyStyle, 
    combinedReaderClasses, 
    textWidthClass,
    autoTranslate,
    autoTranslateLanguage,
  } = useReaderSettings();

  const { toast } = useToast();
  const chapterKey = `${novel.id}_${currentChapter.id}`;
  const { savePosition, loadPosition } = useReadingPosition(chapterKey);
  const { addRecentlyReadChapter } = useRecentlyRead();
  const { isSpeaking, toggleSpeech, cancelSpeech } = useTextToSpeech(currentChapter.content);

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const doubleClickRevealTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [translatedContentForDisplay, setTranslatedContentForDisplay] = useState<string | null>(null);
  
  const [isMouseOverImmersiveControls, setIsMouseOverImmersiveControls] = useState(false);
  const [forceShowImmersiveControlsByDoubleClick, setForceShowImmersiveControlsByDoubleClick] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false); 
  const [isCommentsSheetOpen, setIsCommentsSheetOpen] = useState(false);
  const [isNavigatingToChapter, setIsNavigatingToChapter] = useState(false);

  const contentToRender = translatedContentForDisplay ?? currentChapter.content;
  const isCurrentlyTranslated = translatedContentForDisplay !== null;

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (doubleClickRevealTimerRef.current) {
        clearTimeout(doubleClickRevealTimerRef.current);
      }
      // Ensure speech is stopped when navigating away
      cancelSpeech();
    };
  }, []);

  useEffect(() => {
    if (isMounted && novel && currentChapter) {
      addRecentlyReadChapter({
        novelId: novel.id,
        novelTitle: novel.title,
        id: currentChapter.id,
        title: currentChapter.title || `Capítulo ${currentChapter.order}`,
        order: currentChapter.order,
      });
    }

    // Reset state when chapter changes
    setTranslatedContentForDisplay(null);
    cancelSpeech();

    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = 0;
    }
    setIsMouseOverImmersiveControls(false);
    setForceShowImmersiveControlsByDoubleClick(false);
    setIsSettingsSheetOpen(false); 

    const timer = setTimeout(() => {
      if (!isMounted || !scrollViewportRef.current) return;
      const scrollableElement = scrollViewportRef.current;
      const position = loadPosition();
      if (position !== null && !translatedContentForDisplay) { // Only load if not showing translation
        scrollableElement.scrollTop = position;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [currentChapter.id, novel?.id, isMounted, addRecentlyReadChapter, loadPosition, cancelSpeech]);


  // Effect for auto-translation
  useEffect(() => {
    const performAutoTranslation = async () => {
      if (isMounted && autoTranslate && autoTranslateLanguage && !isCurrentlyTranslated) {
        toast({
            title: "Traducción Automática en Progreso...",
            description: `Traduciendo capítulo al ${autoTranslateLanguage}.`,
        });

        const result = await translateChapterAction(currentChapter.content, autoTranslateLanguage);
        
        if (result.translatedContent) {
          setTranslatedContentForDisplay(result.translatedContent);
          toast({
              title: "Capítulo Traducido",
              description: "Se ha aplicado la traducción automática.",
          });
        } else {
          toast({
              variant: "destructive",
              title: "Error de Traducción Automática",
              description: result.error || "No se pudo traducir el capítulo.",
          });
        }
      }
    };

    performAutoTranslation();
    
  }, [currentChapter.content, isMounted, autoTranslate, autoTranslateLanguage, toast, isCurrentlyTranslated]);


  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSavePosition = useCallback((scrollTop: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      if (!translatedContentForDisplay) {
        savePosition(scrollTop);
      }
    }, 500);
  }, [savePosition, translatedContentForDisplay]);


  useEffect(() => {
    if (!isMounted || !scrollViewportRef.current) return;
    const scrollableElement = scrollViewportRef.current;

    const handleScroll = () => {
      if (scrollableElement) {
        debouncedSavePosition(scrollableElement.scrollTop);
      }
    };

    scrollableElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [isMounted, debouncedSavePosition, chapterKey]);


  const sortedChapters = novel.chapters.sort((a, b) => a.order - b.order);
  const currentIndex = sortedChapters.findIndex(ch => ch.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  const chapterContentToDisplay = { __html: contentToRender };

  const handleToggleImmersive = () => {
    setIsImmersive(!isImmersive);
    if (!isImmersive) { 
      setIsMouseOverImmersiveControls(false);
      setForceShowImmersiveControlsByDoubleClick(false);
      setIsSettingsSheetOpen(false); 
    }
  };

  const handleToggleSettingsSheet = () => {
    setIsSettingsSheetOpen(prev => !prev);
  };
  
  const handleToggleCommentsSheet = () => {
    setIsCommentsSheetOpen(prev => !prev);
  };

  const handleImmersiveTopAreaDoubleClick = () => {
    if (!isImmersive) return;
    setForceShowImmersiveControlsByDoubleClick(true);
    if (doubleClickRevealTimerRef.current) {
      clearTimeout(doubleClickRevealTimerRef.current);
    }
    doubleClickRevealTimerRef.current = setTimeout(() => {
      setForceShowImmersiveControlsByDoubleClick(false);
    }, DOUBLE_CLICK_REVEAL_TIMEOUT);
  };

  const handleApplyTranslation = (translatedHtml: string) => {
    setTranslatedContentForDisplay(translatedHtml);
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = 0;
    }
    toast({ title: "Traducción Aplicada", description: "Mostrando el capítulo traducido."});
  };

  const handleRevertToOriginal = () => {
    setTranslatedContentForDisplay(null);
    const savedPosition = loadPosition();
    if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = savedPosition ?? 0;
    }
    toast({ title: "Contenido Original Restaurado"});
  };
  
  const handleChapterLinkClick = () => {
    setIsNavigatingToChapter(true);
  };


  const actualImmersiveControlsVisible = isImmersive
    ? (isMouseOverImmersiveControls || forceShowImmersiveControlsByDoubleClick || isSettingsSheetOpen)
    : true;

  const readingAreaBaseClasses = `reading-content-area prose prose-sm sm:prose md:prose-lg mx-auto selection:bg-accent selection:text-accent-foreground p-6 md:p-10 lg:p-12`;
  const readingAreaDynamicThemeClass = theme === 'custom' ? '' : themeClass;

  const readingAreaStyle: React.CSSProperties = { ...readerFontFamilyStyle };
  if (theme === 'custom' && customBackground) {
    readingAreaStyle.backgroundColor = customBackground;
  }
  if (theme === 'custom' && customForeground) {
    readingAreaStyle.color = customForeground;
  }

  if (!isMounted) {
    return (
      <div className={`flex flex-col ${isImmersive ? 'h-screen' : 'h-[calc(100vh-var(--header-height,8rem))]'}`}>
        <div className="p-4 border-b bg-muted animate-pulse h-20 rounded-t-lg"></div>
        <div className="p-2 bg-muted/80 animate-pulse h-14"></div>
        <div className="flex-grow bg-muted/50 animate-pulse p-6">
          <div className="h-16 bg-muted rounded mb-4"></div>
          <div className="h-8 bg-muted rounded mb-2 w-3/4"></div>
          <div className="h-8 bg-muted rounded mb-2 w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (isNavigatingToChapter) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-lg font-semibold text-primary">Cargando capítulo...</p>
      </div>
    );
  }

  return (
    <div className={`reader-container flex flex-col bg-background transition-default ${isImmersive ? 'immersive fixed inset-0 z-[100]' : 'relative h-[calc(100vh-var(--header-height,8rem))]'}`}>
      {!isImmersive && (
        <Card className="m-2 mb-0 shadow rounded-b-none border-b-0">
          <header className="p-4">
            <h1 className="text-xl md:text-2xl font-bold text-primary truncate">{novel.title}</h1>
            <h2 className="text-md md:text-lg text-muted-foreground truncate">
              Capítulo {currentChapter.order}: {currentChapter.title}
            </h2>
          </header>
        </Card>
      )}

      {isImmersive && (
        <div
          className="fixed top-0 left-0 w-full h-16 z-[105] cursor-default"
          onDoubleClick={handleImmersiveTopAreaDoubleClick}
          aria-hidden="true"
        />
      )}

      <ReaderControls
        chapterHtmlContent={currentChapter.content} // Always pass original for new translations
        onToggleImmersive={handleToggleImmersive}
        isImmersive={isImmersive}
        novelId={novel.id}
        isVisibleInImmersiveMode={actualImmersiveControlsVisible}
        onHoverStateChange={setIsMouseOverImmersiveControls}
        onToggleSettingsSheet={handleToggleSettingsSheet} 
        isSettingsSheetOpen={isSettingsSheetOpen} 
        onApplyTranslation={handleApplyTranslation}
        onRevertToOriginal={handleRevertToOriginal}
        isCurrentlyTranslated={isCurrentlyTranslated}
        onToggleSpeech={toggleSpeech}
        isSpeaking={isSpeaking}
        onToggleCommentsSheet={handleToggleCommentsSheet}
      />
      
      <ReaderSettingsSheet 
        isOpen={isSettingsSheetOpen}
        onOpenChange={setIsSettingsSheetOpen}
      />

      <ChapterComments
        novelId={novel.id}
        chapterId={currentChapter.id}
        isOpen={isCommentsSheetOpen}
        onOpenChange={setIsCommentsSheetOpen}
      />

      <ScrollArea
        className={`flex-grow ${isImmersive ? 'h-full' : 'm-2 mt-0 rounded-t-none shadow'}`}
        viewportRef={scrollViewportRef}
      >
        <div
          className={cn(readingAreaBaseClasses, readingAreaDynamicThemeClass, combinedReaderClasses, textWidthClass)}
          style={readingAreaStyle}
          dangerouslySetInnerHTML={chapterContentToDisplay}
        />

        <Card className={`mx-auto my-6 ${textWidthClass} ${isImmersive ? 'bg-transparent border-none shadow-none text-muted-foreground/80' : 'shadow rounded-lg border'}`}>
          <nav className="p-4 flex justify-between items-center">
            {prevChapter ? (
              <Button variant="outline" asChild onClick={handleChapterLinkClick}>
                <Link href={`/novels/${novel.id}/chapters/${prevChapter.id}`}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Link>
              </Button>
            ) : <Button variant="outline" disabled><ChevronLeft className="mr-2 h-4 w-4" /> Anterior</Button>}

            <Button variant="ghost" asChild title="Volver a Detalles de la Novela" onClick={handleChapterLinkClick}>
              <Link href={`/novels/${novel.id}`}>
                <Home className="h-5 w-5" />
              </Link>
            </Button>

            {nextChapter ? (
              <Button variant="outline" asChild onClick={handleChapterLinkClick}>
                <Link href={`/novels/${novel.id}/chapters/${nextChapter.id}`}>
                  Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : <Button variant="outline" disabled>Siguiente <ChevronRight className="ml-2 h-4 w-4" /></Button>}
          </nav>
        </Card>
      </ScrollArea>
    </div>
  );
}