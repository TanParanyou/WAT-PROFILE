"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { Link } from "@/navigation";
import { useAccountRegistrationsQuery, useCancelAccountRegistration, useUpdateAccountRegistration } from "../queries";
import { MAX_REGISTRATION_PARTICIPANTS } from "../types";
import type { EventRegistrationListItem, RegistrationLocale, RegistrationParticipantInput } from "../types";

export function AccountRegistrationsContent() {
  const t = useTranslations("EventRegistration");
  const localeValue = useLocale();
  const locale: RegistrationLocale = localeValue === "en" || localeValue === "de" ? localeValue : "th";
  const session = useAccountSession();
  const query = useAccountRegistrationsQuery(session.status === "authenticated");
  const cancel = useCancelAccountRegistration();
  const [editingId, setEditingId] = useState<number | null>(null);
  if (session.status === "loading") return <p className="py-12 text-site-muted">{t("loading")}</p>;
  if (session.status !== "authenticated") return <div className="border border-site-border bg-site-surface p-6"><h1 className="font-heading text-2xl font-semibold text-site-foreground">{t("accountRegistrationsTitle")}</h1><p className="mt-2 text-sm text-site-body">{t("accountRegistrationsLogin")}</p><Link href="/account/login" className="mt-5 inline-flex min-h-11 items-center bg-site-action px-5 text-sm font-semibold text-site-on-action">{t("signIn")}</Link></div>;
  if (query.isLoading) return <p className="py-12 text-site-muted">{t("loading")}</p>;
  if (query.isError) return <div role="alert" className="border border-site-danger bg-site-danger-surface p-4 text-sm text-site-danger">{t("loadErrorDescription")}</div>;
  const items = query.data ?? [];
  return <div className="space-y-4">
    {items.length === 0 ? <div className="border border-dashed border-site-border p-6 text-sm text-site-body">{t("accountRegistrationsEmpty")}</div> : null}
    {items.map((item) => <RegistrationCard key={item.id} item={item} locale={locale} editing={editingId === item.id} onEdit={() => setEditingId(editingId === item.id ? null : item.id)} onCancel={() => { if (window.confirm(t("cancelConfirm"))) void cancel.mutateAsync({ id: item.id }); }} cancelPending={cancel.isPending} />)}
  </div>;
}

function RegistrationCard({ item, locale, editing, onEdit, onCancel, cancelPending }: { item: EventRegistrationListItem; locale: RegistrationLocale; editing: boolean; onEdit: () => void; onCancel: () => void; cancelPending: boolean }) {
  const t = useTranslations("EventRegistration");
  const update = useUpdateAccountRegistration();
  const [firstName, setFirstName] = useState(item.contact.first_name);
  const [lastName, setLastName] = useState(item.contact.last_name);
  const [phone, setPhone] = useState(item.contact.phone);
  const [participants, setParticipants] = useState<RegistrationParticipantInput[]>(() => item.participants.filter((participant) => participant.attendance_status !== "cancelled").map(toParticipantInput));
  const setParticipantField = (index: number, field: keyof RegistrationParticipantInput, value: string) => {
    setParticipants((current) => current.map((participant, currentIndex) => currentIndex === index ? { ...participant, [field]: value } : participant));
  };
  return <article className="border border-site-border bg-site-canvas p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-site-foreground">{item.event.title[locale]}</h2><p className="mt-1 text-xs text-site-muted">{item.contact.email}</p></div><span className="border border-site-border bg-site-surface px-2 py-1 text-xs font-semibold text-site-foreground">{t(`status.${item.registration_status}`)}</span></div>
    <p className="mt-3 text-sm text-site-body">{t("participantCount")}: {item.participant_count}</p>
    {editing ? <form className="mt-4 space-y-5" onSubmit={(event) => { event.preventDefault(); void update.mutateAsync({ id: item.id, input: { locale, contact: { ...item.contact, first_name: firstName, last_name: lastName, phone }, participants } }).then(onEdit); }}>
      <div className="grid gap-3 sm:grid-cols-3"><input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="min-h-11 border border-site-border px-3 text-sm" aria-label={t("firstName")} /><input value={lastName} onChange={(event) => setLastName(event.target.value)} className="min-h-11 border border-site-border px-3 text-sm" aria-label={t("lastName")} /><input value={phone} onChange={(event) => setPhone(event.target.value)} className="min-h-11 border border-site-border px-3 text-sm" aria-label={t("phone")} /></div>
      <div className="space-y-4">
        {participants.map((participant, index) => <fieldset key={participant.id ?? `new-${index}`} className="border border-site-border p-4"><legend className="px-1 text-sm font-semibold text-site-foreground">{t("participantNumber", { number: index + 1 })}</legend><div className="grid gap-3 sm:grid-cols-2"><input value={participant.first_name} onChange={(event) => setParticipantField(index, "first_name", event.target.value)} className="min-h-11 border border-site-border px-3 text-sm" aria-label={`${t("firstName")} ${index + 1}`} /><input value={participant.last_name} onChange={(event) => setParticipantField(index, "last_name", event.target.value)} className="min-h-11 border border-site-border px-3 text-sm" aria-label={`${t("lastName")} ${index + 1}`} /><input value={participant.dietary_restrictions} onChange={(event) => setParticipantField(index, "dietary_restrictions", event.target.value)} className="min-h-11 border border-site-border px-3 text-sm" aria-label={`${t("dietaryRestrictions")} ${index + 1}`} /><input value={participant.special_needs} onChange={(event) => setParticipantField(index, "special_needs", event.target.value)} className="min-h-11 border border-site-border px-3 text-sm" aria-label={`${t("specialNeeds")} ${index + 1}`} /><textarea value={participant.additional_notes} onChange={(event) => setParticipantField(index, "additional_notes", event.target.value)} className="min-h-11 border border-site-border px-3 py-2 text-sm sm:col-span-2" aria-label={`${t("additionalNotes")} ${index + 1}`} />{participants.length > 1 ? <button type="button" onClick={() => setParticipants((current) => current.filter((_, currentIndex) => currentIndex !== index))} className="min-h-11 justify-self-start border border-site-danger px-3 text-sm font-semibold text-site-danger">{t("removeParticipant")}</button> : null}</div></fieldset>)}
        {participants.length < MAX_REGISTRATION_PARTICIPANTS ? <button type="button" onClick={() => setParticipants((current) => [...current, { first_name: "", last_name: "", dietary_restrictions: "", special_needs: "", additional_notes: "" }])} className="min-h-11 border border-site-border px-4 text-sm font-semibold text-site-foreground">{t("addParticipant")}</button> : null}
      </div>
      <button type="submit" disabled={update.isPending} className="min-h-11 bg-site-action px-4 text-sm font-semibold text-site-on-action">{t("saveChanges")}</button>
    </form> : null}
    {item.registration_status !== "cancelled" ? <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={onEdit} className="min-h-11 border border-site-border px-4 text-sm font-semibold text-site-foreground">{editing ? t("closeEdit") : t("editRegistration")}</button><button type="button" onClick={onCancel} disabled={cancelPending} className="min-h-11 border border-site-danger px-4 text-sm font-semibold text-site-danger hover:bg-site-danger-surface">{t("cancelRegistration")}</button></div> : null}
  </article>;
}

function toParticipantInput(participant: EventRegistrationListItem["participants"][number]): RegistrationParticipantInput {
  return { id: participant.id, first_name: participant.first_name, last_name: participant.last_name, dietary_restrictions: participant.dietary_restrictions, special_needs: participant.special_needs, additional_notes: participant.additional_notes };
}
