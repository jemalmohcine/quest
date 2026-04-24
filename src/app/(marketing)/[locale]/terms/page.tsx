import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Terms } from '@/features/marketing/Terms';
import { isMarketingLocale, type MarketingLocale } from '@/lib/i18n/marketing';
import { marketingTermsMetadata } from '@/lib/i18n/marketing-metadata';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) return {};
  return marketingTermsMetadata(raw as MarketingLocale);
}

export default async function TermsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) notFound();
  return <Terms locale={raw as MarketingLocale} />;
}
