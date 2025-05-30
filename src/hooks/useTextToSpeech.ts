
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      // Ensure any previous speech is cancelled on mount/unmount
      const synth = window.speechSynthesis;
      if (synth.speaking || synth.paused) {
        synth.cancel();
      }

      const logVoices = () => {
        const voices = synth.getVoices();
        if (voices.length === 0) {
          // console.warn("SpeechSynthesis: No voices initially available. Waiting for voiceschanged event.");
        } else {
          // console.log("SpeechSynthesis: Available voices:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
        }
      };
      
      // Voices might load asynchronously
      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = logVoices;
      } else {
        logVoices(); // Log voices if already available
      }

    } else {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null; // Clean up event listener
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
          window.speechSynthesis.cancel(); // Cancel speech on unmount
        }
      }
      setCurrentUtterance(null); // Clear current utterance state
    };
  }, []);

  const handleError = useCallback((event: Event) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // It's good practice to cancel, though the error itself often implies synthesis has stopped.
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
    setCurrentUtterance(null); // Clear utterance on error
  }, []);


  useEffect(() => {
    const utterance = currentUtterance; // Local variable for cleanup
    if (!isSupported || !utterance) {
      // If no utterance, ensure states are reset
      if (!utterance) { 
        setIsSpeaking(false);
        setIsPaused(false);
      }
      return;
    }

    const handleEnd = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentUtterance(null); // Clear utterance on natural end
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleError; // Assign the memoized handleError
    
    return () => {
      // Cleanup for this specific utterance instance when it changes or component unmounts
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
        if (voices.length === 0) {
            console.warn("SpeechSynthesis: CRITICAL - No TTS voices were found at the moment of trying to speak. This is a likely cause for 'synthesis-failed' errors. Please check browser/OS voice settings.");
        } else {
            let selectedVoice = voices.find(voice => voice.default && voice.lang.startsWith('es')); 
            if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('es-')); 
            if (!selectedVoice) selectedVoice = voices.find(voice => voice.default && voice.lang.startsWith('en')); 
            if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('en-')); 
            if (!selectedVoice) selectedVoice = voices.find(voice => voice.default); 
            if (!selectedVoice) selectedVoice = voices[0]; 

            if (selectedVoice) {
                newUtterance.voice = selectedVoice;
                newUtterance.lang = selectedVoice.lang; 
                // console.log(`SpeechSynthesis: Attempting to use voice: ${selectedVoice.name} (${selectedVoice.lang})`);
            }
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
