"use client";

import { MapPin, Mail, Phone } from "lucide-react";
import type { PublicContentPage } from "@/types/website-cms";
import { getLocalizedText } from "@/utils/localizedText";
import contactData from "@/data/contact.json";

export function ContactPagePreview({ page, locale }: { page: PublicContentPage | null; locale: string }) {
  const isContactPage = page?.slug === "contact";

  return (
    <div className="space-y-4 border border-zinc-200 bg-zinc-50 p-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Preview</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-950">
          {page ? getLocalizedText(page.title, locale) : "Contact"}
        </h3>
        {page ? <p className="mt-2 text-sm text-zinc-600">{getLocalizedText(page.description, locale)}</p> : null}
      </div>
      {isContactPage ? (
        <div className="space-y-3">
          <Row icon={<MapPin size={16} />} label="Address" value={getLocalizedText(contactData.address, locale)} />
          <Row icon={<Phone size={16} />} label="Phone" value={contactData.phone} />
          <Row icon={<Mail size={16} />} label="Email" value={contactData.email} />
        </div>
      ) : null}
      {page ? (
        <div className="space-y-2">
          {page.sections.map((section) => (
            <div key={section.id} className="border border-zinc-200 bg-white p-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                {section.section_key}
              </div>
              <div className="mt-1 text-sm font-medium text-zinc-950">{getLocalizedText(section.title, locale)}</div>
              <div className="mt-1 text-sm text-zinc-600">{getLocalizedText(section.description, locale)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[18px_minmax(0,1fr)] gap-3 text-sm">
      <div className="pt-0.5 text-zinc-500">{icon}</div>
      <div>
        <div className="font-medium text-zinc-900">{label}</div>
        <div className="text-zinc-600">{value}</div>
      </div>
    </div>
  );
}
