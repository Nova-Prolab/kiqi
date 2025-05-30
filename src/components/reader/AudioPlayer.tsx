'use client';

import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Button } from '@/components/ui/button';
import { Play, Pause, SquareIcon, AlertCircle, Volume2 } from 'lucide-react'; // Changed Square to SquareIcon
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from 'react';

interface AudioPlayerProps {
  textToRead: string; // Expected to be HTML content
}

const stripHtmlForTTS = (html: string): string => {
  if (typeof window === 'undefined') return html; 
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Improve text extraction by joining text nodes, preserving some paragraph structure
    let text = "";
    doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote').forEach(el => {
      text += (el.textContent || "") + ". "; // Add a period to help with sentence breaks
    });
    if (!text) { // Fallback if no block elements found
        text = doc.body.textContent || "";
    }
    return text.replace(/\s+/g, ' ').trim(); // Normalize whitespace
  } catch (e) {
    console.error("Error stripping HTML for TTS:", e);
    return html; // Fallback to original if parsing fails
  }
};


export default function AudioPlayer({ textToRead }: AudioPlayerProps) {
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } = useTextToSpeech();
  const [plainText, setPlainText] = useState("");

  useEffect(() => {
    setPlainText(stripHtmlForTTS(textToRead));
  }, [textToRead]);

  // Stop TTS when component unmounts or textToRead changes significantly
  useEffect(() => {
    return () => {
      stop();
    };
  }, [textToRead, stop]);


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
            <p>Text-to-speech is not supported.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const handlePlayPause = () => {
    if (!plainText) return;
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

  let title = "Play narration";
  if(isSpeaking) title = isPaused ? "Resume narration" : "Pause narration";


  return (
    <div className="flex items-center gap-1">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handlePlayPause} aria-label={title} disabled={!plainText}>
              {isSpeaking && !isPaused ? <Pause /> : <Play />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isSpeaking ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={stop} aria-label="Stop narration">
                <SquareIcon /> 
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stop narration</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
         <Button variant="ghost" size="icon" disabled className="opacity-0 pointer-events-none"> 
            <SquareIcon />
        </Button>
      )}
    </div>
  );
}
