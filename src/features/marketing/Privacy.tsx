import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { MarketingLocale } from '@/lib/i18n/marketing';
import { getMarketingCopy, marketingHref } from '@/lib/i18n/marketing';

interface LegalPageProps {
  title: string;
  locale: MarketingLocale;
  children: React.ReactNode;
}

export function LegalPage({ title, locale, children }: LegalPageProps) {
  const t = getMarketingCopy(locale);
  const home = marketingHref(locale, '');

  return (
    <div className="dark">
      <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 font-sans selection:bg-indigo-500 relative overflow-hidden">
        <div className="absolute inset-0 kinetic-grid opacity-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <Link
            href={home}
            className="inline-flex items-center gap-2 px-4 -ml-4 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.legal.back}
          </Link>

          <header className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-headline">{title}</h1>
            <div className="h-1 w-20 bg-indigo-600 rounded-full" />
          </header>

          <div className="prose prose-invert prose-zinc max-w-none prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-xs prose-h2:font-black prose-h2:text-indigo-400">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Privacy({ locale }: { locale: MarketingLocale }) {
  const t = getMarketingCopy(locale);
  return (
    <LegalPage title={t.privacy.title} locale={locale}>
      <section>
        {t.privacy.sections.map((s) => (
          <div key={s.h}>
            <h2>{s.h}</h2>
            <p>{s.p}</p>
          </div>
        ))}
      </section>
    </LegalPage>
  );
}
