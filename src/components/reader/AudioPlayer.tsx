
'use client';

import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Button } from '@/components/ui/button';
import { Play, Pause, SquareIcon, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState, useMemo } from 'react';

interface AudioPlayerProps {
  textToRead: string; // Expected to be HTML content
}

const stripHtmlForTTS = (html: string): string => {
  if (typeof window === 'undefined' || !html) return ""; 
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const parts: string[] = [];
    
    // Iterate over common block elements that usually contain readable text
    // This selector is a heuristic and might need adjustment for very complex HTML structures
    doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, div:not(:has(p, h1, h2, h3, h4, h5, h6, li, blockquote))').forEach(el => {
      const content = (el.textContent || "").trim();
      if (content) { // Only add if there's actual textual content
        parts.push(content);
      }
    });

    let text = parts.join(". "); 
    // Ensure a final period if text was formed from parts and it doesn't end with punctuation.
    if (parts.length > 0 && text.length > 0 && !/[.?!]$/.test(text)) { 
        text += ".";
    }

    // Fallback if no specific block elements with content found, but body has text
    if (!text && doc.body.textContent) { 
        text = (doc.body.textContent || "").trim();
        if (text.length > 0 && !/[.?!]$/.test(text)) {
            text += ".";
        }
    }
    
    // Normalize whitespace and ensure it's a clean string
    return text.replace(/\s+/g, ' ').trim();
  } catch (e) {
    console.error("Error stripping HTML for TTS:", e);
    return html; // Fallback to original if parsing fails, though this might not be ideal for TTS
  }
};


export default function AudioPlayer({ textToRead }: AudioPlayerProps) {
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } = useTextToSpeech();
  
  const plainText = useMemo(() => stripHtmlForTTS(textToRead), [textToRead]);

  // Stop TTS when component unmounts or textToRead changes significantly (which changes plainText)
  useEffect(() => {
    return () => {
      stop(); // This calls speechSynthesis.cancel()
    };
  }, [stop, plainText]); // Re-run if plainText changes to stop previous speech


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

  const handlePlayPause = () => {
    if (!plainText) {
      // console.warn("AudioPlayer: Attempted to play but plainText is empty.");
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

  let title = "Reproducir narración";
  if(isSpeaking) {
    title = isPaused ? "Reanudar narración" : "Pausar narración";
  } else if (!plainText) {
    title = "No hay texto para narrar";
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
              aria-label={title} 
              disabled={!plainText}
            >
              {isSpeaking && !isPaused ? <Pause /> : <Play />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{title}</p>
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
                disabled={!isSpeaking} // Only enable stop if it's speaking or paused
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
