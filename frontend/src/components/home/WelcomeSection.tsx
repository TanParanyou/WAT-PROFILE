"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";

const welcomeItems = [
  ["meditation", "meditationDesc"],
  ["sundaySchool", "sundaySchoolDesc"],
  ["culture", "cultureDesc"],
] as const;

const easeOutSmooth = [0.22, 1, 0.36, 1] as const;

export default function WelcomeSection() {
  const t = useTranslations("WelcomeSection");
  const tSite = useTranslations("Site");
  const reduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: reduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: easeOutSmooth,
      },
    },
  };

  return (
    <section className="bg-site-canvas px-6 py-[clamp(4rem,9vw,8rem)] text-site-foreground sm:px-10 lg:px-[8vw]">
      <motion.div
        initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: easeOutSmooth }}
        className="grid gap-10 border-t border-site-border pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      >
        <p className="text-sm text-site-muted">{t("welcome")}</p>
        <div>
          <h2 className="max-w-[18ch] text-balance font-heading text-[clamp(2.3rem,4.8vw,4.7rem)] font-normal leading-[1.14]">
            {tSite("name")}
          </h2>
          <p className="mt-8 max-w-[68ch] text-lg leading-8 text-site-body">
            {t("description")}
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="mt-16 grid border-y border-site-border md:grid-cols-3"
      >
        {welcomeItems.map(([title, description]) => (
          <motion.article
            variants={cardVariants}
            className="border-b border-site-border px-0 py-8 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:not-last:border-r md:last:pr-0"
            key={title}
          >
            <h3 className="text-xl font-medium">{t(title)}</h3>
            <p className="mt-3 leading-7 text-site-body">{t(description)}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
