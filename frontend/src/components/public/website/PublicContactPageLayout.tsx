"use client";

import { CreditCard, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import type { ContactContentFormData } from "@/types/public-content";
import { getLocalizedText } from "@/utils/localizedText";

interface PublicContactPageLayoutProps {
  page: ContactContentFormData;
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
}

export function PublicContactPageLayout({ page, locale, labels, formSlot }: PublicContactPageLayoutProps) {
  const heroEyebrow = labels.infoEyebrow;
  const heroTitle = getLocalizedText(page.title, locale);
  const heroDescription = getLocalizedText(page.description, locale);
  const address = getLocalizedText(page.body.address, locale);
  const phone = page.body.phone;
  const email = page.body.email;
  
  const hasSocials = !!(
    page.body.socials.facebook ||
    page.body.socials.instagram ||
    page.body.socials.line ||
    page.body.socials.youtube ||
    page.body.socials.messenger
  );

  const hasBank = !!(
    page.body.bank.bank_name.th ||
    page.body.bank.account_number ||
    page.body.bank.iban
  );

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
                {labels.infoTitle}
              </h2>
            </div>
            <div className="space-y-6">
              {address && <InfoRow icon={<MapPin size={20} />} title={labels.address} value={address} />}
              {phone && <InfoRow icon={<Phone size={20} />} title={labels.phone} value={phone} mono />}
              {email && <InfoRow icon={<Mail size={20} />} title={labels.email} value={email} mono />}
              
              {hasSocials && (
                <InfoRow
                  icon={<Facebook size={20} />}
                  title={labels.social}
                  value={
                    <div className="space-y-2">
                      {page.body.socials.facebook && (
                        <a href={page.body.socials.facebook} target="_blank" rel="noreferrer" className="block break-all text-zinc-900 underline underline-offset-4 text-sm font-medium">
                          Facebook
                        </a>
                      )}
                      {page.body.socials.instagram && (
                        <a href={page.body.socials.instagram} target="_blank" rel="noreferrer" className="block break-all text-zinc-900 underline underline-offset-4 text-sm font-medium">
                          Instagram
                        </a>
                      )}
                      {page.body.socials.youtube && (
                        <a href={page.body.socials.youtube} target="_blank" rel="noreferrer" className="block break-all text-zinc-900 underline underline-offset-4 text-sm font-medium">
                          YouTube
                        </a>
                      )}
                      {page.body.socials.messenger && (
                        <a href={page.body.socials.messenger} target="_blank" rel="noreferrer" className="block break-all text-zinc-900 underline underline-offset-4 text-sm font-medium">
                          Messenger
                        </a>
                      )}
                      {page.body.socials.line && (
                        <div className="text-zinc-600 text-sm">
                          <span>LINE: </span>
                          <span className="font-semibold text-zinc-800">{page.body.socials.line}</span>
                        </div>
                      )}
                    </div>
                  }
                />
              )}

              {hasBank && (
                <InfoRow
                  icon={<CreditCard size={20} />}
                  title={labels.bank}
                  value={
                    <div className="space-y-1 text-sm text-zinc-600">
                      <p className="font-medium text-zinc-900">{getLocalizedText(page.body.bank.bank_name, locale)}</p>
                      <p className="text-xs">Account: {getLocalizedText(page.body.bank.account_name, locale)}</p>
                      {page.body.bank.account_number && <p>Number: {page.body.bank.account_number}</p>}
                      {page.body.bank.iban && <p className="font-mono text-xs">IBAN: {page.body.bank.iban}</p>}
                      {page.body.bank.bic && <p className="font-mono text-xs">BIC: {page.body.bank.bic}</p>}
                    </div>
                  }
                />
              )}
            </div>

            {/* Google Map Embed Iframe */}
            {page.body.map.embed_url && (
              <div className="mt-8 border border-zinc-200 rounded overflow-hidden">
                <iframe
                  src={page.body.map.embed_url}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={getLocalizedText(page.body.map.name, locale) || "Map"}
                />
                {page.body.map.directions_url && (
                  <a
                    href={page.body.map.directions_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center bg-zinc-900 text-white py-2 text-xs font-semibold hover:bg-zinc-800 transition-colors"
                  >
                    ดูเส้นทางบน Google Maps
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">{labels.messageEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
                {labels.formTitle}
              </h2>
            </div>
            {page.body.contact_form.enabled ? formSlot : (
              <div className="text-center py-12 text-zinc-400 border border-dashed border-zinc-200 rounded">
                แบบฟอร์มส่งข้อความถูกปิดใช้งานโดยผู้ดูแลระบบ
              </div>
            )}
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

