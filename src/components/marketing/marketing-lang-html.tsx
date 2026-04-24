'use client';

import { useEffect } from 'react';
import type { MarketingLocale } from '@/lib/i18n/marketing';
import { getMarketingCopy } from '@/lib/i18n/marketing';

/** Met à jour <html lang> pour l’accessibilité et le SEO sur les pages marketing. */
export function MarketingLangHtml({ locale }: { locale: MarketingLocale }) {
  useEffect(() => {
    const lang = getMarketingCopy(locale).htmlLang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = 'fr';
    };
  }, [locale]);

  return null;
}
