import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';

const dictionaries = { en, ta, hi };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('skillworth_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('skillworth_lang', lang);
  }, [lang]);

  const t = (key) => {
    const dict = dictionaries[lang] || en;
    return dict[key] || en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
