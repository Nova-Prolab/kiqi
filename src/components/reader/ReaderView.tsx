'use client';

import type { Novel, Chapter } from '@/lib/types';
import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import { useReadingPosition } from '@/hooks/useReadingPosition';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReaderControls from './ReaderControls';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '../ui/card';

interface ReaderViewProps {
  novel: Novel;
  currentChapter: Chapter;
}

export default function ReaderView({ novel, currentChapter }: ReaderViewProps) {
  const { fontClass, themeClass } = useReaderSettings();
  const chapterKey = `${novel.id}_${currentChapter.id}`;
  const { savePosition, loadPosition } = useReadingPosition(chapterKey);
  
  const scrollViewportRef = useRef<HTMLDivElement>(null); // Ref for the ScrollArea's viewport

  const [isImmersive, setIsImmersive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce scroll saving
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSavePosition = useCallback((scrollTop: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      savePosition(scrollTop);
    }, 500); // Save 500ms after last scroll event
  }, [savePosition]);


  useEffect(() => {
    if (!isMounted || !scrollViewportRef.current) return;

    const scrollableElement = scrollViewportRef.current;
    
    const position = loadPosition();
    if (position !== null) {
      scrollableElement.scrollTop = position;
    }

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
  }, [isMounted, loadPosition, debouncedSavePosition, chapterKey]);


  const sortedChapters = novel.chapters.sort((a, b) => a.order - b.order);
  const currentIndex = sortedChapters.findIndex(ch => ch.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  const chapterContentHtml = { __html: currentChapter.content };

  if (!isMounted) {
    // Basic skeleton or loading state to avoid hydration issues with dynamic classes
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="p-4 border-b bg-muted animate-pulse h-20"></div>
        <div className="p-2 bg-muted/80 animate-pulse h-14"></div>
        <div className="flex-grow bg-muted/50 animate-pulse p-6">
          <div className="h-16 bg-muted rounded mb-4"></div>
          <div className="h-8 bg-muted rounded mb-2 w-3/4"></div>
          <div className="h-8 bg-muted rounded mb-2 w-1/2"></div>
        </div>
        <div className="p-4 border-t bg-muted animate-pulse h-16"></div>
      </div>
    );
  }

  return (
    <div className={`reader-container flex flex-col h-[calc(100vh-var(--header-height,8rem))] bg-background transition-default ${isImmersive ? 'immersive fixed inset-0 z-[100] pt-16' : 'relative'}`}>
      {!isImmersive && (
        <Card className="m-2 mb-0 shadow rounded-b-none border-b-0">
          <header className="p-4">
            <h1 className="text-xl md:text-2xl font-bold text-primary truncate">{novel.title}</h1>
            <h2 className="text-md md:text-lg text-muted-foreground truncate">Chapter {currentChapter.order}: {currentChapter.title}</h2>
          </header>
        </Card>
      )}
      
      <ReaderControls
        chapterHtmlContent={currentChapter.content}
        onToggleImmersive={() => setIsImmersive(!isImmersive)}
        isImmersive={isImmersive}
        novelId={novel.id}
        currentChapterId={currentChapter.id}
        prevChapterId={prevChapter?.id}
        nextChapterId={nextChapter?.id}
      />

      <ScrollArea 
        className={`flex-grow ${isImmersive ? 'h-full' : 'm-2 mt-0 rounded-t-none shadow'}`}
        viewportRef={scrollViewportRef} // Pass ref to ScrollArea's viewport
      >
        <div
          className={`reading-content-area ${themeClass} ${fontClass} p-6 md:p-10 lg:p-12 prose prose-sm sm:prose md:prose-lg max-w-4xl mx-auto selection:bg-accent selection:text-accent-foreground`}
          dangerouslySetInnerHTML={chapterContentHtml}
        />
      </ScrollArea>

      {!isImmersive && (
        <Card className="m-2 mt-0 shadow rounded-t-none border-t-0">
          <nav className="p-4 flex justify-between items-center">
            {prevChapter ? (
              <Button variant="outline" asChild>
                <Link href={`/novels/${novel.id}/chapters/${prevChapter.id}`}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Link>
              </Button>
            ) : <Button variant="outline" disabled><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button> }
            
            <Button variant="ghost" asChild title="Back to Novel Details">
              <Link href={`/novels/${novel.id}`}>
                <Home className="h-5 w-5"/>
              </Link>
            </Button>

            {nextChapter ? (
              <Button variant="outline" asChild>
                <Link href={`/novels/${novel.id}/chapters/${nextChapter.id}`}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : <Button variant="outline" disabled>Next <ChevronRight className="ml-2 h-4 w-4" /></Button> }
          </nav>
        </Card>
      )}
    </div>
  );
}
