"use client";

import { CreditCard, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import type { GlobalContactSettings } from "@/types/site-settings";
import type { ContentSection, PublicContentPage } from "@/types/website-cms";
import { getLocalizedText } from "@/utils/localizedText";

interface PublicContactPageLayoutProps {
  page: PublicContentPage;
  locale: string;
  labels: {
    infoEyebrow: string;
    infoTitle: string;
    messageEyebrow: string;
    formTitle: string;
    address: string;
    phone: string;
    email: string;
    social: string;
    bank: string;
  };
  formSlot: React.ReactNode;
  contactSettings: GlobalContactSettings;
}

export function PublicContactPageLayout({ page, locale, labels, formSlot, contactSettings }: PublicContactPageLayoutProps) {
  const heroSection = findSection(page.sections, "hero");
  const contactSection = findSection(page.sections, "contact_info");
  const formSection = findSection(page.sections, "contact_form");

  const heroEyebrow = readString(heroSection?.body.eyebrow) || page.page_key;
  const heroTitle = getLocalizedText(heroSection?.title || page.title, locale);
  const heroDescription = getLocalizedText(heroSection?.description || page.description, locale);
  const address = readString(contactSection?.body.address) || getLocalizedText(contactSettings.address, locale);
  const phone = readString(contactSection?.body.phone) || contactSettings.phone;
  const email = readString(contactSection?.body.email) || contactSettings.email;
  const showSocial = readBoolean(contactSection?.settings.show_social, true);
  const showBank = readBoolean(contactSection?.settings.show_bank, true);

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-950">
      <section className="border-b border-zinc-200 bg-zinc-950 px-6 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300">{heroEyebrow}</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">{heroTitle}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
            {heroDescription}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-0 overflow-hidden border border-zinc-200 bg-white shadow-sm lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
          <div className="border-b border-zinc-200 p-6 md:p-8 lg:border-b-0 lg:border-r">
            <div className="mb-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{labels.infoEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
                {getLocalizedText(contactSection?.title || page.title, locale) || labels.infoTitle}
              </h2>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                {getLocalizedText(contactSection?.description || page.description, locale)}
              </p>
            </div>
            <div className="space-y-6">
              <InfoRow icon={<MapPin size={20} />} title={labels.address} value={address} />
              <InfoRow icon={<Phone size={20} />} title={labels.phone} value={phone} mono />
              <InfoRow icon={<Mail size={20} />} title={labels.email} value={email} mono />
              {showSocial ? (
                <InfoRow
                  icon={<Facebook size={20} />}
                  title={labels.social}
                  value={
                    <div className="space-y-2">
                      {contactSettings.social.facebook ? (
                        <a href={contactSettings.social.facebook} target="_blank" rel="noreferrer" className="block break-all text-zinc-900 underline underline-offset-4">
                          Facebook
                        </a>
                      ) : null}
                      {contactSettings.social.instagram ? (
                        <a href={contactSettings.social.instagram} target="_blank" rel="noreferrer" className="block break-all text-zinc-900 underline underline-offset-4">
                          Instagram
                        </a>
                      ) : null}
                      {contactSettings.social.messenger ? (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Instagram size={14} />
                          <span>{contactSettings.social.messenger}</span>
                        </div>
                      ) : null}
                    </div>
                  }
                />
              ) : null}
              {showBank ? (
                <InfoRow
                  icon={<CreditCard size={20} />}
                  title={labels.bank}
                  value={
                    <div className="space-y-1 text-sm text-zinc-600">
                      <p className="font-medium text-zinc-900">{contactSettings.bank.name}</p>
                      {contactSettings.bank.account ? <p>Account: {contactSettings.bank.account}</p> : null}
                      {contactSettings.bank.iban ? <p className="font-mono">IBAN: {contactSettings.bank.iban}</p> : null}
                      {contactSettings.bank.bic ? <p className="font-mono">BIC: {contactSettings.bank.bic}</p> : null}
                    </div>
                  }
                />
              ) : null}
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{labels.messageEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
                {getLocalizedText(formSection?.title || page.title, locale) || labels.formTitle}
              </h2>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                {getLocalizedText(formSection?.description || page.description, locale)}
              </p>
            </div>
            {formSlot}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  value,
  mono,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[40px_minmax(0,1fr)]">
      <div className="flex h-10 w-10 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-900">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
        <div className={mono ? "mt-1 font-mono text-sm text-zinc-600" : "mt-1 text-sm text-zinc-600"}>{value}</div>
      </div>
    </div>
  );
}

function findSection(sections: ContentSection[], type: string) {
  return sections.find((section) => section.section_type === type);
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "";
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}
