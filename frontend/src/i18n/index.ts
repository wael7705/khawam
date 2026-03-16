import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { ar } from './ar';
import { en } from './en';
import React from 'react';

type Translations = Omit<typeof ar, 'dir'> & { dir: string };
type Locale = 'ar' | 'en';

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const translations: Record<Locale, Translations> = { ar, en } as Record<Locale, Translations>;
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('khawam_lang') as Locale | null;
    return saved === 'en' ? 'en' : 'ar';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('khawam_lang', l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const value: I18nContextValue = {
    locale,
    t: translations[locale],
    setLocale,
    toggleLocale,
  };

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}

/** API returns role in Arabic (مدير, موظف, عميل). Use this for display only; keep permission checks as user?.role === 'موظف' etc. */
export function getRoleDisplayName(role: string, locale: Locale): string {
  const map: Record<string, { ar: string; en: string }> = {
    مدير: { ar: 'مدير', en: 'Admin' },
    موظف: { ar: 'موظف', en: 'Employee' },
    عميل: { ar: 'عميل', en: 'Customer' },
  };
  const entry = map[role];
  return entry ? entry[locale] : role;
}
