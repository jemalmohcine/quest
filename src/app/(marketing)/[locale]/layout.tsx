import { notFound } from 'next/navigation';
import { MarketingLangHtml } from '@/components/marketing/marketing-lang-html';
import { isMarketingLocale, type MarketingLocale } from '@/lib/i18n/marketing';

export default async function MarketingLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isMarketingLocale(raw)) notFound();
  const locale = raw as MarketingLocale;

  return (
    <>
      <MarketingLangHtml locale={locale} />
      {children}
    </>
  );
}
