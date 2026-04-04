import { useEffect } from 'react';
import { Home } from '../pages/Home';
import { useTranslation } from '../i18n/index';

type PublicLocale = 'ar' | 'en';

export function LocaleHome({ lang }: { lang: PublicLocale }) {
  const { setLocale } = useTranslation();
  useEffect(() => {
    setLocale(lang);
  }, [lang, setLocale]);
  return <Home />;
}
