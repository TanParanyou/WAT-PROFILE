"use client";

import {
  Clock3,
  CreditCard,
  Facebook,
  Mail,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { PublicSectionHeading } from "@/components/public/layout/PublicSectionHeading";
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

export function PublicContactPageLayout({
  page,
  locale,
  labels,
  formSlot,
}: PublicContactPageLayoutProps) {
  const t = useTranslations("ContactPage");
  const title = getLocalizedText(page.title, locale);
  const description = getLocalizedText(page.description, locale);
  const address = getLocalizedText(page.body.address, locale);
  const { phone, email, opening_hours: openingHours, transport, map, socials, bank } = page.body;
  const publicTransport = transport.public_transport ?? [];
  const hasOpeningHours = Boolean(
    getLocalizedText(openingHours.days, locale) ||
      getLocalizedText(openingHours.time, locale) ||
      getLocalizedText(openingHours.notice, locale),
  );
  const hasTransport = Boolean(
    getLocalizedText(transport.parking, locale) ||
      publicTransport.length > 0 ||
      getLocalizedText(transport.driving, locale),
  );
  const socialLinks = [
    { label: "Facebook", href: socials.facebook },
    { label: "Instagram", href: socials.instagram },
    { label: "YouTube", href: socials.youtube },
    { label: "Messenger", href: socials.messenger },
  ].filter((item) => Boolean(item.href));
  const hasSocials = socialLinks.length > 0 || Boolean(socials.line);
  const hasBank = Boolean(
    getLocalizedText(bank.bank_name, locale) ||
      getLocalizedText(bank.account_name, locale) ||
      bank.account_number ||
      bank.iban ||
      bank.bic,
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader variant="color" align="left" title={title} subtitle={description} />
      <PageContainer width="content">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-16">
          <section className="lg:col-start-1 lg:row-start-1" aria-labelledby="visit-heading">
            <PublicSectionHeading id="visit-heading" title={labels.infoTitle} />
            <div className="mt-8 space-y-7">
              {address ? (
                <InfoRow icon={<MapPin size={20} aria-hidden="true" />} title={labels.address}>
                  <p>{address}</p>
                  {map.directions_url ? (
                    <a
                      href={map.directions_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex min-h-11 items-center bg-site-action px-5 py-[13px] text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                    >
                      {t("directions")}
                    </a>
                  ) : null}
                </InfoRow>
              ) : null}
              {phone ? (
                <InfoRow icon={<Phone size={20} aria-hidden="true" />} title={labels.phone}>
                  <a
                    href={`tel:${phone}`}
                    className="underline decoration-primary/40 underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {phone}
                  </a>
                </InfoRow>
              ) : null}
              {email ? (
                <InfoRow icon={<Mail size={20} aria-hidden="true" />} title={labels.email}>
                  <a
                    href={`mailto:${email}`}
                    className="break-all underline decoration-primary/40 underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {email}
                  </a>
                </InfoRow>
              ) : null}
              {hasOpeningHours ? (
                <InfoRow icon={<Clock3 size={20} aria-hidden="true" />} title={t("openingHours")}>
                  <div className="space-y-1">
                    {getLocalizedText(openingHours.days, locale) ? (
                      <p>{getLocalizedText(openingHours.days, locale)}</p>
                    ) : null}
                    {getLocalizedText(openingHours.time, locale) ? (
                      <p>{getLocalizedText(openingHours.time, locale)}</p>
                    ) : null}
                    {getLocalizedText(openingHours.notice, locale) ? (
                      <p className="text-sm text-text-700">
                        {getLocalizedText(openingHours.notice, locale)}
                      </p>
                    ) : null}
                  </div>
                </InfoRow>
              ) : null}
              {hasTransport ? (
                <InfoRow icon={<Navigation size={20} aria-hidden="true" />} title={t("transport")}>
                  <div className="space-y-4">
                    {getLocalizedText(transport.parking, locale) ? (
                      <InfoGroup title={t("parking")}>
                        {getLocalizedText(transport.parking, locale)}
                      </InfoGroup>
                    ) : null}
                    {publicTransport.length > 0 ? (
                      <div>
                        <h3 className="font-semibold text-text-900">{t("publicTransport")}</h3>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {publicTransport.map((item, index) => {
                            const itemText = getLocalizedText(item, locale);
                            return itemText ? <li key={`${itemText}-${index}`}>{itemText}</li> : null;
                          })}
                        </ul>
                      </div>
                    ) : null}
                    {getLocalizedText(transport.driving, locale) ? (
                      <InfoGroup title={t("driving")}>
                        {getLocalizedText(transport.driving, locale)}
                      </InfoGroup>
                    ) : null}
                  </div>
                </InfoRow>
              ) : null}
            </div>
          </section>

          {map.embed_url ? (
            <section className="lg:col-span-2 lg:row-start-2" aria-labelledby="map-heading">
              <PublicSectionHeading id="map-heading" title={t("map")} />
              <div className="mt-7 overflow-hidden border border-site-border bg-site-canvas">
                <iframe
                  src={map.embed_url}
                  width="100%"
                  height="360"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={getLocalizedText(map.name, locale) || t("map")}
                />
              </div>
            </section>
          ) : null}

          <section className="lg:col-start-2 lg:row-start-1" aria-labelledby="contact-form-heading">
            <PublicSectionHeading id="contact-form-heading" title={labels.formTitle} />
            <div className="mt-8 border border-site-border bg-site-canvas p-6 md:p-8">
              {page.body.contact_form.enabled ? (
                formSlot
              ) : (
                <p className="py-10 text-center text-text-700">{t("formDisabled")}</p>
              )}
            </div>
          </section>

          {hasSocials || hasBank ? (
            <section className="border-t border-primary/15 pt-12 lg:col-span-2 lg:row-start-3">
              <div className="grid gap-10 md:grid-cols-2">
                {hasSocials ? (
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-text-900">{labels.social}</h2>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {socialLinks.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-4 py-2 text-sm font-semibold text-site-foreground hover:bg-site-surface hover:text-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                        >
                          <Facebook size={16} aria-hidden="true" />
                          {item.label}
                        </a>
                      ))}
                      {socials.line ? (
                        <span className="inline-flex min-h-11 items-center border border-site-border bg-site-canvas px-4 py-2 text-sm text-site-foreground">
                          LINE: {socials.line}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {hasBank ? (
                  <div>
                    <h2 className="flex items-center gap-3 font-heading text-2xl font-bold text-text-900">
                      <CreditCard size={22} aria-hidden="true" />
                      {labels.bank}
                    </h2>
                    <dl className="mt-5 grid gap-2 text-sm text-text-800">
                      {getLocalizedText(bank.bank_name, locale) ? (
                        <div>{getLocalizedText(bank.bank_name, locale)}</div>
                      ) : null}
                      {getLocalizedText(bank.account_name, locale) ? (
                        <div>{getLocalizedText(bank.account_name, locale)}</div>
                      ) : null}
                      {bank.account_number ? <div>{bank.account_number}</div> : null}
                      {bank.iban ? <div className="break-all font-mono">IBAN: {bank.iban}</div> : null}
                      {bank.bic ? <div className="break-all font-mono">BIC: {bank.bic}</div> : null}
                    </dl>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </PageContainer>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[44px_minmax(0,1fr)]">
      <div className="flex h-11 w-11 items-center justify-center border border-site-border bg-site-canvas text-site-accent">
        {icon}
      </div>
      <div>
        <h3 className="font-heading text-lg font-bold text-text-900">{title}</h3>
        <div className="mt-1 leading-7 text-text-800">{children}</div>
      </div>
    </div>
  );
}

function InfoGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-text-900">{title}</h3>
      <p className="mt-1">{children}</p>
    </div>
  );
}
