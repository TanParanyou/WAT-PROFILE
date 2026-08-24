"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { Link } from "@/navigation";
import { formatDateRange, formatTimeRange } from "@/utils/formatters";
import {
  useAccountRegistrationsQuery,
  useCancelAccountRegistration,
  useUpdateAccountRegistration,
} from "../queries";
import { MAX_REGISTRATION_PARTICIPANTS } from "../types";
import type {
  EventRegistrationListItem,
  RegistrationLocale,
  RegistrationParticipantInput,
} from "../types";
import { CopyButton } from "@/components/common/CopyButton";
import { QRCodePass } from "@/components/common/QRCodePass";
import {
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  QrCode,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const primaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 bg-site-action px-6 py-[13px] text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-60";
const secondaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const dangerActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border border-red-700 bg-site-canvas px-6 py-[13px] text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-60";
const inputBase =
  "min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2 text-sm text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";

export function AccountRegistrationsContent() {
  const t = useTranslations("EventRegistration");
  const localeValue = useLocale();
  const locale: RegistrationLocale =
    localeValue === "en" || localeValue === "de" ? localeValue : "th";
  const session = useAccountSession();
  const query = useAccountRegistrationsQuery(session.status === "authenticated");
  const cancel = useCancelAccountRegistration();
  const [editingId, setEditingId] = useState<number | null>(null);

  if (session.status === "loading") {
    return (
      <div role="status" aria-live="polite" className="py-8 text-sm text-site-muted">
        <Loader2 className="inline size-4 animate-spin mr-2" aria-hidden />
        {t("loading")}
      </div>
    );
  }

  if (session.status !== "authenticated") {
    return (
      <div className="border border-site-border bg-site-surface p-6">
        <h2 className="font-heading text-xl font-semibold text-site-foreground">
          {t("accountRegistrationsTitle")}
        </h2>
        <p className="mt-2 text-sm text-site-muted">
          {t("accountRegistrationsLogin")}
        </p>
        <Link
          href="/account/login"
          className={`mt-4 ${primaryActionClass}`}
        >
          {t("signIn")}
        </Link>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div role="status" aria-live="polite" className="py-8 text-sm text-site-muted">
        <Loader2 className="inline size-4 animate-spin mr-2" aria-hidden />
        {t("loading")}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 border border-red-700 bg-red-50 p-4 text-sm text-red-700"
      >
        <AlertCircle className="size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{t("loadErrorTitle")}</p>
          <p className="mt-1">{t("loadErrorDescription")}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className={`mt-3 ${secondaryActionClass}`}
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  const items = query.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-site-foreground">
          {t("accountRegistrationsTitle")}
        </h2>
        <p className="mt-1 text-sm text-site-muted">
          {t("accountRegistrationsSubtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-site-border p-8 text-center">
          <Calendar className="mx-auto size-8 text-site-muted" aria-hidden />
          <p className="mt-3 text-sm text-site-muted">
            {t("accountRegistrationsEmpty")}
          </p>
          <Link
            href="/events"
            className={`mt-4 ${secondaryActionClass}`}
          >
            {t("backToEvent")}
          </Link>
        </div>
      ) : null}

      <div className="space-y-4">
        {items.map((item) => (
          <RegistrationCard
            key={item.id}
            item={item}
            locale={locale}
            editing={editingId === item.id}
            onEdit={() => setEditingId(editingId === item.id ? null : item.id)}
            onCancel={() => {
              if (window.confirm(t("cancelConfirm"))) {
                void cancel.mutateAsync({ id: item.id });
              }
            }}
            cancelPending={cancel.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface RegistrationCardProps {
  item: EventRegistrationListItem;
  locale: RegistrationLocale;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  cancelPending: boolean;
}

function RegistrationCard({
  item,
  locale,
  editing,
  onEdit,
  onCancel,
  cancelPending,
}: RegistrationCardProps) {
  const t = useTranslations("EventRegistration");
  const update = useUpdateAccountRegistration();
  const [showQr, setShowQr] = useState(false);
  const [firstName, setFirstName] = useState(item.contact.first_name);
  const [lastName, setLastName] = useState(item.contact.last_name);
  const [phone, setPhone] = useState(item.contact.phone);
  const [participants, setParticipants] = useState<RegistrationParticipantInput[]>(() =>
    item.participants
      .filter((participant) => participant.attendance_status !== "cancelled")
      .map(toParticipantInput),
  );

  const setParticipantField = (
    index: number,
    field: keyof RegistrationParticipantInput,
    value: string,
  ) => {
    setParticipants((current) =>
      current.map((participant, currentIndex) =>
        currentIndex === index ? { ...participant, [field]: value } : participant,
      ),
    );
  };

  const statusBg =
    item.registration_status === "confirmed"
      ? "border-emerald-700 bg-emerald-50 text-emerald-800"
      : item.registration_status === "cancelled"
        ? "border-red-700 bg-red-50 text-red-800"
        : "border-site-border bg-site-surface text-site-foreground";

  const dateFormatted = formatDateRange(item.event.start_date, item.event.end_date, locale);
  const timeFormatted = formatTimeRange(item.event.start_time, item.event.end_time, locale);

  return (
    <article className="border border-site-border bg-site-canvas p-5 sm:p-6 transition-colors hover:border-site-border/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold text-site-foreground">
            {item.event.title[locale] || item.event.title.th || item.event.title.en}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-site-muted">
            <span>{item.contact.email}</span>
            {item.confirmation_code ? (
              <div className="flex items-center gap-1.5 font-mono">
                <span>{t("confirmationCode")}:</span>
                <strong className="text-site-foreground">{item.confirmation_code}</strong>
                <CopyButton
                  text={item.confirmation_code}
                  label={t("copyCode")}
                  copiedLabel={t("codeCopied")}
                  variant="inline"
                />
              </div>
            ) : null}
          </div>
        </div>
        <span
          className={`border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${statusBg}`}
        >
          {t(`status.${item.registration_status}`)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-site-muted sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0 text-site-accent" aria-hidden />
          <span>
            {dateFormatted}
            {timeFormatted && timeFormatted !== "-" ? ` • ${timeFormatted}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4 shrink-0" aria-hidden />
          <span>
            {t("participantCount")}: {item.participant_count}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-site-border pt-3">
        {item.confirmation_code ? (
          <button
            type="button"
            onClick={() => setShowQr((prev) => !prev)}
            className="inline-flex min-h-9 items-center gap-1.5 border border-site-border bg-site-surface px-3 py-1.5 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
          >
            <QrCode className="size-3.5 text-site-accent" aria-hidden />
            <span>{showQr ? t("hideQrCode") : t("showQrCode")}</span>
            {showQr ? (
              <ChevronUp className="size-3 text-site-muted" aria-hidden />
            ) : (
              <ChevronDown className="size-3 text-site-muted" aria-hidden />
            )}
          </button>
        ) : <div />}

        {item.event.slug ? (
          <Link
            href={`/events/${item.event.slug}`}
            className="text-xs font-medium text-site-accent underline hover:text-site-foreground focus-visible:outline-site-focus"
          >
            {t("backToEvent")} →
          </Link>
        ) : null}
      </div>

      {showQr && item.confirmation_code ? (
        <div className="mt-4">
          <QRCodePass
            value={item.confirmation_code}
            title={t("qrPassTitle")}
            codeLabel={t("confirmationCode")}
            instructions={t("qrInstructions")}
            downloadLabel={t("saveQrCode")}
            copyLabel={t("copyCode")}
            copiedLabel={t("codeCopied")}
          />
        </div>
      ) : null}

      {editing ? (
        <form
          className="mt-6 space-y-5 border-t border-site-border pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void update
              .mutateAsync({
                id: item.id,
                input: {
                  locale,
                  contact: {
                    ...item.contact,
                    first_name: firstName,
                    last_name: lastName,
                    phone,
                  },
                  participants,
                },
              })
              .then(onEdit);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-site-foreground mb-1">
                {t("firstName")}
              </label>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputBase}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-site-foreground mb-1">
                {t("lastName")}
              </label>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputBase}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-site-foreground mb-1">
                {t("phone")}
              </label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputBase}
                type="tel"
              />
            </div>
          </div>

          <div className="space-y-4">
            {participants.map((participant, index) => (
              <fieldset
                key={participant.id ?? `participant-${index}`}
                className="border border-site-border p-4 space-y-3"
              >
                <legend className="px-2 text-xs font-bold uppercase tracking-wider text-site-foreground">
                  {t("participantNumber", { number: index + 1 })}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-site-muted mb-1">
                      {t("firstName")}
                    </label>
                    <input
                      value={participant.first_name}
                      onChange={(event) =>
                        setParticipantField(index, "first_name", event.target.value)
                      }
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-site-muted mb-1">
                      {t("lastName")}
                    </label>
                    <input
                      value={participant.last_name}
                      onChange={(event) =>
                        setParticipantField(index, "last_name", event.target.value)
                      }
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-site-muted mb-1">
                      {t("dietaryRestrictions")}
                    </label>
                    <input
                      value={participant.dietary_restrictions}
                      onChange={(event) =>
                        setParticipantField(
                          index,
                          "dietary_restrictions",
                          event.target.value,
                        )
                      }
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-site-muted mb-1">
                      {t("specialNeeds")}
                    </label>
                    <input
                      value={participant.special_needs}
                      onChange={(event) =>
                        setParticipantField(index, "special_needs", event.target.value)
                      }
                      className={inputBase}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-site-muted mb-1">
                      {t("additionalNotes")}
                    </label>
                    <textarea
                      value={participant.additional_notes}
                      onChange={(event) =>
                        setParticipantField(
                          index,
                          "additional_notes",
                          event.target.value,
                        )
                      }
                      rows={2}
                      className={inputBase}
                    />
                  </div>
                </div>
                {participants.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setParticipants((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    className="mt-2 text-xs font-semibold text-red-700 underline focus-visible:outline-site-focus"
                  >
                    {t("removeParticipant")}
                  </button>
                ) : null}
              </fieldset>
            ))}

            {participants.length < MAX_REGISTRATION_PARTICIPANTS ? (
              <button
                type="button"
                onClick={() =>
                  setParticipants((current) => [
                    ...current,
                    {
                      first_name: "",
                      last_name: "",
                      dietary_restrictions: "",
                      special_needs: "",
                      additional_notes: "",
                    },
                  ])
                }
                className={secondaryActionClass}
              >
                {t("addParticipant")}
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={update.isPending}
              className={primaryActionClass}
            >
              {update.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {t("saveChanges")}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className={secondaryActionClass}
            >
              {t("closeEdit")}
            </button>
          </div>
        </form>
      ) : null}

      {item.registration_status !== "cancelled" && !editing ? (
        <div className="mt-5 flex flex-wrap gap-3 border-t border-site-border pt-4">
          <button
            type="button"
            onClick={onEdit}
            className={secondaryActionClass}
          >
            {t("editRegistration")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelPending}
            className={dangerActionClass}
          >
            {cancelPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            {t("cancelRegistration")}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function toParticipantInput(
  participant: EventRegistrationListItem["participants"][number],
): RegistrationParticipantInput {
  return {
    id: participant.id,
    first_name: participant.first_name,
    last_name: participant.last_name,
    dietary_restrictions: participant.dietary_restrictions,
    special_needs: participant.special_needs,
    additional_notes: participant.additional_notes,
  };
}
