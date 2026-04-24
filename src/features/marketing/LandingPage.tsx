'use client';

import { Logo } from '@/components/Logo';
import { MarketingLanguageSwitcher } from '@/components/marketing/marketing-language-switcher';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionTemplate,
  type Variants,
} from 'motion/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getMarketingCopy, marketingHref, type MarketingLocale } from '@/lib/i18n/marketing';
import {
  Sparkles,
  Activity,
  Brain,
  Zap,
  Heart,
  LayoutDashboard,
  History,
  BarChart3,
  FileText,
  MoreHorizontal,
  Check,
} from 'lucide-react';

const IN_VIEW = { once: true, amount: 0.2, margin: '0px 0px -10% 0px' } as const;

const pillarVisual = [
  { Icon: Sparkles, bar: 'border-violet-500/40 bg-violet-500/[0.07]', dot: 'bg-violet-400', glow: 'group-hover:shadow-[0_0_32px_-4px_rgba(167,139,250,0.35)]' },
  { Icon: Activity, bar: 'border-emerald-500/40 bg-emerald-500/[0.07]', dot: 'bg-emerald-400', glow: 'group-hover:shadow-[0_0_32px_-4px_rgba(52,211,153,0.3)]' },
  { Icon: Brain, bar: 'border-blue-500/40 bg-blue-500/[0.07]', dot: 'bg-blue-400', glow: 'group-hover:shadow-[0_0_32px_-4px_rgba(96,165,250,0.3)]' },
  { Icon: Zap, bar: 'border-orange-500/40 bg-orange-500/[0.07]', dot: 'bg-orange-400', glow: 'group-hover:shadow-[0_0_32px_-4px_rgba(251,146,60,0.28)]' },
  { Icon: Heart, bar: 'border-pink-500/40 bg-pink-500/[0.07]', dot: 'bg-pink-400', glow: 'group-hover:shadow-[0_0_32px_-4px_rgba(244,114,182,0.28)]' },
] as const;

const spring = { type: 'spring', stiffness: 120, damping: 26, mass: 0.9 } as const;
const easeOut = [0.22, 1, 0.36, 1] as const;

