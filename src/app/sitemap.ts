import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { MARKETING_LOCALES } from '@/lib/i18n/marketing';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/+$/, '');
  const marketingPaths = ['', 'contact', 'privacy', 'terms', 'scientific-method'] as const;
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of MARKETING_LOCALES) {
    for (const path of marketingPaths) {
      const suffix = path ? `/${path}` : '';
      entries.push({
        url: `${base}/${locale}${suffix}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1 : 0.7,
      });
    }
  }

  entries.push({
    url: `${base}/login`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  });

  return entries;
}
