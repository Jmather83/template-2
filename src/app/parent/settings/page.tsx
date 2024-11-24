'use client';

import { useState, useEffect } from 'react';
import ParentDashboardLayout from '@/components/layouts/ParentDashboardLayout';
import { Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DEFAULT_VOICE = 'Google UK English Male';

export default function Settings() {
  const router = useRouter();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [tempSelectedVoice, setTempSelectedVoice] = useState<string>('');
  const [testWord, setTestWord] = useState('');
  const [loading, setLoading] = useState(true);

  const sampleWords = [
    'Magical', 'Enchanted', 'Wizard', 'Spellbound', 'Dragon',
    'Potion', 'Crystal', 'Mystical', 'Adventure', 'Quest'
  ];

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Get saved voice preference or set default
      const savedVoice = localStorage.getItem('selectedVoice');
      if (savedVoice && availableVoices.find(v => v.voiceURI === savedVoice)) {
        setSelectedVoice(savedVoice);
        setTempSelectedVoice(savedVoice);
      } else {
        // Set default to Google UK English Male
        const defaultVoice = availableVoices.find(v => v.name === DEFAULT_VOICE);
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.voiceURI);
          setTempSelectedVoice(defaultVoice.voiceURI);
          localStorage.setItem('selectedVoice', defaultVoice.voiceURI);
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0].voiceURI);
          setTempSelectedVoice(availableVoices[0].voiceURI);
          localStorage.setItem('selectedVoice', availableVoices[0].voiceURI);
        }
      }
      
      setLoading(false);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    // Generate random test word
    setTestWord(sampleWords[Math.floor(Math.random() * sampleWords.length)]);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleVoiceChange = (voiceURI: string) => {
    setTempSelectedVoice(voiceURI);
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoiceObj = voices.find(voice => voice.voiceURI === tempSelectedVoice);
    if (selectedVoiceObj) {
      utterance.voice = selectedVoiceObj;
    }
    window.speechSynthesis.speak(utterance);
  };

  const generateNewTestWord = () => {
    const newWord = sampleWords[Math.floor(Math.random() * sampleWords.length)];
    setTestWord(newWord);
  };

  const handleSaveSettings = () => {
    // Save the temporary voice selection
    setSelectedVoice(tempSelectedVoice);
    localStorage.setItem('selectedVoice', tempSelectedVoice);
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    successMessage.textContent = 'Settings saved successfully!';
    document.body.appendChild(successMessage);
    
    // Remove the message and redirect after a delay
    setTimeout(() => {
      document.body.removeChild(successMessage);
      router.push('/parent/dashboard');
    }, 1500);
  };

  if (loading) {
    return (
      <ParentDashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-2xl text-purple-800">Loading voices...</div>
        </div>
      </ParentDashboardLayout>
    );
  }

  return (
    <ParentDashboardLayout>
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Settings Centre</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Colour Preferences</h2>
            {/* ... */}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Behaviour Settings</h2>
            {/* ... */}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Learning Programme</h2>
            {/* ... */}
          </section>
        </div>
      </div>
    </ParentDashboardLayout>
  );
} 