"use client";

import { MapPin, Mail, Phone } from "lucide-react";
import type { PublicContentPage } from "@/types/website-cms";
import { getLocalizedText } from "@/utils/localizedText";
import contactData from "@/data/contact.json";

export function ContactPagePreview({ page, locale }: { page: PublicContentPage | null; locale: string }) {
  const isContactPage = page?.slug === "contact";

  return (
    <div className="space-y-4 border border-admin-border bg-admin-surface-muted p-4 rounded-none">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-admin-muted">Preview</p>
        <h3 className="mt-1 text-lg font-semibold text-admin-foreground">
          {page ? getLocalizedText(page.title, locale) : "Contact"}
        </h3>
        {page ? <p className="mt-2 text-sm text-admin-body">{getLocalizedText(page.description, locale)}</p> : null}
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
            <div key={section.id} className="border border-admin-border bg-admin-surface p-3 rounded-none">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-admin-muted">
                {section.section_key}
              </div>
              <div className="mt-1 text-sm font-medium text-admin-foreground">{getLocalizedText(section.title, locale)}</div>
              <div className="mt-1 text-sm text-admin-body">{getLocalizedText(section.description, locale)}</div>
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
      <div className="pt-0.5 text-admin-muted">{icon}</div>
      <div>
        <div className="font-medium text-admin-foreground">{label}</div>
        <div className="text-admin-body">{value}</div>
      </div>
    </div>
  );
}
