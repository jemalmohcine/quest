import { LegalPage } from './Privacy';
import type { MarketingLocale } from '@/lib/i18n/marketing';
import { getMarketingCopy } from '@/lib/i18n/marketing';

export function Terms({ locale }: { locale: MarketingLocale }) {
  const t = getMarketingCopy(locale);
  return (
    <LegalPage title={t.terms.title} locale={locale}>
      <section>
        {t.terms.sections.map((s) => (
          <div key={s.h}>
            <h2>{s.h}</h2>
            <p>{s.p}</p>
          </div>
        ))}
      </section>
    </LegalPage>
  );
}
