
'use client';

import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Button } from '@/components/ui/button';
import { Play, Pause, SquareIcon, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from 'react';

interface AudioPlayerProps {
  textToRead: string; // Expected to be HTML content
}

const stripHtmlForTTS = (html: string): string => {
  if (typeof window === 'undefined') return html; 
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const parts: string[] = [];
    // Iterate over common block elements that usually contain readable text
    doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, div').forEach(el => {
      // Check if the element itself might be a container not meant for direct reading
      // This is a heuristic; complex layouts might need more specific selectors
      if (el.matches('div') && el.querySelector('p, h1, h2, h3, h4, h5, h6, li, blockquote')) {
        // If it's a div containing other readable blocks, skip the div's direct textContent
        // to avoid duplicating text from its children.
        return;
      }
      const content = (el.textContent || "").trim();
      if (content) { // Only add if there's actual textual content
        parts.push(content);
      }
    });

    let text = parts.join(". "); // Join content parts with a period and space
    if (parts.length > 0 && !text.endsWith('.')) { // Ensure a final period if text was formed from parts
        text += ".";
    }


    if (!text && doc.body.textContent) { // Fallback if no specific block elements with content found
        text = (doc.body.textContent || "").trim();
    }
    
    // Normalize whitespace and ensure it's a clean string
    return text.replace(/\s+/g, ' ').trim();
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
