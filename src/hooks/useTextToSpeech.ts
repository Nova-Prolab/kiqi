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
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    return () => {
      // Clean up specific utterance events
      utterance.onend = null;
      utterance.onerror = null;
      // Cancel speech if this utterance was speaking
      if (speechSynthesis.speaking && speechSynthesis. utterance === utterance) {
        speechSynthesis.cancel();
      }
    };
  }, [utterance, isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); // Stop any current speech before starting new
    }

    const newUtterance = new SpeechSynthesisUtterance(text);
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
    if (!isSupported || !isSpeaking) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setUtterance(null); 
  }, [isSupported, isSpeaking]);

  // Global cleanup on unmount of the hook user
  useEffect(() => {
    return () => {
      if (isSupported && speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return { speak, pause, resume, stop, isSpeaking, isPaused, isSupported };
}
