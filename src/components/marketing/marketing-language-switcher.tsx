'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { marketingBase, type MarketingLocale } from '@/lib/i18n/marketing';

export function MarketingLanguageSwitcher({
  locale,
  ariaLabel,
  labelFr,
  labelEn,
}: {
  locale: MarketingLocale;
  ariaLabel: string;
  labelFr: string;
  labelEn: string;
}) {
  const pathname = usePathname();
  const target: MarketingLocale = locale === 'fr' ? 'en' : 'fr';
  const stripped = pathname.replace(/^\/(fr|en)(?=\/|$)/, '') || '';
  const href = `${marketingBase(target)}${stripped}`;

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={ariaLabel}
      className="font-headline text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#adaaaa] hover:text-white border border-white/15 rounded-full px-3 py-1.5 md:px-4 transition-colors"
    >
      {target === 'en' ? labelEn : labelFr}
    </Link>
  );
}
