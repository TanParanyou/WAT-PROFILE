"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { formatDate } from "@/utils/formatters";
import type { RegistrationAvailability } from "../types";

export function RegistrationPanel({ slug, availability }: { slug: string; availability?: RegistrationAvailability }) {
  const t = useTranslations("EventDetailPage");
  const locale = useLocale();
  if (!availability?.enabled) return null;
  const count = availability.remaining ?? availability.max_participants;
  return <div className="space-y-4 border-2 border-site-border bg-site-surface p-6">
    <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-site-foreground"><CheckCircle2 size={18} className="shrink-0 text-site-accent" aria-hidden="true" />{t("registrationTitle")}</h3>
    <p className="text-sm leading-6 text-site-body">{t("registrationDesc")}</p>
    {count !== null && count !== undefined ? <div className="text-sm font-semibold text-site-accent">{t("seatsLeft", { count })}</div> : null}
    {availability.deadline ? <div className="flex items-center gap-2 text-xs text-site-muted"><CalendarClock size={14} aria-hidden="true" /><strong>{t("registrationDeadline")}</strong>{formatDate(availability.deadline, locale)}</div> : null}
    {availability.can_register ? <Link href={`/events/${slug}/register`} className="inline-flex min-h-11 w-full items-center justify-center border border-site-border bg-site-action px-4 text-sm font-semibold text-site-on-action hover:bg-site-action-hover">{t("registerNow")}</Link> : <p className="border border-site-border bg-site-canvas p-3 text-sm text-site-body">{t(`registrationUnavailable.${availability.availability}`)}</p>}
  </div>;
}
