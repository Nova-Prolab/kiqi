
"use client";

import { useState, useEffect, useCallback } from 'react';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initial check for support and cleanup any lingering speech from page reloads
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsSupported(false);
    }

    // Global cleanup for when the component using this hook unmounts
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (speechSynthesis.speaking || speechSynthesis.paused) {
          speechSynthesis.cancel(); // Stop speech if the component is unmounted
        }
      }
    };
  }, []); // Runs once on mount, and cleanup on unmount

  useEffect(() => {
    if (!isSupported || !utterance) {
      // If utterance becomes null (e.g., after stop() or before a new speak()), ensure speaking state is reset.
      if (!utterance) {
        setIsSpeaking(false);
        setIsPaused(false);
      }
      return;
    }

    const handleEnd = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setUtterance(null); // Clear the utterance from state once it's done
    };

    const handleError = (event: Event) => { 
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
      setUtterance(null); // Clear the utterance from state on error
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleError;
    
    // Cleanup for this specific utterance instance when it's replaced or component unmounts
    return () => {
      utterance.onend = null;
      utterance.onerror = null;
    };
  }, [utterance, isSupported]);


  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing or paused speech.
    if (speechSynthesis.speaking || speechSynthesis.paused) {
      speechSynthesis.cancel();
    }

    // Set current utterance to null to trigger cleanup of old one via useEffect.
    setUtterance(null);

    // Defer creation of new utterance to allow React to process the null state.
    setTimeout(() => {
      const newUtterance = new SpeechSynthesisUtterance(text);
      // You could try to set voice/lang here if desired, e.g.:
      // const voices = speechSynthesis.getVoices();
      // if (voices.length > 0) {
      //   const preferredVoice = voices.find(v => v.lang.startsWith(document.documentElement.lang || 'en'));
      //   if (preferredVoice) newUtterance.voice = preferredVoice;
      //   else if (voices.some(v => v.default)) newUtterance.voice = voices.find(v => v.default) || voices[0];
      //   else if (voices.length > 0) newUtterance.voice = voices[0];
      // }
      // newUtterance.lang = document.documentElement.lang || 'en-US';
      
      setUtterance(newUtterance); // This triggers the useEffect to attach new handlers
      speechSynthesis.speak(newUtterance);
      setIsSpeaking(true);
      setIsPaused(false);
    }, 0);
  }, [isSupported]);

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
    if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel();
    }
    // Setting utterance to null will also reset isSpeaking and isPaused via its effect
    setUtterance(null); 
  }, [isSupported]);


  return { speak, pause, resume, stop, isSpeaking, isPaused, isSupported };
}
