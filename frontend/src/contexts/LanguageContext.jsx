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
    if (!key) return '';
    const dict = dictionaries[lang] || en;
    if (dict && dict[key] !== undefined) return dict[key];
    
    // Check nested key if dot present
    if (typeof key === 'string' && key.includes('.')) {
      const parts = key.split('.');
      let val = dict;
      for (const p of parts) {
        val = val ? val[p] : undefined;
      }
      if (val !== undefined) return val;
      
      let fallbackVal = en;
      for (const p of parts) {
        fallbackVal = fallbackVal ? fallbackVal[p] : undefined;
      }
      if (fallbackVal !== undefined) return fallbackVal;
    }

    if (en && en[key] !== undefined) return en[key];
    return key;
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
