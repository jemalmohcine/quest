import { LegalPage } from './Privacy';
import type { MarketingLocale } from '@/lib/i18n/marketing';
import { getMarketingCopy } from '@/lib/i18n/marketing';

export function ScientificMethod({ locale }: { locale: MarketingLocale }) {
  const t = getMarketingCopy(locale);
  return (
    <LegalPage title={t.method.title} locale={locale}>
      <section>
        {t.method.sections.map((s) => (
          <div key={s.h}>
            <h2>{s.h}</h2>
            <p>{s.p}</p>
          </div>
        ))}
      </section>
    </LegalPage>
  );
}
