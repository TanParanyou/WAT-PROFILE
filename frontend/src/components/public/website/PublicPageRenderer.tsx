"use client";

import type { PublicContentPage } from "@/types/website-cms";
import { getLocalizedText } from "@/utils/localizedText";
import { PublicSectionRenderer } from "@/components/public/website/PublicSectionRenderer";

export function PublicPageRenderer({ page, locale }: { page: PublicContentPage; locale: string }) {
  return (
    <article className="min-h-[640px] bg-white text-zinc-950">
      <header className="border-b border-zinc-200 px-5 md:px-8">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4">
          <div>
            <div className="font-semibold">Wat Loung Por Sai</div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{page.slug}</div>
          </div>
          <nav className="hidden gap-5 text-sm text-zinc-600 md:flex">
          <span>Home</span>
          <span>About</span>
          <span>Events</span>
          <span>Gallery</span>
          <span>Contact</span>
          </nav>
        </div>
      </header>
      <section className="border-b border-zinc-200 bg-white px-5 py-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">{page.page_key}</p>
          <h1 className="mt-3 text-2xl font-semibold text-zinc-950 md:text-3xl">{getLocalizedText(page.title, locale)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 md:text-base">{getLocalizedText(page.description, locale)}</p>
        </div>
      </section>
      {page.sections.map((section) => (
        <PublicSectionRenderer key={section.id} section={section} locale={locale} />
      ))}
      <footer className="px-5 py-6 text-sm text-zinc-500 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>Wat Loung Por Sai</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{page.status}</span>
        </div>
      </footer>
    </article>
  );
}
