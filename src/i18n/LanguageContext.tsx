'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { dictionaries, Language, Dictionary } from './dictionaries';

interface LanguageContextType {
  language: Language;
  t: Dictionary;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener('cospace-language-change', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('cospace-language-change', onChange);
  };
}

function getSavedLanguage(): Language {
  const saved = localStorage.getItem('cospace_lang');
  return saved === 'en' ? 'en' : 'es';
}

function setSavedLanguage(language: Language) {
  localStorage.setItem('cospace_lang', language);
  window.dispatchEvent(new Event('cospace-language-change'));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribeToLanguage, getSavedLanguage, () => 'es' as Language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setSavedLanguage(lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'es' ? 'en' : 'es';
    setLanguage(nextLang);
  };

  const t = dictionaries[language];

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe ser usado dentro de un LanguageProvider');
  }
  return context;
}
