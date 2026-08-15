"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import type { EventRegistrationDetail } from "../types";

export function RegistrationSuccess({ registration }: { registration: EventRegistrationDetail }) {
  const t = useTranslations("EventRegistration");
  return (
    <section className="border border-site-border bg-site-surface p-6" role="status" aria-live="polite">
      <CheckCircle2 className="text-site-accent" size={30} aria-hidden="true" />
      <h1 className="mt-4 font-heading text-2xl font-semibold text-site-foreground">{t("successTitle")}</h1>
      <p className="mt-2 text-sm leading-6 text-site-body">{t("successDescription")}</p>
      <dl className="mt-5 grid gap-3 border-y border-site-border py-4 text-sm sm:grid-cols-2">
        <div><dt className="text-site-muted">{t("confirmationCode")}</dt><dd className="font-semibold text-site-foreground">{registration.confirmation_code}</dd></div>
        <div><dt className="text-site-muted">{t("participantCount")}</dt><dd className="font-semibold text-site-foreground">{registration.participant_count}</dd></div>
      </dl>
      <p className="mt-4 text-sm text-site-body">{t("manageEmailHint")}</p>
      <Link href={`/events/${registration.event.slug}`} className="mt-5 inline-flex min-h-11 items-center border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action hover:bg-site-action-hover">{t("backToEvent")}</Link>
    </section>
  );
}
