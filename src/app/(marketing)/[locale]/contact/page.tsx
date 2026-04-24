import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Contact } from '@/features/marketing/Contact';
import { isMarketingLocale, type MarketingLocale } from '@/lib/i18n/marketing';
import { marketingContactMetadata } from '@/lib/i18n/marketing-metadata';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) return {};
  return marketingContactMetadata(raw as MarketingLocale);
}

export default async function ContactPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) notFound();
  return <Contact locale={raw as MarketingLocale} />;
}
