
'use client';

import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import type { ReaderTheme, ReaderFontSize } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { Palette, TextQuote, Volume2, Minimize, Maximize, Settings2, Sun, Moon, Coffee, BookOpen, AlignLeft } from 'lucide-react'; // Removed ChevronLeft, ChevronRight, Home
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
  // prevChapterId and nextChapterId are no longer needed
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

export default function ReaderControls({ chapterHtmlContent, onToggleImmersive, isImmersive, novelId }: ReaderControlsProps) { // Removed currentChapterId, prevChapterId, nextChapterId from props as they are not used here anymore
  const { theme, fontSize, setTheme, setFontSize } = useReaderSettings();
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

  return (
    <div className={`reader-controls p-2 bg-card/90 backdrop-blur-sm shadow-md border-b transition-all duration-300 ${isImmersive ? 'opacity-0 hover:opacity-100 fixed top-0 left-0 right-0 z-[110] pt-2' : 'sticky top-0 z-40 rounded-t-lg border-x'}`}>
      <div className="mx-auto flex items-center justify-between gap-1 max-w-4xl px-2 sm:px-0">
        
        <div className="flex items-center gap-0.5 min-w-[40px]"> {/* min-w to balance the right side */}
           {isImmersive && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                      <Link href={`/novels/${novelId}`} aria-label="Volver a Detalles de la Novela">
                          <BookOpen />
                      </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Detalles de la Novela</p></TooltipContent>
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
                    <Button variant="ghost" size="icon" aria-label="Ajustes de texto">
                      <AlignLeft />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Ajustes de Texto</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Tamaño de Fuente</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={fontSize} onValueChange={(value) => setFontSize(value as ReaderFontSize)}>
                {FONT_SIZES.map(fs => (
                  <DropdownMenuRadioItem key={fs.value} value={fs.value}>
                    {fs.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Tema</DropdownMenuLabel>
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
                <Button variant="ghost" size="icon" onClick={() => setIsSummaryDialogOpen(true)} aria-label="Resumen del capítulo">
                  <TextQuote />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Resumen del Capítulo</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ChapterSummaryDialog 
            chapterHtmlContent={chapterHtmlContent} 
            isOpen={isSummaryDialogOpen} 
            onOpenChange={setIsSummaryDialogOpen} 
          />

          <AudioPlayer textToRead={chapterHtmlContent} />
        </div>

        <div className="flex items-center gap-0.5 min-w-[40px]"> {/* min-w to balance the left side */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleImmersive} aria-label={isImmersive ? "Salir de Pantalla Completa" : "Lectura en Pantalla Completa"}>
                  {isImmersive ? <Minimize /> : <Maximize />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isImmersive ? "Salir de Pantalla Completa" : "Lectura en Pantalla Completa"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Immersive next/prev buttons removed from here */}
        </div>
      </div>
    </div>
  );
}
