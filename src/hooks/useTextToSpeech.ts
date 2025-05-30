
"use client";

import { useState, useEffect, useCallback } from 'react';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }

      const logVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          // console.warn("SpeechSynthesis: No voices initially available. Waiting for voiceschanged event or direct call to getVoices() later.");
        } else {
          // console.log("SpeechSynthesis: Available voices:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
        }
      };
      
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = logVoices;
      } else {
        logVoices();
      }

    } else {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null; 
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
          window.speechSynthesis.cancel(); 
        }
      }
      setCurrentUtterance(null); 
    };
  }, []);

  const handleError = useCallback((event: Event) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const errorEvent = event as SpeechSynthesisErrorEvent;
    let errorDetails = `SpeechSynthesisUtterance.onerror - Type: "${errorEvent.error}"`;
    if (errorEvent.charIndex !== undefined) {
      errorDetails += `, CharIndex: ${errorEvent.charIndex}`;
    }
    if (errorEvent.elapsedTime !== undefined) {
      errorDetails += `, ElapsedTime: ${errorEvent.elapsedTime}ms`;
    }
    console.error(errorDetails);
    
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null); 
  }, []);


  useEffect(() => {
    const utterance = currentUtterance; 
    if (!isSupported || !utterance) {
      if (!utterance) { 
        setIsSpeaking(false);
        setIsPaused(false);
      }
      return;
    }

    const handleEnd = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentUtterance(null); 
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleError; 
    
    return () => {
      utterance.onend = null;
      utterance.onerror = null;
    };
  }, [currentUtterance, isSupported, handleError]);


  const speak = useCallback((text: string) => {
    if (!isSupported) {
        console.warn("SpeechSynthesis: Speak called but TTS is not supported by the browser.");
        return;
    }
    if (!text || !text.trim()) {
        console.warn("SpeechSynthesis: Speak called with empty or whitespace-only text. Cannot speak.");
        return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }
    }
    
    setCurrentUtterance(null); 

    setTimeout(() => {
      const newUtterance = new SpeechSynthesisUtterance(text);
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          let selectedVoice = voices.find(voice => voice.default && voice.lang.startsWith('es')); 
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('es-')); 
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.default && voice.lang.startsWith('en')); 
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('en-')); 
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.default); 
          if (!selectedVoice) selectedVoice = voices[0];

          if (selectedVoice) {
            newUtterance.voice = selectedVoice;
            newUtterance.lang = selectedVoice.lang;
            // console.log(`SpeechSynthesis: Attempting to use voice: ${selectedVoice.name} (${selectedVoice.lang}) for text: "${text.substring(0,30)}..."`);
          } else {
            // This case should ideally not be reached if voices.length > 0
            // console.warn("SpeechSynthesis: No suitable voice found despite voices being available. Using browser default implicit voice selection.");
          }
        } else {
          console.warn("SpeechSynthesis: CRITICAL - No TTS voices were found at the moment of trying to speak. This is a likely cause for 'synthesis-failed' errors. Please check browser/OS voice settings.");
        }
        window.speechSynthesis.speak(newUtterance);
      }
      
      setCurrentUtterance(newUtterance); 
      setIsSpeaking(true);
      setIsPaused(false);
    }, 0); 
  }, [isSupported, handleError]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking || isPaused) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (!isSupported || !isSpeaking || !isPaused) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    setIsPaused(false);
  }, [isSupported, isSpeaking, isPaused]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
          window.speechSynthesis.cancel(); 
      }
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null); 
  }, [isSupported]);


  return { speak, pause, resume, stop, isSpeaking, isPaused, isSupported };
}
