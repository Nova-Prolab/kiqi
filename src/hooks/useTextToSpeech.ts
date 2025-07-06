
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Helper to strip HTML and get clean text for speech synthesis
const stripHtmlForSpeech = (html: string): string => {
  if (typeof document === 'undefined') {
    // Basic fallback for server-side or non-DOM environments
    return html.replace(/<[^>]*>?/gm, ' ');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Simple text extraction
  const text = (doc.body.textContent || "");
  return text.replace(/\s+/g, ' ').trim();
};

export const useTextToSpeech = (textToSpeak: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Function to cancel speech synthesis
  const cancelSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Main toggle function
  const toggleSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Browser Speech Synthesis not supported.');
      return;
    }
    
    const synth = window.speechSynthesis;

    if (synth.speaking) {
      cancelSpeech();
      return;
    }

    // A hack to "wake up" the speech synthesis engine on some browsers
    if (!synth.speaking && !synth.pending) {
       synth.resume(); 
       const dummyUtterance = new SpeechSynthesisUtterance('');
       synth.speak(dummyUtterance);
       synth.cancel();
    }

    const plainText = stripHtmlForSpeech(textToSpeak);
    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utteranceRef.current = utterance;

    // Try to select a preferred Spanish voice if available
    const voices = synth.getVoices();
    const spanishVoice = voices.find(voice => voice.lang.startsWith('es-')) || voices.find(voice => voice.lang.startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
    utterance.lang = 'es-ES';

    utterance.onstart = () => {
        setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    // Set speaking state immediately to provide quick UI feedback
    setIsSpeaking(true);
    synth.speak(utterance);
  }, [textToSpeak, cancelSpeech]);

  // Effect to handle state changes from external controls (e.g., browser's media controls)
  useEffect(() => {
    const synth = window.speechSynthesis;
    const checkSpeakingState = () => {
      setIsSpeaking(synth.speaking);
    };
    const interval = setInterval(checkSpeakingState, 250);
    return () => clearInterval(interval);
  }, []);

  // Effect to clean up when the component unmounts or the text changes
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [textToSpeak, cancelSpeech]);

  // Initial call to getVoices() might return an empty array.
  // This ensures voices are loaded when they become available.
  useEffect(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
          const loadVoices = () => window.speechSynthesis.getVoices();
          loadVoices(); // Initial try
          window.speechSynthesis.onvoiceschanged = loadVoices;
          return () => {
            window.speechSynthesis.onvoiceschanged = null;
          }
      }
  }, []);


  return { isSpeaking, toggleSpeech, cancelSpeech };
};
