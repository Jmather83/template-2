import { useState, useEffect } from 'react';

export const useVoice = () => {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoice = () => {
      const savedVoiceURI = localStorage.getItem('selectedVoice');
      if (savedVoiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const savedVoice = voices.find(v => v.voiceURI === savedVoiceURI);
        if (savedVoice) {
          setVoice(savedVoice);
        }
      }
    };

    window.speechSynthesis.onvoiceschanged = loadVoice;
    loadVoice();
  }, []);

  const speak = (text: string) => {
    if (!voice) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  return { speak, voice };
}; 