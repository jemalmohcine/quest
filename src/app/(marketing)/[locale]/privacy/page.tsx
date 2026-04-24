import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Privacy } from '@/features/marketing/Privacy';
import { isMarketingLocale, type MarketingLocale } from '@/lib/i18n/marketing';
import { marketingPrivacyMetadata } from '@/lib/i18n/marketing-metadata';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) return {};
  return marketingPrivacyMetadata(raw as MarketingLocale);
}

export default async function PrivacyPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) notFound();
  return <Privacy locale={raw as MarketingLocale} />;
}
