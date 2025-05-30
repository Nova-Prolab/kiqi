
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
    } else {
      setIsSupported(false);
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (speechSynthesis.speaking || speechSynthesis.paused) {
          speechSynthesis.cancel();
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!isSupported || !utterance) {
      if (!utterance) { // If utterance is explicitly cleared, reset speaking states
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

    const handleError = (event: Event) => { 
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
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleError;
    
    return () => {
      utterance.onend = null;
      utterance.onerror = null;
    };
  }, [utterance, isSupported]);


  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing or paused speech before starting anew.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel();
      }
    }
    
    setUtterance(null); // Clear current utterance to trigger cleanup and ensure fresh state

    // Defer creation to allow React to process state update
    setTimeout(() => {
      const newUtterance = new SpeechSynthesisUtterance(text);
      // Optional: Configure voice, lang, rate, pitch here if needed
      // e.g., newUtterance.lang = 'es-ES';
      setUtterance(newUtterance); 
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
          speechSynthesis.cancel();
      }
    }
    setUtterance(null); 
  }, [isSupported]);


  return { speak, pause, resume, stop, isSpeaking, isPaused, isSupported };
}
