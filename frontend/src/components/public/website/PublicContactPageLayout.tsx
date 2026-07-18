"use client";

import { Clock3, CreditCard, Facebook, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("ContactPage");
  const heroEyebrow = labels.infoEyebrow;
  const heroTitle = getLocalizedText(page.title, locale);
  const heroDescription = getLocalizedText(page.description, locale);
  const address = getLocalizedText(page.body.address, locale);
  const phone = page.body.phone;
  const email = page.body.email;
  const openingHours = page.body.opening_hours;
  const transport = page.body.transport;
  
  const hasOpeningHours = !!(
    getLocalizedText(openingHours.days, locale) ||
    getLocalizedText(openingHours.time, locale) ||
    getLocalizedText(openingHours.notice, locale)
  );

  const hasTransport = !!(
    getLocalizedText(transport.parking, locale) ||
    (transport.public_transport || []).length > 0 ||
    getLocalizedText(transport.driving, locale)
  );

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
              {hasOpeningHours && (
                <InfoRow
                  icon={<Clock3 size={20} />}
                  title={t("openingHours")}
                  value={
                    <div className="space-y-1">
                      {getLocalizedText(openingHours.days, locale) && <p>{getLocalizedText(openingHours.days, locale)}</p>}
                      {getLocalizedText(openingHours.time, locale) && <p>{getLocalizedText(openingHours.time, locale)}</p>}
                      {getLocalizedText(openingHours.notice, locale) && <p className="text-xs text-zinc-500">{getLocalizedText(openingHours.notice, locale)}</p>}
                    </div>
                  }
                />
              )}
              {hasTransport && (
                <InfoRow
                  icon={<Navigation size={20} />}
                  title={t("transport")}
                  value={
                    <div className="space-y-3">
                      {getLocalizedText(transport.parking, locale) && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{t("parking")}</p>
                          <p className="mt-1">{getLocalizedText(transport.parking, locale)}</p>
                        </div>
                      )}
                      {(transport.public_transport || []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{t("publicTransport")}</p>
                          <ul className="mt-1 list-disc space-y-1 pl-5">
                            {(transport.public_transport || []).map((item, index) => {
                              const text = getLocalizedText(item, locale);
                              return text ? <li key={`${text}-${index}`}>{text}</li> : null;
                            })}
                          </ul>
                        </div>
                      )}
                      {getLocalizedText(transport.driving, locale) && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{t("driving")}</p>
                          <p className="mt-1">{getLocalizedText(transport.driving, locale)}</p>
                        </div>
                      )}
                    </div>
                  }
                />
              )}
              
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
              <div className="mt-8 rounded border border-zinc-200">
                <div className="border-b border-zinc-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{t("map")}</p>
                </div>
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
                    {t("directions")}
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
                {t("formDisabled")}
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
