
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
      // Ensure any speech from a previous page load or state is stopped.
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }

      // Diagnostic: Log available voices and listen for changes
      const logVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          console.warn("SpeechSynthesis: No voices initially available. Waiting for voiceschanged event.");
        } else {
          // console.log("SpeechSynthesis: Available voices:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
        }
      };
      
      logVoices(); // Log voices on initial load
      window.speechSynthesis.onvoiceschanged = logVoices; // Log voices if they change

    } else {
      setIsSupported(false);
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null; // Clean up event listener
        if (speechSynthesis.speaking || speechSynthesis.paused) {
          speechSynthesis.cancel();
        }
      }
    };
  }, []);

  const handleError = useCallback((event: Event) => {
    // Explicitly cancel any synthesis attempt on error
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
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
      // If utterance is explicitly cleared (e.g., by stop() or error), reset speaking states.
      // This check also handles the initial state before any utterance is set.
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
    utterance.onerror = handleError; // Use the memoized handleError
    
    return () => {
      // Cleanup event listeners from the utterance
      utterance.onend = null;
      utterance.onerror = null;
    };
  }, [utterance, isSupported, handleError]);


  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) {
        console.warn("SpeechSynthesis: Speak called with no text or TTS not supported.");
        return;
    }

    // Cancel any ongoing or paused speech before starting anew.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel(); // This should also trigger onend/onerror for previous utterance if any
      }
    }
    
    // Setting utterance to null ensures the useEffect cleanup for the *previous* utterance runs.
    setUtterance(null); 

    // Defer creation of new utterance to allow React to process state update (setUtterance(null))
    // and ensure the old utterance's event handlers are cleaned up.
    setTimeout(() => {
      const newUtterance = new SpeechSynthesisUtterance(text);
      // Optional: Configure voice, lang, rate, pitch here if needed
      // const voices = window.speechSynthesis.getVoices();
      // const spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
      // if (spanishVoice) newUtterance.voice = spanishVoice;
      // newUtterance.lang = 'es-ES'; // Or 'es-MX', etc.
      
      setUtterance(newUtterance); // This will trigger the useEffect to attach new handlers
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.speak(newUtterance);
      }
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
          speechSynthesis.cancel(); // This will trigger onend/onerror which resets state via setUtterance(null)
      }
    }
    // Explicitly ensure states are reset if cancel() doesn't immediately trigger handlers
    // or if there was no active speech to cancel.
    setIsSpeaking(false);
    setIsPaused(false);
    setUtterance(null); 
  }, [isSupported]);


  return { speak, pause, resume, stop, isSpeaking, isPaused, isSupported };
}

