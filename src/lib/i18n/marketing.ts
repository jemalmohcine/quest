export const MARKETING_LOCALES = ['fr', 'en'] as const;
export type MarketingLocale = (typeof MARKETING_LOCALES)[number];

export function isMarketingLocale(value: string): value is MarketingLocale {
  return (MARKETING_LOCALES as readonly string[]).includes(value);
}

/** Préfixe de route : `/fr`, `/en` */
export function marketingBase(locale: MarketingLocale): string {
  return `/${locale}`;
}

export function marketingHref(locale: MarketingLocale, segment: '' | 'contact' | 'privacy' | 'terms' | 'scientific-method'): string {
  const base = marketingBase(locale);
  return segment ? `${base}/${segment}` : base;
}

export type MarketingCopy = {
  htmlLang: string;
  jsonLdLang: string;
  metaTitle: string;
  metaDescription: string;
  nav: { method: string; privacy: string; terms: string; contact: string; login: string; signUp: string };
  langSwitch: { label: string; toEn: string; toFr: string };
  hero: {
    badge: string;
    imageAlt: string;
    titleLine1: string;
    titleLine2: string;
    p1Brand: string;
    p1BeforeActs: string;
    p1Acts: string;
    p1Middle: string;
    p1Pillars: string;
    p1After: string;
    p2BeforeGoal: string;
    p2Goal: string;
    p2Middle: string;
    p2Summary: string;
    p2After: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  how: { title: string; intro: string; steps: { title: string; body: string }[] };
  pillars: { title: string; intro: string; introHighlight: string; introEnd: string };
  pillarSoul: { label: string; title: string; body: string; tag1: string; tag2: string };
  pillarHealth: { label: string; title: string; body: string };
  pillarMind: { label: string; title: string; body: string };
  pillarSkill: { label: string; title: string; body: string };
  pillarHeart: { label: string; title: string; body: string };
  ai: {
    mockTitle: string;
    mockQuote: string;
    mockDisclaimer: string;
    chartCaption: string;
    kicker: string;
    titleLine1: string;
    titleLine2: string;
    body: string;
    bodyBold: string;
    bodyAfter: string;
    bullets: string[];
    linkMethod: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    previewCaption: string;
    navLabels: [string, string, string, string, string];
    previewStatsTitle: string;
    previewStatsSub: string;
    day: string;
    week: string;
  };
  closing: { line1a: string; line1b: string; line2: string; tags: string[] };
  footer: { tagline: string; privacy: string; terms: string; method: string; contact: string };
  legal: { back: string };
  privacy: { title: string; sections: { h: string; p: string }[] };
  terms: { title: string; sections: { h: string; p: string }[] };
  method: { title: string; sections: { h: string; p: string }[] };
  contact: {
    title: string;
    intro: string;
    emailLabel: string;
    secureLabel: string;
    formName: string;
    formEmail: string;
    formMessage: string;
    placeholders: { name: string; email: string; message: string };
    submit: string;
  };
};

export const marketingCopy: Record<MarketingLocale, MarketingCopy> = {
  fr: {
    htmlLang: 'fr',
    jsonLdLang: 'fr-FR',
    metaTitle: 'Quest — Journal d’actes & cinq piliers',
    metaDescription:
      'Enregistre tes actes quotidiens (durée, ressenti, pilier), fixe des objectifs par pilier, visualise ta progression et génère des résumés de semaine.',
    nav: {
      method: 'Méthode',
      privacy: 'Confidentialité',
      terms: 'CGU',
      contact: 'Contact',
      login: 'Connexion',
      signUp: 'Créer un compte',
    },
    langSwitch: { label: 'Langue', toEn: 'English', toFr: 'Français' },
    hero: {
      badge: 'Journal d’actes · 5 piliers · Résumés de semaine',
      imageAlt: 'Vue large de la Terre depuis l’espace — métaphore d’ensemble sur ta semaine',
      titleLine1: 'Note ce que tu fais',
      titleLine2: 'pour progresser chaque jour',
      p1Brand: 'Quest',
      p1BeforeActs: ', c’est une appli simple : tu enregistres des ',
      p1Acts: 'actes',
      p1Middle: ' (sport, travail profond, temps avec les proches, méditation…) avec la durée, le ressenti et une courte note. Chaque acte est rangé dans l’un des ',
      p1Pillars: 'cinq piliers',
      p1After: ' — âme, corps, esprit, compétences, cœur — pour voir où tu investis ton énergie.',
      p2BeforeGoal: 'Tu fixes un ',
      p2Goal: 'objectif du jour',
      p2Middle: ' par pilier, tu suis ta progression sur un tableau de bord et des graphiques, et tu peux générer un ',
      p2Summary: 'résumé de semaine',
      p2After:
        ' à partir de tes actes. Rien de mystique : c’est un carnet structuré, des stats et de l’aide pour prendre du recul.',
      ctaPrimary: 'Commencer gratuitement',
      ctaSecondary: 'Comment ça marche',
    },
    how: {
      title: 'Comment ça marche, concrètement',
      intro:
        'Pas de jargon : tu ouvres l’app, tu ajoutes un acte quand tu as fait quelque chose d’important pour toi. Quest t’aide à ne rien oublier et à voir la tendance sur plusieurs semaines.',
      steps: [
        {
          title: 'Enregistrer un acte',
          body: 'Titre, pilier, durée, ressenti (ex. motivé, calme…) et une note optionnelle. Tu peux aussi utiliser l’assistant vocal pour proposer un brouillon à valider.',
        },
        {
          title: 'Viser un équilibre',
          body: 'Tu règles un objectif quotidien global et par pilier. Le tableau de bord montre ta journée et tes stats (jour, semaine, mois…).',
        },
        {
          title: 'Lire ta semaine',
          body: 'Un résumé textuel (et option audio) synthétise tes actes de la semaine pour t’aider à comprendre où tu avances vraiment.',
        },
      ],
    },
    pillars: {
      title: 'Les cinq piliers',
      intro:
        'Chaque acte est classé dans un pilier. Ça te permet de voir si tu négliges le sport, les relations, l’apprentissage, etc. Les noms viennent de l’app ; l’idée est simple : ',
      introHighlight: 'répartir ton attention',
      introEnd: ' comme tu le choisis.',
    },
    pillarSoul: {
      label: 'Pilier 01',
      title: 'Soulset',
      body: 'Sens, valeurs, introspection : méditation, gratitude, temps pour te recentrer. Ex. 10 min de respiration, journal du soir.',
      tag1: 'Méditation',
      tag2: 'Sens',
    },
    pillarHealth: {
      label: 'Pilier 02',
      title: 'Healthset',
      body: 'Corps et énergie : sport, sommeil, nutrition, marche. Ex. séance de muscu, étirements, vélo.',
    },
    pillarMind: {
      label: 'Pilier 03',
      title: 'Mindset',
      body: 'Focus, apprentissage, gestion du stress. Ex. bloc de travail profond, lecture, cours en ligne.',
    },
    pillarSkill: {
      label: 'Pilier 04',
      title: 'Skillset',
      body: 'Compétences pro ou perso : projet, pratique régulière. Ex. coder une feature, répéter une langue, préparer une présentation.',
    },
    pillarHeart: {
      label: 'Pilier 05',
      title: 'Heartset',
      body: 'Relations et empathie : famille, amis, communauté. Ex. appel avec un proche, bénévolat, temps de qualité à deux.',
    },
    ai: {
      mockTitle: 'Résumé généré à partir de tes actes',
      mockQuote:
        '« Cette semaine, la moitié de tes actes Mindset étaient du travail profond ; Heartset est resté léger — tu pourrais prévoir un créneau relationnel. »',
      mockDisclaimer: 'Exemple illustratif — le texte réel dépend de tes données.',
      chartCaption: 'Volume par pilier (aperçu)',
      kicker: 'Après plusieurs jours d’usage',
      titleLine1: 'Des résumés pour relire',
      titleLine2: 'ta semaine',
      body: 'L’app envoie tes actes de la semaine à un modèle de langage (côté serveur) qui rédige un ',
      bodyBold: 'texte de synthèse',
      bodyAfter: ' : tendances, piliers mis en avant, idées d’ajustement. Tu peux aussi générer une piste audio à partir du résumé.',
      bullets: [
        'Tes données restent liées à ton compte ; pas de profil public automatique.',
        'Tu peux extraire un acte depuis une phrase vocale, puis le corriger avant enregistrement.',
        'Les graphiques du tableau de bord complètent le texte avec des chiffres.',
      ],
      linkMethod: 'Lire l’approche méthodologique',
    },
    dashboard: {
      title: 'Tableau de bord',
      subtitle:
        'Aperçu du jour, historique, filtres par pilier et graphiques (jour / semaine / mois). Tu vois d’un coup d’œil si tu approches de tes objectifs quotidiens.',
      previewCaption: 'Même menu latéral que dans l’app : onglets identiques à ta session.',
      navLabels: ['Tableau de bord', 'Activités', 'Statistiques', 'Résumés', 'Réglages'],
      previewStatsTitle: 'Statistiques',
      previewStatsSub: 'Analyser ton parcours et ta progression',
      day: 'Jour',
      week: 'Semaine',
    },
    closing: {
      line1a: 'Quest, c’est un ',
      line1b: 'carnet d’actes',
      line2:
        'avec des cases claires : pas une autre app de motivation vide, mais un endroit où tu sais ce que tu as vraiment fait cette semaine.',
      tags: ['Actes & durée', 'Ressenti', '5 piliers', 'Stats', 'Résumé hebdo'],
    },
    footer: {
      tagline: 'Quest — journal d’actes & piliers.',
      privacy: 'Confidentialité',
      terms: 'CGU',
      method: 'Méthode',
      contact: 'Contact',
    },
    legal: { back: 'Retour à Quest' },
    privacy: {
      title: 'Politique de confidentialité',
      sections: [
        {
          h: 'Protection des données',
          p: 'Chez Quest, nous limitons la collecte au nécessaire pour ton compte, tes actes et les résumés générés. Tu restes propriétaire de tes données.',
        },
        {
          h: 'Données traitées',
          p: 'Profil, actes enregistrés (pilier, durée, ressenti, notes), préférences et résumés produits à partir de tes actes.',
        },
        {
          h: 'Tiers (IA)',
          p: 'Les résumés peuvent s’appuyer sur un modèle de langage (ex. Google Gemini) côté serveur. Les contenus envoyés servent à générer ton texte, pas à t’afficher publiquement.',
        },
        {
          h: 'Tes droits',
          p: 'Tu peux exporter ou supprimer tes données depuis l’app, et supprimer ton compte selon les options proposées.',
        },
      ],
    },
    terms: {
      title: 'Conditions d’utilisation',
      sections: [
        {
          h: 'Service',
          p: 'Quest est un outil de suivi personnel : actes, objectifs, statistiques et résumés optionnels. Tu es responsable de l’exactitude de ce que tu enregistres.',
        },
        {
          h: 'Compte',
          p: 'Tu t’engages à fournir des informations de compte valides et à ne pas utiliser le service de manière abusive.',
        },
        {
          h: 'Propriété intellectuelle',
          p: 'La marque et l’interface Quest nous appartiennent. Tes contenus (actes, notes) t’appartiennent.',
        },
        {
          h: 'Limites',
          p: 'Quest t’aide à prendre du recul ; il ne remplace pas un avis médical, juridique ou professionnel.',
        },
      ],
    },
    method: {
      title: 'Méthode',
      sections: [
        {
          h: 'Cinq piliers',
          p: 'Découper son activité en Soulset, Healthset, Mindset, Skillset et Heartset permet de voir où passe le temps et l’énergie, sans tout mélanger.',
        },
        {
          h: 'Résumés',
          p: 'Un modèle de langage lit tes actes agrégés de la semaine et produit un texte de synthèse : c’est une aide à la réflexion, pas une vérité absolue.',
        },
        {
          h: 'Habitudes',
          p: 'Chaque acte enregistré renforce la boucle « preuve → motivation » : le tableau de bord rend la progression visible.',
        },
        {
          h: 'Mesure',
          p: 'Durée, pilier et ressenti donnent des séries simples à visualiser (jour, semaine, mois) pour repérer déséquilibres ou régularité.',
        },
      ],
    },
    contact: {
      title: 'Contact',
      intro: 'Une question sur Quest ? Écris-nous : nous lisons les messages liés au produit et à la confidentialité.',
      emailLabel: 'hello@quest.app',
      secureLabel: 'Chiffrement & bonnes pratiques',
      formName: 'Nom',
      formEmail: 'E-mail',
      formMessage: 'Message',
      placeholders: { name: 'Ton nom', email: 'toi@exemple.com', message: 'Comment pouvons-nous t’aider ?' },
      submit: 'Envoyer',
    },
  },
  en: {
    htmlLang: 'en',
    jsonLdLang: 'en-US',
    metaTitle: 'Quest — Deed log & five life pillars',
    metaDescription:
      'Log daily deeds (duration, feeling, pillar), set per-pillar goals, see your progress on a dashboard, and generate weekly summaries.',
    nav: {
      method: 'Method',
      privacy: 'Privacy',
      terms: 'Terms',
      contact: 'Contact',
      login: 'Log in',
      signUp: 'Create account',
    },
    langSwitch: { label: 'Language', toEn: 'English', toFr: 'Français' },
    hero: {
      badge: 'Deed log · 5 pillars · Weekly summaries',
      imageAlt: 'Wide view of Earth from space — a visual metaphor for seeing your week at a glance',
      titleLine1: 'Log what you do',
      titleLine2: 'to improve a little every day',
      p1Brand: 'Quest',
      p1BeforeActs: ' is a simple app: you record ',
      p1Acts: 'deeds',
      p1Middle:
        ' (workout, deep work, time with people, meditation…) with duration, how you felt, and a short note. Each deed goes into one of ',
      p1Pillars: 'five pillars',
      p1After: ' — soul, body, mind, skills, heart — so you see where your energy goes.',
      p2BeforeGoal: 'You set a ',
      p2Goal: 'daily target',
      p2Middle: ' per pillar, follow progress on a dashboard with charts, and can generate a ',
      p2Summary: 'weekly summary',
      p2After: ' from your deeds. No mystery: it’s a structured log, stats, and help to step back.',
      ctaPrimary: 'Start for free',
      ctaSecondary: 'How it works',
    },
    how: {
      title: 'How it works',
      intro:
        'No jargon: open the app and add a deed when you’ve done something that matters to you. Quest helps you remember and spot trends over weeks.',
      steps: [
        {
          title: 'Log a deed',
          body: 'Title, pillar, duration, feeling (e.g. motivated, calm…) and an optional note. You can also use the voice assistant to draft a deed before saving.',
        },
        {
          title: 'Aim for balance',
          body: 'Set an overall daily goal and per-pillar targets. The dashboard shows your day and stats (day, week, month…).',
        },
        {
          title: 'Read your week',
          body: 'A text summary (and optional audio) synthesizes the week’s deeds so you see where you’re actually moving forward.',
        },
      ],
    },
    pillars: {
      title: 'The five pillars',
      intro:
        'Every deed is tagged with a pillar. That shows if you’re skipping workouts, relationships, learning, etc. Names match the app; the idea is simple: ',
      introHighlight: 'allocate your attention',
      introEnd: ' the way you choose.',
    },
    pillarSoul: {
      label: 'Pillar 01',
      title: 'Soulset',
      body: 'Meaning, values, reflection: meditation, gratitude, time to reset. E.g. 10 min breathing, evening journal.',
      tag1: 'Meditation',
      tag2: 'Purpose',
    },
    pillarHealth: {
      label: 'Pillar 02',
      title: 'Healthset',
      body: 'Body and energy: training, sleep, food, walking. E.g. strength session, stretching, bike ride.',
    },
    pillarMind: {
      label: 'Pillar 03',
      title: 'Mindset',
      body: 'Focus, learning, stress. E.g. deep work block, reading, online course.',
    },
    pillarSkill: {
      label: 'Pillar 04',
      title: 'Skillset',
      body: 'Professional or personal craft: projects, deliberate practice. E.g. ship a feature, language drill, prep a talk.',
    },
    pillarHeart: {
      label: 'Pillar 05',
      title: 'Heartset',
      body: 'Relationships and care: family, friends, community. E.g. call someone you love, volunteering, quality time.',
    },
    ai: {
      mockTitle: 'Summary generated from your deeds',
      mockQuote:
        '“This week, half of your Mindset deeds were deep work; Heartset stayed light — you might schedule relational time.”',
      mockDisclaimer: 'Illustrative example — real text depends on your data.',
      chartCaption: 'Volume by pillar (preview)',
      kicker: 'After a few days of use',
      titleLine1: 'Summaries to reread',
      titleLine2: 'your week',
      body: 'The app sends your week’s deeds to a language model (server-side) that writes a ',
      bodyBold: 'synthesis',
      bodyAfter: ': trends, highlighted pillars, ideas to adjust. You can also generate audio from the summary.',
      bullets: [
        'Your data stays tied to your account; there’s no automatic public profile.',
        'You can extract a deed from a spoken sentence, then edit before saving.',
        'Dashboard charts complement the text with numbers.',
      ],
      linkMethod: 'Read the methodological approach',
    },
    dashboard: {
      title: 'Dashboard',
      subtitle:
        'Today’s snapshot, history, pillar filters, and charts (day / week / month). You see at a glance if you’re near your daily targets.',
      previewCaption: 'Same sidebar as in the app — the same five tabs you use after sign-in.',
      navLabels: ['Dashboard', 'Activities', 'Statistics', 'Resumes', 'Settings'],
      previewStatsTitle: 'Statistics',
      previewStatsSub: 'Analyze your journey and growth',
      day: 'Day',
      week: 'Week',
    },
    closing: {
      line1a: 'Quest is a ',
      line1b: 'deed log',
      line2:
        'with clear fields: not another empty motivation app, but a place where you know what you actually did this week.',
      tags: ['Deeds & duration', 'Feeling', '5 pillars', 'Stats', 'Weekly summary'],
    },
    footer: {
      tagline: 'Quest — deed log & pillars.',
      privacy: 'Privacy',
      terms: 'Terms',
      method: 'Method',
      contact: 'Contact',
    },
    legal: { back: 'Back to Quest' },
    privacy: {
      title: 'Privacy policy',
      sections: [
        {
          h: 'Data protection',
          p: 'We collect only what’s needed for your account, deeds, and generated summaries. You stay in control of your data.',
        },
        {
          h: 'What we process',
          p: 'Profile, logged deeds (pillar, duration, feeling, notes), preferences, and summaries derived from your deeds.',
        },
        {
          h: 'Third parties (AI)',
          p: 'Summaries may use a language model (e.g. Google Gemini) on the server. Content is used to generate your text, not to publish you.',
        },
        {
          h: 'Your rights',
          p: 'You can export or delete data from the app where those options exist, and close your account per product settings.',
        },
      ],
    },
    terms: {
      title: 'Terms of service',
      sections: [
        {
          h: 'The service',
          p: 'Quest is a personal tracking tool: deeds, goals, stats, and optional summaries. You’re responsible for what you log.',
        },
        {
          h: 'Account',
          p: 'You agree to provide valid account details and not abuse the service.',
        },
        {
          h: 'Intellectual property',
          p: 'The Quest brand and interface belong to us. Your content (deeds, notes) belongs to you.',
        },
        {
          h: 'Limits',
          p: 'Quest helps you reflect; it doesn’t replace medical, legal, or professional advice.',
        },
      ],
    },
    method: {
      title: 'Method',
      sections: [
        {
          h: 'Five pillars',
          p: 'Splitting life into Soulset, Healthset, Mindset, Skillset, and Heartset shows where time and energy go without mixing everything.',
        },
        {
          h: 'Summaries',
          p: 'A language model reads your aggregated weekly deeds and writes a synthesis: it’s reflection support, not absolute truth.',
        },
        {
          h: 'Habits',
          p: 'Each logged deed reinforces “proof → motivation”: the dashboard makes progress visible.',
        },
        {
          h: 'Measurement',
          p: 'Duration, pillar, and feeling produce simple series to chart (day, week, month) and spot imbalance or consistency.',
        },
      ],
    },
    contact: {
      title: 'Contact',
      intro: 'Questions about Quest? Write to us — we read product and privacy-related messages.',
      emailLabel: 'hello@quest.app',
      secureLabel: 'Encryption & good practices',
      formName: 'Name',
      formEmail: 'Email',
      formMessage: 'Message',
      placeholders: { name: 'Your name', email: 'you@example.com', message: 'How can we help?' },
      submit: 'Send',
    },
  },
};

export function getMarketingCopy(locale: MarketingLocale): MarketingCopy {
  return marketingCopy[locale];
}
