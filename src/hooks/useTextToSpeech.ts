
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      const synth = window.speechSynthesis;
      
      // Ensure any ongoing speech is cancelled on initial load or if speech was active from a previous state.
      if (synth.speaking || synth.paused) {
        synth.cancel();
      }

      const logVoices = () => {
        // const voices = synth.getVoices();
        // console.log("SpeechSynthesis: Available voices:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
      };
      
      // Voices might load asynchronously.
      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = logVoices;
      } else {
        logVoices();
      }

    } else {
      setIsSupported(false);
    }

    // Cleanup function: cancel speech synthesis when the component unmounts.
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null; // Remove listener
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
          window.speechSynthesis.cancel();
        }
      }
      setCurrentUtterance(null); // Clear any current utterance state
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
    console.error(errorDetails); // Log the detailed error
    setLastError(errorDetails); // Store the error message for UI feedback
    
    // Reset speaking states
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null); // Clear the problematic utterance
  }, [setLastError, setIsSpeaking, setIsPaused, setCurrentUtterance]);


  useEffect(() => {
    const utterance = currentUtterance;
    if (!isSupported || !utterance) {
      // If there's no utterance, ensure speaking/paused states are false
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
      setLastError(null); // Clear error on successful completion
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleError; // Use the memoized handleError
    
    // Cleanup for this specific utterance when it changes or component unmounts
    return () => {
      utterance.onend = null;
      utterance.onerror = null;
    };
  }, [currentUtterance, isSupported, handleError, setLastError, setIsSpeaking, setIsPaused]);


  const speak = useCallback((text: string) => {
    if (!isSupported) {
        console.warn("SpeechSynthesis: Speak called but TTS is not supported by the browser.");
        return;
    }
    if (!text || !text.trim()) {
        console.warn("SpeechSynthesis: Speak called with empty or whitespace-only text. Cannot speak.");
        return;
    }
    
    setLastError(null); // Clear any previous error on new speak attempt

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel(); // Cancel any ongoing or paused speech
      }
    }
    setCurrentUtterance(null); // Clear current utterance to trigger useEffect cleanup for old one

    // Use setTimeout to allow React to process the setCurrentUtterance(null) state update
    // before creating and speaking the new utterance. This helps ensure event listeners are fresh.
    setTimeout(() => {
      const newUtterance = new SpeechSynthesisUtterance(text);
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            const noVoiceError = "SpeechSynthesis: CRITICAL - No TTS voices were found. Cannot speak.";
            console.warn(noVoiceError);
            setLastError(noVoiceError); // Set error state if no voices are found
            setIsSpeaking(false);
            setIsPaused(false);
            return; // Do not proceed if no voices
        } else {
            // Attempt to select a suitable voice
            let selectedVoice = voices.find(voice => voice.default && voice.lang.startsWith('es')); // Prioritize default Spanish
            if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('es-')); // Any Spanish
            if (!selectedVoice) selectedVoice = voices.find(voice => voice.default && voice.lang.startsWith('en')); // Default English
            if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('en-')); // Any English
            if (!selectedVoice) selectedVoice = voices.find(voice => voice.default); // Any default voice
            if (!selectedVoice && voices.length > 0) selectedVoice = voices[0]; // Fallback to the first available voice

            if (selectedVoice) {
                newUtterance.voice = selectedVoice;
                newUtterance.lang = selectedVoice.lang; // Explicitly set lang for the utterance
            } else {
                 // This case should ideally not be reached if voices.length > 0
                 const noSpecificVoiceError = "SpeechSynthesis: No suitable voice found after filtering, browser default will be used if any.";
                 console.warn(noSpecificVoiceError);
            }
        }
        window.speechSynthesis.speak(newUtterance);
      }
      
      setCurrentUtterance(newUtterance); // Set the new utterance
      setIsSpeaking(true);
      setIsPaused(false);
    }, 0); 
  }, [isSupported, handleError, setLastError, setIsSpeaking, setIsPaused, setCurrentUtterance]); // Dependencies for useCallback

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking || isPaused) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
  }, [isSupported, isSpeaking, isPaused, setIsPaused]);

  const resume = useCallback(() => {
    if (!isSupported || !isSpeaking || !isPaused) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    setIsPaused(false);
  }, [isSupported, isSpeaking, isPaused, setIsPaused]);

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
    // Optionally clear lastError on stop, or let it persist until a new speak attempt
    // setLastError(null); 
  }, [isSupported, setIsSpeaking, setIsPaused, setCurrentUtterance]);


  return { speak, pause, resume, stop, isSpeaking, isPaused, isSupported, lastError };
}
