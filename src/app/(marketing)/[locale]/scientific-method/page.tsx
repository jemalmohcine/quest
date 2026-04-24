import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ScientificMethod } from '@/features/marketing/ScientificMethod';
import { isMarketingLocale, type MarketingLocale } from '@/lib/i18n/marketing';
import { marketingMethodMetadata } from '@/lib/i18n/marketing-metadata';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) return {};
  return marketingMethodMetadata(raw as MarketingLocale);
}

export default async function ScientificMethodPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) notFound();
  return <ScientificMethod locale={raw as MarketingLocale} />;
}
