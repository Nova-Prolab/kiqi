'use client';

import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import type { ReaderTheme, ReaderFontSize } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { Palette, TextQuote, Volume2, Minimize, Maximize, Settings2, Sun, Moon, Coffee, ChevronLeft, ChevronRight, BookOpen, AlignLeft, Home } from 'lucide-react';
import React, { useState } from 'react';
import ChapterSummaryDialog from './ChapterSummaryDialog';
import AudioPlayer from './AudioPlayer';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface ReaderControlsProps {
  chapterHtmlContent: string;
  onToggleImmersive: () => void;
  isImmersive: boolean;
  novelId: string;
  currentChapterId: string;
  prevChapterId?: string;
  nextChapterId?: string;
}

const FONT_SIZES: { label: string, value: ReaderFontSize }[] = [
  { label: 'Sml', value: 'sm' },
  { label: 'Base', value: 'base' },
  { label: 'Lrg', value: 'lg' },
  { label: 'XL', value: 'xl' },
  { label: 'XXL', value: '2xl' },
];

const THEMES: { label: string, value: ReaderTheme, icon: React.ElementType }[] = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Sepia', value: 'sepia', icon: Coffee },
  { label: 'Dark', value: 'dark', icon: Moon },
];

export default function ReaderControls({ chapterHtmlContent, onToggleImmersive, isImmersive, novelId, currentChapterId, prevChapterId, nextChapterId }: ReaderControlsProps) {
  const { theme, fontSize, setTheme, setFontSize } = useReaderSettings();
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

  return (
    <div className={`reader-controls p-2 bg-card/90 backdrop-blur-sm shadow-md border-b transition-all duration-300 ${isImmersive ? 'opacity-0 hover:opacity-100 fixed top-0 left-0 right-0 z-[110] pt-2' : 'sticky top-0 z-40 rounded-t-lg border-x'}`}>
      <div className="mx-auto flex items-center justify-between gap-1 max-w-4xl px-2 sm:px-0">
        
        <div className="flex items-center gap-0.5">
          {isImmersive && prevChapterId && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/novels/${novelId}/chapters/${prevChapterId}`} aria-label="Previous Chapter">
                      <ChevronLeft />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Previous Chapter</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
           {isImmersive && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                      <Link href={`/novels/${novelId}`} aria-label="Back to Novel Details">
                          <BookOpen />
                      </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Novel Details</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>


        <div className="flex items-center gap-0.5 flex-grow justify-center">
          <DropdownMenu>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Adjust text settings">
                      <AlignLeft />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Text Settings</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Font Size</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={fontSize} onValueChange={(value) => setFontSize(value as ReaderFontSize)}>
                {FONT_SIZES.map(fs => (
                  <DropdownMenuRadioItem key={fs.value} value={fs.value}>
                    {fs.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
               <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ReaderTheme)}>
                {THEMES.map(th => (
                  <DropdownMenuRadioItem key={th.value} value={th.value}>
                    <th.icon className="mr-2 h-4 w-4" />
                    {th.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsSummaryDialogOpen(true)} aria-label="Chapter summary">
                  <TextQuote />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Chapter Summary</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ChapterSummaryDialog 
            chapterHtmlContent={chapterHtmlContent} 
            isOpen={isSummaryDialogOpen} 
            onOpenChange={setIsSummaryDialogOpen} 
          />

          <AudioPlayer textToRead={chapterHtmlContent} />
        </div>

        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleImmersive} aria-label={isImmersive ? "Exit Immersive Mode" : "Enter Immersive Mode"}>
                  {isImmersive ? <Minimize /> : <Maximize />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isImmersive ? "Exit Fullscreen" : "Fullscreen Reading"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isImmersive && nextChapterId && (
             <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/novels/${novelId}/chapters/${nextChapterId}`} aria-label="Next Chapter">
                      <ChevronRight />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Next Chapter</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isImmersive && !nextChapterId && <div className="w-9 h-9"/> /* Placeholder for alignment */}
           {isImmersive && !prevChapterId && !nextChapterId && <div className="w-9 h-9"/> /* Placeholder for alignment when only one chapter & immersive */}
        </div>
      </div>
    </div>
  );
}
