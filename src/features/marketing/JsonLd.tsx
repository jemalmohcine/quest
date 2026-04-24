import { siteConfig } from '@/config/site';
import { getMarketingCopy, type MarketingLocale } from '@/lib/i18n/marketing';

/** JSON-LD pour la home marketing (langue courante + description localisée). */
export function JsonLd({ locale }: { locale: MarketingLocale }) {
  const m = getMarketingCopy(locale);
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: `${siteConfig.url}/${locale}`,
        name: siteConfig.name,
        description: m.metaDescription,
        inLanguage: [m.jsonLdLang],
        publisher: { '@id': `${siteConfig.url}/#org` },
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#org`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: m.metaDescription,
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
