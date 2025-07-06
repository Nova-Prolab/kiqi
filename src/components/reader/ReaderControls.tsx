'use client';

import { Button } from '@/components/ui/button';
import {
  Settings2,
  TextQuote,
  Minimize,
  Maximize,
  Languages,
  Loader2,
  Volume2,
  PauseCircle,
  MessageSquare
} from 'lucide-react';
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, RotateCcw } from 'lucide-react';

const DynamicChapterSummaryDialog = dynamic(() => import('./ChapterSummaryDialog'), {
  suspense: true,
  loading: () => <div className="w-8 h-8 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>,
});
const DynamicTranslationDialog = dynamic(() => import('./TranslationDialog'), {
  suspense: true,
  loading: () => <div className="w-8 h-8 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>,
});


interface ReaderControlsProps {
  chapterHtmlContent: string;
  onToggleImmersive: () => void;
  isImmersive: boolean;
  novelId: string;
  isVisibleInImmersiveMode: boolean;
  onHoverStateChange: (isHovering: boolean) => void;
  onToggleSettingsSheet: () => void; 
  isSettingsSheetOpen: boolean; 
  onApplyTranslation: (translatedHtml: string) => void;
  onRevertToOriginal: () => void;
  isCurrentlyTranslated: boolean;
  onToggleSpeech: () => void;
  isSpeaking: boolean;
  onToggleCommentsSheet: () => void;
}


function ReaderControls({
  chapterHtmlContent, onToggleImmersive, isImmersive, novelId,
  isVisibleInImmersiveMode, onHoverStateChange, onToggleSettingsSheet, isSettingsSheetOpen,
  onApplyTranslation, onRevertToOriginal, isCurrentlyTranslated,
  onToggleSpeech, isSpeaking, onToggleCommentsSheet
}: ReaderControlsProps) {
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = React.useState(false);
  const [isTranslationDialogOpen, setIsTranslationDialogOpen] = React.useState(false);

  const baseClasses = "reader-controls p-2 bg-card/90 backdrop-blur-sm shadow-md border-b transition-transform duration-300 ease-in-out";
  let immersiveSpecificClasses = "";
  if (isImmersive) {
    immersiveSpecificClasses = `fixed top-0 left-0 right-0 z-[110] transform ${isVisibleInImmersiveMode ? 'translate-y-0' : '-translate-y-full'}`;
  } else {
    immersiveSpecificClasses = "sticky top-0 z-40 rounded-t-lg border-x";
  }

  const handleSettingsButtonClick = () => {
    onToggleSettingsSheet();
    if (isImmersive && !isSettingsSheetOpen) { 
      onHoverStateChange(true); 
    }
  };

  return (
    <div
      className={`${baseClasses} ${immersiveSpecificClasses}`}
      onMouseEnter={() => isImmersive && onHoverStateChange(true)}
      onMouseLeave={() => { 
        if (isImmersive && !isSettingsSheetOpen && !isSummaryDialogOpen && !isTranslationDialogOpen) { 
          onHoverStateChange(false); 
        }
      }}
    >
      <div className="mx-auto flex items-center justify-between gap-1 max-w-4xl px-2 sm:px-0">
        <div className="flex items-center gap-0.5 min-w-[40px]">
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
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ajustes de apariencia" onClick={handleSettingsButtonClick}>
                  <Settings2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Ajustes de Apariencia</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsSummaryDialogOpen(true)} aria-label="Resumen del capítulo (IA)" >
                  <TextQuote />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Resumen del Capítulo (IA)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Suspense fallback={<div className="w-8 h-8 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>}>
            <DynamicChapterSummaryDialog chapterHtmlContent={chapterHtmlContent} isOpen={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen} />
          </Suspense>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Traducir Capítulo (IA)" onClick={() => setIsTranslationDialogOpen(true)}>
                  <Languages />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Traducir Capítulo (IA)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
           <Suspense fallback={<div className="w-8 h-8 flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>}>
            <DynamicTranslationDialog 
              isOpen={isTranslationDialogOpen} 
              onOpenChange={setIsTranslationDialogOpen} 
              originalHtmlContent={chapterHtmlContent} 
              onApplyTranslation={onApplyTranslation}
              onRevertToOriginal={onRevertToOriginal}
              isCurrentlyTranslated={isCurrentlyTranslated}
            />
          </Suspense>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleSpeech} aria-label={isSpeaking ? "Detener Narración" : "Escuchar Capítulo"}>
                  {isSpeaking ? <PauseCircle className="h-5 w-5 text-primary" /> : <Volume2 />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isSpeaking ? "Detener Narración" : "Escuchar Capítulo"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

           <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleCommentsSheet} aria-label="Ver Comentarios">
                  <MessageSquare />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Ver Comentarios</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isCurrentlyTranslated && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={onRevertToOriginal} aria-label="Volver al Original">
                    <RotateCcw />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Volver al Contenido Original</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex items-center gap-0.5 min-w-[40px]">
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
        </div>
      </div>
    </div>
  );
}

export default React.memo(ReaderControls);