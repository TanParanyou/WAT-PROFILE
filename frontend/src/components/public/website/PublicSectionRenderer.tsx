"use client";

import { ArrowUpRight, Clock3, MapPin, Mail, Phone } from "lucide-react";
import type { ContentSection } from "@/types/website-cms";
import { getLocalizedText } from "@/utils/localizedText";
import contactData from "@/data/contact.json";

export function PublicSectionRenderer({ section, locale }: { section: ContentSection; locale: string }) {
  const title = getLocalizedText(section.title, locale);
  const description = getLocalizedText(section.description, locale);

  switch (section.section_type) {
    case "hero": {
      const eyebrow = readString(section.body.eyebrow) || section.section_key;
      const ctaLabel = readString(section.settings.cta_label) || "Get directions";
      const ctaHref = readString(section.settings.cta_href) || contactData.transport.directionsUrl;
      const tone = readString(section.settings.tone);

      return (
        <section className={tone === "highlight" ? "border-b border-zinc-200 bg-zinc-100 px-6 py-10 md:px-8 md:py-14" : "border-b border-zinc-200 bg-zinc-50 px-6 py-10 md:px-8 md:py-14"}>
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</p>
            <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)] md:items-end">
              <div>
                <h1 className="text-3xl font-semibold leading-tight text-zinc-950 md:text-5xl">{title}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 md:text-base">{description}</p>
              </div>
              <div className="flex md:justify-end">
                <a
                  href={ctaHref}
                  className="inline-flex h-11 items-center gap-2 border border-zinc-950 bg-zinc-950 px-4 text-sm font-medium text-white"
                >
                  {ctaLabel}
                  <ArrowUpRight size={15} />
                </a>
              </div>
            </div>
          </div>
        </section>
      );
    }
    case "contact_info": {
      const address = readString(section.body.address) || getLocalizedText(contactData.address, locale);
      const phone = readString(section.body.phone) || contactData.phone;
      const email = readString(section.body.email) || contactData.email;
      const showMap = readBoolean(section.settings.show_map, true);
      const showSocial = readBoolean(section.settings.show_social, true);
      const showBank = readBoolean(section.settings.show_bank, false);

      return (
        <section className="border-b border-zinc-200 px-6 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 md:text-base">{description}</p>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={<MapPin size={16} />} label="Address" value={address} />
                <InfoCard icon={<Phone size={16} />} label="Phone" value={phone} />
                <InfoCard icon={<Mail size={16} />} label="Email" value={email} />
                <InfoCard
                  icon={<Clock3 size={16} />}
                  label="Opening hours"
                  value={`${getLocalizedText(contactData.openingHours.days, locale)} · ${contactData.openingHours.time}`}
                  detail={getLocalizedText(contactData.openingHours.remark, locale)}
                />
              </div>
              <div className="space-y-4">
                {showMap ? (
                  <div className="border border-zinc-200 bg-zinc-50 p-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Directions</div>
                    <p className="mt-2 text-sm text-zinc-600">{getLocalizedText(contactData.transport.car.text, locale)}</p>
                    <a
                      href={readString(section.settings.map_url) || contactData.transport.directionsUrl}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-950"
                    >
                      Open map
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ) : null}
                {showSocial ? (
                  <div className="border border-zinc-200 bg-white p-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Social</div>
                    <div className="mt-3 space-y-2 text-sm text-zinc-600">
                      <p>Facebook: {contactData.social.facebook}</p>
                      <p>Instagram: {contactData.social.instagram}</p>
                      <p>Messenger: {contactData.social.messenger}</p>
                    </div>
                  </div>
                ) : null}
                {showBank ? (
                  <div className="border border-zinc-200 bg-white p-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Bank</div>
                    <div className="mt-3 space-y-1 text-sm text-zinc-600">
                      <p>{contactData.bank.name}</p>
                      <p>IBAN: {contactData.bank.iban}</p>
                      <p>BIC: {contactData.bank.bic}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      );
    }
    case "contact_form": {
      const enabled = readBoolean(section.settings.enabled, true);
      const submitLabel = readString(section.settings.submit_label) || "Send message";
      const destinationLabel = readString(section.settings.destination_label) || "Temple office";
      const successMessage = readString(section.settings.success_message) || "Messages are reviewed during office hours.";

      return (
        <section className="border-b border-zinc-200 bg-zinc-50 px-6 py-8 md:px-8 md:py-10">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 md:text-base">{description}</p>
              <div className="mt-6 border border-zinc-200 bg-white p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Destination</div>
                <p className="mt-2 text-sm text-zinc-600">{destinationLabel}</p>
                <p className="mt-2 text-sm text-zinc-500">{successMessage}</p>
              </div>
            </div>
            <div className="border border-zinc-200 bg-white p-4">
              {enabled ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldMock label="Name" />
                  <FieldMock label="Email" />
                  <FieldMock label="Phone" />
                  <FieldMock label="Subject" />
                  <FieldMock label="Message" large className="md:col-span-2" />
                  <div className="md:col-span-2">
                    <div className="inline-flex h-11 items-center bg-zinc-950 px-5 text-sm font-medium text-white">
                      {submitLabel}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-48 items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                  Contact form is disabled. The public page will show the surrounding copy only.
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }
    case "rich_text": {
      const markdown = readString(section.body.markdown) || description;
      const width = readString(section.settings.width) || "regular";
      const widthClass =
        width === "narrow" ? "max-w-2xl" : width === "wide" ? "max-w-5xl" : "max-w-3xl";

      return (
        <section className="border-b border-zinc-200 px-6 py-8 md:px-8 md:py-10">
          <div className={`mx-auto ${widthClass}`}>
            <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-600 md:text-base">
              {markdown.split(/\n{2,}/).map((paragraph, index) => (
                <p key={`${section.id}-${index}`}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case "map": {
      const address = readString(section.body.address) || getLocalizedText(contactData.address, locale);
      const directionsUrl = readString(section.body.directions_url) || contactData.transport.directionsUrl;
      const showDirections = readBoolean(section.settings.show_directions, true);

      return (
        <section className="border-b border-zinc-200 px-6 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 md:text-base">{description}</p>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <div className="grid min-h-72 place-items-center border border-zinc-300 bg-zinc-100 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                Map preview
              </div>
              <div className="border border-zinc-200 bg-white p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Location</div>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{address}</p>
                {showDirections ? (
                  <a href={directionsUrl} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-950">
                    Get directions
                    <ArrowUpRight size={14} />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      );
    }
    default:
      return (
        <section className="border-b border-dashed border-zinc-300 px-6 py-6 md:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">{section.section_type}</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-950">{title}</h2>
            <p className="mt-2 text-zinc-600">{description}</p>
          </div>
        </section>
      );
  }
}

function InfoCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm leading-7 text-zinc-600">{value}</div>
      {detail ? <div className="mt-2 text-sm text-zinc-500">{detail}</div> : null}
    </div>
  );
}

function FieldMock({ label, large, className }: { label: string; large?: boolean; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className={large ? "min-h-28 border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-400" : "h-11 border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-400"} />
    </div>
  );
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "";
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}