export function LandingPage({ locale }: { locale: MarketingLocale }) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const headerBgOpacity = useTransform(scrollY, [0, 100], reduceMotion ? [0.88, 0.92] : [0.78, 0.94]);
  const headerBlur = useTransform(scrollY, [0, 100], reduceMotion ? [12, 16] : [8, 20]);
  const headerBorder = useTransform(scrollY, [0, 80], [0.35, 0.65]);
  const headerStyle = {
    backgroundColor: useMotionTemplate`rgb(9 9 11 / ${headerBgOpacity})`,
    backdropFilter: useMotionTemplate`blur(${headerBlur}px)`,
    borderBottomColor: useMotionTemplate`rgb(39 39 42 / ${headerBorder})`,
  };

  const fadeUp = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.55, ease: easeOut };

  const copy = getMarketingCopy(locale);
  const h = (segment: '' | 'contact' | 'privacy' | 'terms' | 'scientific-method') => marketingHref(locale, segment);

  const pillars = [copy.pillarSoul, copy.pillarHealth, copy.pillarMind, copy.pillarSkill, copy.pillarHeart] as const;
  const NavIcons = [LayoutDashboard, History, BarChart3, FileText, MoreHorizontal];

  const heroStagger: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.09, delayChildren: 0.06 },
        },
      };

  const heroItem: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: spring },
      };

  const chartHeights = [28, 45, 32, 60, 38, 52, 88];
  const miniBars = [40, 65, 45, 80, 55, 90, 70];

  return (
    <div lang={copy.htmlLang} className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Fond premium : halos animés + grille */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        {!reduceMotion && (
          <>
            <motion.div
              className="absolute -left-[20%] top-[-10%] h-[55vh] w-[70vw] rounded-full bg-indigo-600/[0.14] blur-[100px]"
              animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.75, 0.55] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -right-[15%] top-[25%] h-[45vh] w-[55vw] rounded-full bg-violet-600/[0.1] blur-[90px]"
              animate={{ scale: [1.04, 1, 1.04], opacity: [0.45, 0.65, 0.45] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-[-20%] left-1/3 h-[40vh] w-[60vw] rounded-full bg-indigo-500/[0.08] blur-[110px]"
              animate={{ x: ['-3%', '3%', '-3%'] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            />
          </>
        )}
        {reduceMotion && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(79,70,229,0.16),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_90%_40%,rgba(124,58,237,0.08),transparent)]" />
          </>
        )}
        <div className="absolute inset-0 kinetic-grid opacity-[0.06]" />
      </div>

      <motion.header
        style={headerStyle}
        className="sticky top-0 z-50 border-b border-zinc-800/50"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <motion.div whileHover={reduceMotion ? {} : { scale: 1.02 }} whileTap={reduceMotion ? {} : { scale: 0.98 }} transition={spring}>
            <Link href={h('')} className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-600/30">
                <Logo size={22} className="text-white" />
              </div>
              <span className="font-headline text-lg font-bold tracking-tight text-white truncate">Quest</span>
            </Link>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            {[
              [h('scientific-method'), copy.nav.method],
              [h('contact'), copy.nav.contact],
              [h('privacy'), copy.nav.privacy],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="relative transition-colors hover:text-white group">
                <span>{label}</span>
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-indigo-400 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <MarketingLanguageSwitcher
              locale={locale}
              ariaLabel={copy.langSwitch.label}
              labelFr={copy.langSwitch.toFr}
              labelEn={copy.langSwitch.toEn}
            />
            <Link href="/login" className="hidden sm:inline text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              {copy.nav.login}
            </Link>
            <motion.div whileHover={reduceMotion ? {} : { scale: 1.03 }} whileTap={reduceMotion ? {} : { scale: 0.97 }} transition={spring}>
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-[box-shadow] hover:shadow-indigo-500/40"
              >
                {copy.nav.signUp}
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main>
        <section className="relative mx-auto max-w-6xl px-5 pt-14 pb-20 md:px-8 md:pt-18 md:pb-28">
          <motion.div variants={heroStagger} initial="hidden" animate="show" className="relative">
            <motion.p
              variants={heroItem}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-sm"
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                aria-hidden
                animate={reduceMotion ? {} : { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              {copy.hero.badge}
            </motion.p>
            <motion.h1
              variants={heroItem}
              className="font-headline text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.08]"
            >
              {copy.hero.titleLine1}{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {copy.hero.titleLine2}
              </span>
            </motion.h1>
            <motion.div variants={heroItem} className="mt-8 max-w-2xl space-y-4 text-lg text-zinc-400 leading-relaxed">
              <p>
                <span className="font-semibold text-zinc-100">{copy.hero.p1Brand}</span>
                {copy.hero.p1BeforeActs}
                <span className="font-semibold text-zinc-200">{copy.hero.p1Acts}</span>
                {copy.hero.p1Middle}
                <span className="font-semibold text-zinc-200">{copy.hero.p1Pillars}</span>
                {copy.hero.p1After}
              </p>
              <p className="text-base md:text-lg">
                {copy.hero.p2BeforeGoal}
                <span className="text-zinc-300">{copy.hero.p2Goal}</span>
                {copy.hero.p2Middle}
                <span className="text-zinc-300">{copy.hero.p2Summary}</span>
                {copy.hero.p2After}
              </p>
            </motion.div>
            <motion.div variants={heroItem} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.div whileHover={reduceMotion ? {} : { y: -2 }} whileTap={reduceMotion ? {} : { scale: 0.98 }} transition={spring}>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 text-sm font-semibold text-white shadow-xl shadow-indigo-600/25 transition-shadow hover:shadow-indigo-500/35"
                >
                  {copy.hero.ctaPrimary}
                </Link>
              </motion.div>
              <motion.div whileHover={reduceMotion ? {} : { y: -2 }} whileTap={reduceMotion ? {} : { scale: 0.98 }} transition={spring}>
                <Link
                  href="#how"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-600/80 bg-white/[0.03] px-8 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition-colors hover:border-zinc-500 hover:bg-white/[0.06]"
                >
                  {copy.hero.ctaSecondary}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        <section id="how" className="border-y border-white/[0.06] bg-white/[0.02] py-16 md:py-24 backdrop-blur-[2px]">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={IN_VIEW} transition={fadeUp}>
              <h2 className="font-headline text-2xl font-bold tracking-tight text-white md:text-3xl">{copy.how.title}</h2>
              <p className="mt-4 max-w-2xl text-zinc-400 leading-relaxed">{copy.how.intro}</p>
            </motion.div>
            <ol className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
              {copy.how.steps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={IN_VIEW}
                  transition={{ ...fadeUp, delay: reduceMotion ? 0 : i * 0.1 }}
                  whileHover={reduceMotion ? {} : { y: -4 }}
                  className="group rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-6 shadow-xl shadow-black/20 transition-shadow duration-300 hover:border-white/[0.1] hover:shadow-indigo-950/20 md:p-8"
                >
                  <motion.span
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-bold text-indigo-300 ring-1 ring-indigo-400/20"
                    whileHover={reduceMotion ? {} : { scale: 1.08, rotate: -3 }}
                    transition={spring}
                  >
                    {i + 1}
                  </motion.span>
                  <h3 className="mt-5 font-headline text-base font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{step.body}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pillars" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={IN_VIEW}
              transition={fadeUp}
              className="max-w-2xl"
            >
              <h2 className="font-headline text-2xl font-bold tracking-tight text-white md:text-3xl">{copy.pillars.title}</h2>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                {copy.pillars.intro}
                <span className="text-zinc-200">{copy.pillars.introHighlight}</span>
                {copy.pillars.introEnd}
              </p>
            </motion.div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {pillars.map((pillar, i) => {
                const { Icon, bar, dot, glow } = pillarVisual[i];
                const tags = 'tag1' in pillar ? [pillar.tag1, pillar.tag2] : [];
                return (
                  <motion.article
                    key={pillar.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={IN_VIEW}
                    transition={{ ...fadeUp, delay: reduceMotion ? 0 : i * 0.07 }}
                    whileHover={reduceMotion ? {} : { y: -6, transition: spring }}
                    className={cn(
                      'group flex flex-col rounded-2xl border bg-zinc-950/50 p-5 transition-shadow duration-300 md:p-6',
                      bar,
                      glow,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]', dot)} aria-hidden />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{pillar.label}</span>
                    </div>
                    <motion.div whileHover={reduceMotion ? {} : { rotate: [0, -8, 8, 0] }} transition={{ duration: 0.5 }}>
                      <Icon className="mt-4 h-6 w-6 text-zinc-300" aria-hidden />
                    </motion.div>
                    <h3 className="mt-3 font-headline text-lg font-bold text-white">{pillar.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-zinc-400 leading-relaxed">{pillar.body}</p>
                    {tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 md:grid-cols-2 md:items-center md:gap-16 md:px-8">
            <motion.div
              initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={IN_VIEW}
              transition={fadeUp}
            >
              <motion.div
                whileHover={reduceMotion ? {} : { scale: 1.01 }}
                transition={spring}
                className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-6 shadow-2xl shadow-black/40 backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/30">
                    <Sparkles className="h-5 w-5 text-indigo-300" />
                  </div>
                  <h3 className="font-headline text-sm font-bold text-white">{copy.ai.mockTitle}</h3>
                </div>
                <blockquote className="mt-6 border-l-2 border-indigo-400/80 pl-4 text-sm italic text-zinc-400 leading-relaxed">
                  {copy.ai.mockQuote}
                </blockquote>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-600">{copy.ai.mockDisclaimer}</p>
                <p className="mt-6 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{copy.ai.chartCaption}</p>
                <div className="mt-3 flex h-24 items-end gap-1.5">
                  {miniBars.map((pct, j) => (
                    <motion.div
                      key={j}
                      initial={{ height: reduceMotion ? `${pct}%` : 0 }}
                      whileInView={{ height: `${pct}%` }}
                      viewport={IN_VIEW}
                      transition={{ ...spring, delay: reduceMotion ? 0 : 0.15 + j * 0.05 }}
                      className="flex-1 rounded-t bg-gradient-to-t from-indigo-600/50 to-indigo-400/30"
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={IN_VIEW}
              transition={fadeUp}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">{copy.ai.kicker}</p>
              <h2 className="mt-3 font-headline text-2xl font-bold tracking-tight text-white md:text-3xl">
                {copy.ai.titleLine1}{' '}
                <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">{copy.ai.titleLine2}</span>
              </h2>
              <p className="mt-6 text-zinc-400 leading-relaxed">
                {copy.ai.body}
                <span className="font-semibold text-zinc-100">{copy.ai.bodyBold}</span>
                {copy.ai.bodyAfter}
              </p>
              <ul className="mt-8 space-y-3">
                {copy.ai.bullets.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={IN_VIEW}
                    transition={{ ...fadeUp, delay: reduceMotion ? 0 : 0.1 + i * 0.06 }}
                    className="flex gap-3 text-sm text-zinc-300"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-400/20">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>
              <motion.div whileHover={reduceMotion ? {} : { x: 4 }} transition={spring} className="inline-block">
                <Link
                  href={h('scientific-method')}
                  className="mt-8 inline-flex text-sm font-semibold text-indigo-400 underline-offset-4 hover:text-indigo-300 hover:underline"
                >
                  {copy.ai.linkMethod}
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={IN_VIEW}
              transition={fadeUp}
              className="text-center"
            >
              <h2 className="font-headline text-2xl font-bold tracking-tight text-white md:text-3xl">{copy.dashboard.title}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-zinc-400 leading-relaxed">{copy.dashboard.subtitle}</p>
              <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500">{copy.dashboard.previewCaption}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={IN_VIEW}
              transition={{ ...fadeUp, delay: 0.08 }}
              whileHover={reduceMotion ? {} : { y: -4 }}
              className="mt-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/35 shadow-2xl shadow-black/50 backdrop-blur-sm"
            >
              <div className="flex flex-col md:flex-row md:min-h-[420px]">
                <aside className="w-full border-b border-white/[0.06] p-5 md:w-56 md:border-b-0 md:border-r md:bg-zinc-950/60">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-600/30">
                      <Logo size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-white">Quest</span>
                  </div>
                  <nav className="space-y-1">
                    {copy.dashboard.navLabels.map((label, i) => {
                      const Icon = NavIcons[i] ?? LayoutDashboard;
                      const active = i === 0;
                      return (
                        <div
                          key={label}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                            active
                              ? 'bg-indigo-500/15 font-semibold text-indigo-300 ring-1 ring-indigo-400/20'
                              : 'text-zinc-500',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 opacity-80" />
                          <span>{label}</span>
                        </div>
                      );
                    })}
                  </nav>
                </aside>
                <div className="flex-1 p-6 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-headline text-xl font-bold text-white md:text-2xl">{copy.dashboard.previewStatsTitle}</h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{copy.dashboard.previewStatsSub}</p>
                    </div>
                    <div className="flex rounded-full border border-white/[0.08] bg-zinc-950/80 p-1 text-[10px] font-semibold uppercase shadow-inner">
                      <span className="px-3 py-1 text-zinc-500">{copy.dashboard.day}</span>
                      <span className="rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-1 text-white shadow-md">
                        {copy.dashboard.week}
                      </span>
                    </div>
                  </div>
                  <div className="mt-8 flex h-48 items-end justify-between gap-2 rounded-xl border border-white/[0.06] bg-zinc-950/50 px-4 pb-4 pt-8">
                    {chartHeights.map((height, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ height: reduceMotion ? `${height}%` : '0%' }}
                        whileInView={{ height: `${height}%` }}
                        viewport={IN_VIEW}
                        transition={{ ...spring, delay: reduceMotion ? 0 : 0.2 + idx * 0.06 }}
                        className={cn(
                          'w-full max-w-[2.5rem] rounded-t-md',
                          idx === 6
                            ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                            : 'bg-zinc-800',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] py-16 md:py-22">
          <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
            <motion.div
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={IN_VIEW}
              transition={fadeUp}
            >
              <p className="font-headline text-xl font-medium leading-snug text-zinc-200 md:text-2xl">
                {copy.closing.line1a}
                <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">{copy.closing.line1b}</span>{' '}
                {copy.closing.line2}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {copy.closing.tags.map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={IN_VIEW}
                    transition={{ ...spring, delay: reduceMotion ? 0 : i * 0.05 }}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-500 backdrop-blur-sm"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
              <motion.div
                className="mt-10 inline-block"
                whileHover={reduceMotion ? {} : { scale: 1.04 }}
                whileTap={reduceMotion ? {} : { scale: 0.98 }}
                transition={spring}
              >
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 text-sm font-semibold text-white shadow-xl shadow-indigo-600/30"
                >
                  {copy.hero.ctaPrimary}
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-5 md:flex-row md:px-8">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Logo size={20} className="opacity-80" />
            <span>
              © {new Date().getFullYear()} {copy.footer.tagline}
            </span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-zinc-500">
            {[
              [h('privacy'), copy.footer.privacy],
              [h('terms'), copy.footer.terms],
              [h('scientific-method'), copy.footer.method],
              [h('contact'), copy.footer.contact],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="transition-colors hover:text-indigo-400">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
