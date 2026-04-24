import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { getMarketingCopy, type MarketingLocale } from '@/lib/i18n/marketing';

export type MarketingSegment = 'contact' | 'privacy' | 'terms' | 'scientific-method';

const baseUrl = () => siteConfig.url.replace(/\/+$/, '');

export function marketingAlternates(locale: MarketingLocale, segment: MarketingSegment): NonNullable<Metadata['alternates']> {
  const base = baseUrl();
  const path = `/${segment}`;
  return {
    canonical: `${base}/${locale}${path}`,
    languages: {
      fr: `${base}/fr${path}`,
      en: `${base}/en${path}`,
      'x-default': `${base}/fr${path}`,
    },
  };
}

export function marketingHomeAlternates(locale: MarketingLocale): NonNullable<Metadata['alternates']> {
  const base = baseUrl();
  return {
    canonical: `${base}/${locale}`,
    languages: {
      fr: `${base}/fr`,
      en: `${base}/en`,
      'x-default': `${base}/fr`,
    },
  };
}

export function marketingHomeMetadata(locale: MarketingLocale): Metadata {
  const m = getMarketingCopy(locale);
  return {
    title: m.metaTitle,
    description: m.metaDescription,
    alternates: marketingHomeAlternates(locale),
    openGraph: {
      title: m.metaTitle,
      description: m.metaDescription,
      url: `${baseUrl()}/${locale}`,
      siteName: siteConfig.name,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
  };
}

function subMeta(locale: MarketingLocale, segment: MarketingSegment, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: marketingAlternates(locale, segment),
  };
}

export function marketingContactMetadata(locale: MarketingLocale): Metadata {
  const m = getMarketingCopy(locale);
  return subMeta(locale, 'contact', `${m.contact.title} · ${siteConfig.name}`, m.contact.intro);
}

export function marketingPrivacyMetadata(locale: MarketingLocale): Metadata {
  const m = getMarketingCopy(locale);
  return subMeta(locale, 'privacy', `${m.privacy.title} · ${siteConfig.name}`, m.privacy.sections[0]?.p ?? m.metaDescription);
}

export function marketingTermsMetadata(locale: MarketingLocale): Metadata {
  const m = getMarketingCopy(locale);
  return subMeta(locale, 'terms', `${m.terms.title} · ${siteConfig.name}`, m.terms.sections[0]?.p ?? m.metaDescription);
}

export function marketingMethodMetadata(locale: MarketingLocale): Metadata {
  const m = getMarketingCopy(locale);
  return subMeta(locale, 'scientific-method', `${m.method.title} · ${siteConfig.name}`, m.method.sections[0]?.p ?? m.metaDescription);
}
