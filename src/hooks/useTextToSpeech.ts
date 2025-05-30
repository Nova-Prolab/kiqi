
"use client";

import { useState, useEffect, useCallback } from 'react';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }

      const logVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          console.warn("SpeechSynthesis: No voices initially available. Waiting for voiceschanged event.");
        } else {
          // console.log("SpeechSynthesis: Available voices:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
        }
      };
      
      // Voices might not be loaded immediately.
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
        if (speechSynthesis.speaking || speechSynthesis.paused) {
          speechSynthesis.cancel();
        }
      }
    };
  }, []);

  const handleError = useCallback((event: Event) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel(); // Ensure any ongoing synthesis is stopped
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
    setUtterance(null); 
  }, []);

  useEffect(() => {
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
      setUtterance(null); 
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleError;
    
    return () => {
      utterance.onend = null;
      utterance.onerror = null;
    };
  }, [utterance, isSupported, handleError]);


  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) {
        console.warn("SpeechSynthesis: Speak called with no text or TTS not supported.");
        return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel();
      }
    }
    
    setUtterance(null); 

    setTimeout(() => {
      const newUtterance = new SpeechSynthesisUtterance(text);
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          let selectedVoice = voices.find(voice => voice.default);
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang === 'en-US');
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang === 'es-ES');
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('es'));
          if (!selectedVoice) selectedVoice = voices[0]; // Fallback to the first available voice

          if (selectedVoice) {
            newUtterance.voice = selectedVoice;
            newUtterance.lang = selectedVoice.lang; // Explicitly set lang
            // console.log(`SpeechSynthesis: Attempting to use voice: ${selectedVoice.name} (${selectedVoice.lang})`);
          }
        } else {
          // console.warn("SpeechSynthesis: No voices available when trying to speak.");
        }
        speechSynthesis.speak(newUtterance);
      }
      
      setUtterance(newUtterance);
      setIsSpeaking(true);
      setIsPaused(false);
    }, 0);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking || isPaused) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.pause();
    }
    setIsPaused(true);
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (!isSupported || !isSpeaking || !isPaused) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.resume();
    }
    setIsPaused(false);
  }, [isSupported, isSpeaking, isPaused]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (speechSynthesis.speaking || speechSynthesis.paused) {
          speechSynthesis.cancel();
      }
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setUtterance(null); 
  }, [isSupported]);


  return { speak, pause, resume, stop, isSpeaking, isPaused, isSupported };
}
