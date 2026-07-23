import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { translations, type Lang } from '../i18n/translations';

interface LocaleContextType {
  language: Lang;
  timezone: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (language: Lang, timezone: string) => void;
  formatDate: (value?: string | Date | null, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value?: string | Date | null) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Map the app's simple timezone codes to IANA zones understood by Intl.
const TZ_MAP: Record<string, string> = {
  'utc-8': 'Etc/GMT+8',
  'utc-5': 'Etc/GMT+5',
  'utc+0': 'UTC',
  'utc+1': 'Etc/GMT-1',
  'utc+2': 'Etc/GMT-2',
  'utc+3': 'Etc/GMT-3',
};

const LOCALE_BY_LANG: Record<Lang, string> = { en: 'en-US', fr: 'fr-FR' };

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [language, setLanguage] = useState<Lang>(() => {
    const saved = localStorage.getItem('pref_language');
    return saved === 'fr' ? 'fr' : 'en';
  });
  const [timezone, setTimezone] = useState<string>(() => localStorage.getItem('pref_timezone') || 'utc+0');

  // Adopt the signed-in user's saved preferences.
  useEffect(() => {
    if (currentUser?.language && (currentUser.language === 'en' || currentUser.language === 'fr')) {
      setLanguage(currentUser.language as Lang);
      localStorage.setItem('pref_language', currentUser.language);
    }
    if (currentUser?.timezone) {
      setTimezone(currentUser.timezone);
      localStorage.setItem('pref_timezone', currentUser.timezone);
    }
  }, [currentUser?.id, currentUser?.language, currentUser?.timezone]);

  // Reflect the language on the <html> element.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLocale = useCallback((lang: Lang, tz: string) => {
    setLanguage(lang);
    setTimezone(tz);
    localStorage.setItem('pref_language', lang);
    localStorage.setItem('pref_timezone', tz);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let text = translations[language][key] ?? translations.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [language]
  );

  const formatDate = useCallback(
    (value?: string | Date | null, options?: Intl.DateTimeFormatOptions) => {
      if (!value) return '—';
      const date = typeof value === 'string' ? new Date(value) : value;
      if (isNaN(date.getTime())) return '—';
      return new Intl.DateTimeFormat(LOCALE_BY_LANG[language], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: TZ_MAP[timezone] || 'UTC',
        ...options,
      }).format(date);
    },
    [language, timezone]
  );

  const formatTime = useCallback(
    (value?: string | Date | null) => {
      if (!value) return '';
      const date = typeof value === 'string' ? new Date(value) : value;
      if (isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(LOCALE_BY_LANG[language], {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: TZ_MAP[timezone] || 'UTC',
      }).format(date);
    },
    [language, timezone]
  );

  return (
    <LocaleContext.Provider value={{ language, timezone, t, setLocale, formatDate, formatTime }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
