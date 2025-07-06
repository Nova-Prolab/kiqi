
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Helper to strip HTML and get clean text for speech synthesis
const stripHtmlForSpeech = (html: string): string => {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>?/gm, ' ');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const text = doc.body.textContent || "";
  return text.replace(/\s+/g, ' ').trim();
};

const CHUNK_MAX_LENGTH = 250; // Max characters per utterance chunk

const splitTextIntoChunks = (text: string): string[] => {
  const chunks: string[] = [];
  if (!text) return chunks;

  // Split by sentences for more natural pauses
  const sentences = text.match(/[^.!?]+[.!?\u2026]*\s*|.+$/g) || [];
  
  sentences.forEach(sentence => {
    let currentSentence = sentence.trim();
    if (currentSentence.length === 0) return;

    // If a sentence is longer than the max length, split it further
    while (currentSentence.length > CHUNK_MAX_LENGTH) {
      let splitPos = currentSentence.lastIndexOf(' ', CHUNK_MAX_LENGTH);
      if (splitPos === -1) {
        splitPos = CHUNK_MAX_LENGTH;
      }
      chunks.push(currentSentence.substring(0, splitPos));
      currentSentence = currentSentence.substring(splitPos).trim();
    }
    if (currentSentence.length > 0) {
      chunks.push(currentSentence);
    }
  });

  return chunks;
};

export const useTextToSpeech = (htmlToSpeak: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Keep the synth instance in a ref
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Function to process and speak the queue
  const speakQueue = useCallback(() => {
    const synth = synthRef.current;
    if (!synth || synth.speaking || utteranceQueueRef.current.length === 0) {
      return;
    }
    
    const utterance = utteranceQueueRef.current.shift();
    if (utterance) {
      utterance.onend = () => {
        // When one utterance ends, speak the next one in the queue
        if (utteranceQueueRef.current.length > 0) {
          speakQueue();
        } else {
          setIsSpeaking(false);
        }
      };
      utterance.onerror = (event) => {
        // The 'interrupted' error is expected when synth.cancel() is called.
        // We don't need to log it as an error or take further action,
        // as the cancelSpeech function handles the state reset.
        if (event.error === 'interrupted') {
          return;
        }
        console.error('SpeechSynthesisUtterance.onerror:', event.error);
        // Try to continue with the next chunk even if one fails
        if (utteranceQueueRef.current.length > 0) {
          speakQueue();
        } else {
          setIsSpeaking(false);
        }
      };
      
      setIsSpeaking(true);
      synth.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    const synth = synthRef.current;
    if (synth) {
      utteranceQueueRef.current = [];
      synth.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggleSpeech = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) {
      console.error('Browser Speech Synthesis not supported.');
      return;
    }

    if (isSpeaking) {
      // If currently speaking, stop everything.
      cancelSpeech();
      return;
    }
    
    const plainText = stripHtmlForSpeech(htmlToSpeak);
    if (!plainText) return;

    const chunks = splitTextIntoChunks(plainText);
    const voices = synth.getVoices();
    const spanishVoice = voices.find(voice => voice.lang.startsWith('es-')) || voices.find(voice => voice.lang.startsWith('es'));

    // Create a queue of utterances
    utteranceQueueRef.current = chunks.map(chunk => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
      utterance.lang = 'es-ES';
      return utterance;
    });
    
    speakQueue();

  }, [isSpeaking, htmlToSpeak, cancelSpeech, speakQueue]);

  // Effect to clean up when the component unmounts or text changes
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [htmlToSpeak, cancelSpeech]);

  // Ensure voices are loaded.
  useEffect(() => {
    const synth = synthRef.current;
    if (synth) {
      const loadVoices = () => synth.getVoices();
      loadVoices();
      synth.onvoiceschanged = loadVoices;
      return () => {
        if (synth) {
          synth.onvoiceschanged = null;
        }
      };
    }
  }, []);
  
  // Periodically check the speaking state to keep it in sync, as `onend` can be unreliable.
  useEffect(() => {
    const synth = synthRef.current;
    if (synth) {
      const interval = setInterval(() => {
        if (isSpeaking && !synth.speaking) {
          setIsSpeaking(false);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSpeaking]);

  return { isSpeaking, toggleSpeech, cancelSpeech };
};
