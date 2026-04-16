'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import en from '@/locales/en';
import bn from '@/locales/bn';

const LanguageContext = createContext();

const translations = { en, bn };

export function LanguageProvider({ children }) {
 const [locale, setLocale] = useState('en');

 // Load saved preference
 useEffect(() => {
 const saved = localStorage.getItem('meditaj-lang');
 if (saved && (saved === 'en' || saved === 'bn')) {
 setLocale(saved);
 }
 }, []);

 const switchLanguage = (lang) => {
 setLocale(lang);
 localStorage.setItem('meditaj-lang', lang);
 };

 const t = (key) => {
 return translations[locale][key] || key;
 };

 return (
 <LanguageContext.Provider value={{ locale, switchLanguage, t }}>
 {children}
 </LanguageContext.Provider>
 );
}

export function useLanguage() {
 const context = useContext(LanguageContext);
 if (!context) {
 throw new Error('useLanguage must be used within a LanguageProvider');
 }
 return context;
}


