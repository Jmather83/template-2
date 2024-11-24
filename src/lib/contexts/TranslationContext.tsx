'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Translations = {
  [key: string]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  'en-GB': {
    'nav.childProfiles': 'Child Profiles',
    'nav.spellingLists': 'Spelling Lists',
    'nav.progress': 'Progress Reports',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'settings.language': 'Language Settings',
    'settings.voice': 'Voice Settings',
    'settings.test': 'Test Voice',
    'settings.newWord': 'New Word',
    'settings.colour': 'Colour Settings',
    'settings.customise': 'Customise Settings',
    'settings.centre': 'Centre Settings',
    'settings.behaviour': 'Behaviour Settings',
    // Add more translations as needed
  },
  'en-US': {
    // Same as en-GB for now
  },
  'es-ES': {
    'nav.childProfiles': 'Perfiles de Niños',
    'nav.spellingLists': 'Listas de Ortografía',
    'nav.progress': 'Informes de Progreso',
    'nav.settings': 'Configuración',
    'nav.logout': 'Cerrar Sesión',
    'settings.language': 'Configuración de Idioma',
    'settings.voice': 'Configuración de Voz',
    'settings.test': 'Probar Voz',
    'settings.newWord': 'Nueva Palabra',
  },
  // Add other languages...
};

type TranslationContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
};

const TranslationContext = createContext<TranslationContextType>({
  language: 'en-GB',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState('en-GB');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en-GB'][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export const useTranslation = () => useContext(TranslationContext); 