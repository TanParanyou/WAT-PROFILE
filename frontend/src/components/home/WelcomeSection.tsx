"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function WelcomeSection() {
  const t = useTranslations("WelcomeSection");
  const tSite = useTranslations("Site");

  return (
    <section className="bg-white py-20 dark:bg-zinc-950"><div className="container mx-auto px-4 md:px-6"><div className="mx-auto max-w-4xl text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}><h2 className="mb-4 font-sans font-medium tracking-wider text-secondary uppercase">{t("welcome")}</h2><h1 className="mb-8 font-heading text-3xl font-bold leading-relaxed text-primary md:text-5xl">{tSite("name")}</h1></motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className="prose prose-lg mx-auto font-light leading-relaxed text-gray-600 dark:prose-invert dark:text-gray-400"><p className="mb-6">{t("description")}</p></motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.4 }} viewport={{ once: true }} className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        {[["🙏", "meditation", "meditationDesc"], ["🏫", "sundaySchool", "sundaySchoolDesc"], ["🌺", "culture", "cultureDesc"]].map(([icon, title, description]) => <div key={title} className="rounded-2xl border border-gray-100 bg-zinc-50 p-6 transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-zinc-900"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">{icon}</div><h3 className="mb-2 font-heading text-lg font-bold">{t(title)}</h3><p className="mx-auto max-w-xs text-sm text-gray-500">{t(description)}</p></div>)}
      </motion.div>
    </div></div></section>
  );
}
