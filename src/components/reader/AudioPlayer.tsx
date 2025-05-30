
'use client';

import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Button } from '@/components/ui/button';
import { Play, Pause, SquareIcon, AlertCircle, VolumeX } from 'lucide-react'; // Added VolumeX
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useMemo } from 'react';

interface AudioPlayerProps {
  textToRead: string; // Expected to be HTML content
}

const stripHtmlForTTS = (html: string): string => {
  if (typeof window === 'undefined' || !html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const parts: string[] = [];
    
    doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, div:not(:has(p, h1, h2, h3, h4, h5, h6, li, blockquote))').forEach(el => {
      const content = (el.textContent || "").trim();
      if (content) {
        parts.push(content);
      }
    });

    let text = parts.join(". "); 
    if (parts.length > 0 && text.length > 0 && !/[.?!]$/.test(text)) { 
        text += ".";
    }

    if (!text && doc.body.textContent) { 
        text = (doc.body.textContent || "").trim();
        if (text.length > 0 && !/[.?!]$/.test(text)) {
            text += ".";
        }
    }
    
    return text.replace(/\s+/g, ' ').trim();
  } catch (e) {
    console.error("Error stripping HTML for TTS:", e);
    return html; 
  }
};


export default function AudioPlayer({ textToRead }: AudioPlayerProps) {
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported, lastError } = useTextToSpeech();
  
  const plainText = useMemo(() => stripHtmlForTTS(textToRead), [textToRead]);

  useEffect(() => {
    return () => {
      stop(); 
    };
  }, [stop, plainText]);


  if (!isSupported) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled>
              <AlertCircle />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Text-to-speech no es soportado por este navegador.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (lastError) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled className="text-destructive">
              <VolumeX />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-destructive">Error de Text-to-Speech. Intenta de nuevo o revisa la configuración de tu navegador/SO.</p>
            <p className="text-xs text-muted-foreground max-w-xs break-words">{lastError}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const handlePlayPause = () => {
    if (!plainText) {
      return;
    }
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(plainText);
    }
  };

  let playPauseTitle = "Reproducir narración";
  if(isSpeaking) {
    playPauseTitle = isPaused ? "Reanudar narración" : "Pausar narración";
  } else if (!plainText) {
    playPauseTitle = "No hay texto para narrar";
  }


  return (
    <div className="flex items-center gap-1">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePlayPause} 
              aria-label={playPauseTitle} 
              disabled={!plainText || !!lastError}
            >
              {isSpeaking && !isPaused ? <Pause /> : <Play />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{playPauseTitle}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={stop} 
                aria-label="Detener narración"
                disabled={!isSpeaking || !!lastError}
              >
              <SquareIcon /> 
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Detener narración</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

