import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LandingPage } from '@/features/marketing/LandingPage';
import { JsonLd } from '@/features/marketing/JsonLd';
import { isMarketingLocale, type MarketingLocale } from '@/lib/i18n/marketing';
import { marketingHomeMetadata } from '@/lib/i18n/marketing-metadata';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) return {};
  return marketingHomeMetadata(raw as MarketingLocale);
}

export default async function LocalizedHome({ params }: Props) {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) notFound();
  const locale = raw as MarketingLocale;
  return (
    <>
      <JsonLd locale={locale} />
      <LandingPage locale={locale} />
    </>
  );
}
