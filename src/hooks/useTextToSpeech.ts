
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
    utterance.onerror = (event: Event) => { // event is generic Event, needs casting for specific properties
      const errorEvent = event as SpeechSynthesisErrorEvent;
      console.error(
        'SpeechSynthesisUtterance.onerror - Type:', 
        errorEvent.error, // This provides the specific error code string (e.g., "synthesis-failed")
        'Full event object:', 
        errorEvent
      );
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

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); // Stop any current speech before starting new
    }

    const newUtterance = new SpeechSynthesisUtterance(text);
    // You could try setting a specific voice if default is problematic:
    // const voices = speechSynthesis.getVoices();
    // if (voices.length > 0) newUtterance.voice = voices[0]; // Or a preferred voice
    // newUtterance.lang = "es-ES"; // Or appropriate language
    setUtterance(newUtterance); // Store the new utterance
    speechSynthesis.speak(newUtterance);
    setIsSpeaking(true);
    setIsPaused(false);
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
    if (!isSupported || !isSpeaking && !isPaused) return; // Allow stop if paused but not actively speaking
    if (speechSynthesis.speaking || speechSynthesis.paused) { // Check actual synthesizer state
        speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setUtterance(null); 
  }, [isSupported]); // isSpeaking state removed from deps as it might not reflect synth's true state if an error occurred

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
