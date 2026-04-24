/** Évite un crash au build si NEXT_PUBLIC_SITE_URL est vide ou invalide (metadataBase). */
function resolvePublicSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  if (!raw) return 'http://localhost:3000';
  try {
    const withProto = raw.includes('://') ? raw : `https://${raw}`;
    return new URL(withProto).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

export const siteConfig = {
  name: 'Quest',
  title: 'Quest',
  description:
    'Quest t’aide à enregistrer tes actes quotidiens autour de cinq piliers (âme, corps, esprit, compétences, cœur), visualiser ta progression et générer des résumés hebdomadaires.',
  keywords: [
    'productivité',
    'habitudes',
    'bien-être',
    'journal',
    'objectifs',
    'piliers de vie',
    'Quest app',
  ],
  locale: 'fr_FR',
  /** URL canonique du site (SEO, Open Graph). Ex. https://quest.app */
  url: resolvePublicSiteUrl(),
  twitter: '@questapp',
} as const;
