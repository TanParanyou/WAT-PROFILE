"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePublicHomePageQuery } from "@/features/public/content/home";
import { toHomeHeroModel } from "@/features/public/content/home-section";
import { getLocalizedText } from "@/utils/localizedText";

export default function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("HeroSection");
  const tSite = useTranslations("Site");
  const homeQuery = usePublicHomePageQuery();
  const hero = toHomeHeroModel(homeQuery.data ?? null);
  const title = hero.title ? getLocalizedText(hero.title, locale) : tSite("name");
  const description = hero.description ? getLocalizedText(hero.description, locale) : t("inLocation");
  const ctaLabel = hero.ctaLabel ? getLocalizedText(hero.ctaLabel, locale) : t("viewEvents");
  const ctaHref = hero.ctaHref ?? "/events";
  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url(/images/hero-bg.png)" }}><div className="absolute inset-0 z-10 bg-black/60" /></div>
      <div className="relative z-20 mx-auto max-w-4xl px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h2 className="mb-4 font-sans text-xl font-medium tracking-wider text-white md:text-2xl">{t("welcomeTo")}</h2>
          <h1 className="mb-6 font-heading text-5xl font-bold leading-tight text-white md:text-7xl lg:text-8xl">{title}</h1>
          <p className="mb-10 text-lg font-light text-gray-200 md:text-xl">{title}<br className="hidden md:block" />{description}</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row"><Link href={ctaHref} className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-medium text-white transition-all hover:bg-primary/90">{ctaLabel} <ArrowRight size={18} /></Link></div>
        </motion.div>
      </div>
      <motion.div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 text-white/50" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><div className="flex h-10 w-6 justify-center rounded-full border-2 border-white/30 p-1"><div className="h-2 w-1 rounded-full bg-white/50" /></div></motion.div>
      <div className="absolute inset-0 -z-10 bg-zinc-900" />
    </section>
  );
}
