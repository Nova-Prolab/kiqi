
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
      // Ensure speech synthesis is cancelled on page load / navigation
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !utterance) return;

    const handleEnd = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onend = handleEnd;
    utterance.onerror = (event: Event) => { 
      const errorEvent = event as SpeechSynthesisErrorEvent;
      let errorDetails = `SpeechSynthesisUtterance.onerror - Type: "${errorEvent.error}"`;
      if (errorEvent.charIndex !== undefined) {
        errorDetails += `, CharIndex: ${errorEvent.charIndex}`;
      }
      if (errorEvent.elapsedTime !== undefined) {
        errorDetails += `, ElapsedTime: ${errorEvent.elapsedTime}ms`;
      }
      // For more detailed inspection in a browser console, you might log the event object itself:
      // console.log("Full SpeechSynthesisErrorEvent object:", errorEvent);
      console.error(errorDetails);
      
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    // Cleanup for this specific utterance instance when it changes or component unmounts
    return () => {
      utterance.onend = null;
      utterance.onerror = null;
    };
  }, [utterance, isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // Ensure any ongoing speech is fully stopped and utterance state is cleared
    if (speechSynthesis.speaking || speechSynthesis.paused) {
      speechSynthesis.cancel();
    }
    // It's good practice to also clear our local utterance state if we cancel
    if (utterance) {
        utterance.onend = null;
        utterance.onerror = null;
        setUtterance(null);
    }


    const newUtterance = new SpeechSynthesisUtterance(text);
    // Potentially set language for better voice selection, e.g., newUtterance.lang = "es-ES";
    // This might require ensuring voices are loaded, which can be asynchronous.
    // For now, we rely on browser defaults which usually work for common languages.
    
    setUtterance(newUtterance); 
    speechSynthesis.speak(newUtterance);
    setIsSpeaking(true);
    setIsPaused(false);
  }, [isSupported, utterance]); // Added utterance to dependency array for the cleanup logic inside speak

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking || isPaused) return;
    speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (!isSupported || !isSpeaking || !isPaused) return;
    speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isSpeaking, isPaused]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    // Check actual synthesizer state, not just our local state variables
    if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel(); // This should trigger onend for the current utterance
    }
    // Explicitly reset state here as well, in case onend doesn't fire or is delayed
    setIsSpeaking(false);
    setIsPaused(false);
    if (utterance) {
        utterance.onend = null;
        utterance.onerror = null;
        setUtterance(null); 
    }
  }, [isSupported, utterance]);

  // Global cleanup on unmount of the component using the hook
  useEffect(() => {
    return () => {
      if (isSupported && (speechSynthesis.speaking || speechSynthesis.paused)) {
        speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return { speak, pause, resume, stop, isSpeaking, isPaused, isSupported };
}
