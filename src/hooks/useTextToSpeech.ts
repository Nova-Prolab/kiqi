
"use client";

import { useState, useEffect, useCallback } from 'react';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // Store the current utterance to manage it (e.g., for onend, onerror)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      // Cleanup any lingering speech synthesis from previous page loads or states
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }

      const logVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          // This is common, voices load asynchronously.
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

    // Cleanup function when the component unmounts or dependencies change
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null; // Remove event listener
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
          window.speechSynthesis.cancel(); // Cancel any ongoing speech
        }
      }
      setCurrentUtterance(null); // Clear stored utterance
    };
  }, []);

  const handleError = useCallback((event: Event) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // It's good practice to cancel, though the error itself might have already stopped it.
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


  // Effect to manage event listeners for the current utterance
  useEffect(() => {
    const utterance = currentUtterance; // Capture currentUtterance for this effect closure
    if (!isSupported || !utterance) {
      // If there's no utterance, ensure states are reset (though speak/stop should also handle this)
      if (!utterance) { 
        setIsSpeaking(false);
        setIsPaused(false);
      }
      return;
    }

    const handleEnd = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentUtterance(null); // Clear the utterance once it's done
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleError; // Use the memoized handleError
    
    // Cleanup for this specific utterance when it changes or component unmounts
    return () => {
      utterance.onend = null;
      utterance.onerror = null;
      // Don't cancel here if it's just the utterance object changing but speech might be ongoing
      // Cancellation is handled by speak (before new speech) and stop/unmount.
    };
  }, [currentUtterance, isSupported, handleError]);


  const speak = useCallback((text: string) => {
    if (!isSupported) {
        console.warn("SpeechSynthesis: Speak called but TTS is not supported by the browser.");
        return;
    }
    if (!text || !text.trim()) {
        console.warn("SpeechSynthesis: Speak called with empty or whitespace-only text.");
        return;
    }

    // Cancel any ongoing or paused speech before starting anew
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }
    }
    
    // Reset currentUtterance state to ensure the useEffect for event listeners re-runs correctly for the new utterance.
    // Using a timeout allows React to process this state update before we create and set the new utterance.
    setCurrentUtterance(null); 

    setTimeout(() => {
      const newUtterance = new SpeechSynthesisUtterance(text);
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Attempt to select a voice. This order can be adjusted.
          let selectedVoice = voices.find(voice => voice.default); // Prefer default
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('es')); // Prefer Spanish
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('en')); // Then English
          if (!selectedVoice) selectedVoice = voices[0]; // Fallback to the first available voice

          if (selectedVoice) {
            newUtterance.voice = selectedVoice;
            newUtterance.lang = selectedVoice.lang; // Explicitly set lang from the selected voice
            // console.log(`SpeechSynthesis: Attempting to use voice: ${selectedVoice.name} (${selectedVoice.lang}) for text: "${text.substring(0,30)}..."`);
          } else {
            // console.warn("SpeechSynthesis: No suitable voice found after checking. Using browser default implicit voice selection.");
          }
        } else {
          // console.warn("SpeechSynthesis: No voices available via getVoices() when trying to speak. Relying on browser default implicit voice selection.");
        }
        window.speechSynthesis.speak(newUtterance);
      }
      
      setCurrentUtterance(newUtterance); // Set the new utterance
      setIsSpeaking(true);
      setIsPaused(false);
    }, 0); // setTimeout with 0 delay to allow state to clear first
  }, [isSupported]); // Dependencies: isSupported. Other states are managed internally or via utterance effect.

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
          window.speechSynthesis.cancel(); // This will trigger 'onend' or 'onerror' if an utterance was active
      }
    }
    // State reset is largely handled by onend/onerror callbacks triggered by cancel()
    // But as a safeguard, or if cancel() doesn't trigger them (e.g., if nothing was speaking):
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null); 
  }, [isSupported]);


  return { speak, pause, resume, stop, isSpeaking, isPaused, isSupported };
}
