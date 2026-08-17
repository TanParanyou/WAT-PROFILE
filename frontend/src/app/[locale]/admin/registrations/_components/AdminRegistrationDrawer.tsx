"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { useCreateAdminEventRegistration } from "@/features/admin/event-registrations/queries";
import {
  MAX_REGISTRATION_PARTICIPANTS,
  type RegistrationParticipantInput,
  type RegistrationStatus,
  type RegistrationLocale,
} from "@/features/public/event-registration/types";

export interface AdminRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  events: readonly { id: number; title?: { th?: string; en?: string; de?: string } }[];
  locale: RegistrationLocale;
}

const emptyParticipant: RegistrationParticipantInput = {
  first_name: "",
  last_name: "",
  dietary_restrictions: "",
  special_needs: "",
  additional_notes: "",
};

function AdminRegistrationFormContent({
  onClose,
  onSuccess,
  events,
  locale,
}: Omit<AdminRegistrationDrawerProps, "isOpen">) {
  const t = useTranslations("Admin");
  const { toast } = useToast();
  const createMutation = useCreateAdminEventRegistration();

  const [eventId, setEventId] = useState<number | null>(events.length > 0 ? events[0].id : null);
  const [status, setStatus] = useState<RegistrationStatus>("confirmed");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [generalDietary, setGeneralDietary] = useState("");
  const [generalSpecialNeeds, setGeneralSpecialNeeds] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [participants, setParticipants] = useState<RegistrationParticipantInput[]>([
    { ...emptyParticipant },
  ]);

  const handleContactFirstNameChange = (val: string) => {
    setFirstName(val);
    setParticipants((prev) => {
      if (prev.length === 0) return [{ ...emptyParticipant, first_name: val }];
      return prev.map((p, idx) => (idx === 0 ? { ...p, first_name: val } : p));
    });
  };

  const handleContactLastNameChange = (val: string) => {
    setLastName(val);
    setParticipants((prev) => {
      if (prev.length === 0) return [{ ...emptyParticipant, last_name: val }];
      return prev.map((p, idx) => (idx === 0 ? { ...p, last_name: val } : p));
    });
  };

  const updateParticipant = (
    index: number,
    field: keyof RegistrationParticipantInput,
    value: string,
  ) => {
    setParticipants((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p)),
    );
  };

  const addParticipant = () => {
    if (participants.length >= MAX_REGISTRATION_PARTICIPANTS) return;
    setParticipants((prev) => [...prev, { ...emptyParticipant }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 1) return;
    setParticipants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventId) {
      toast.error(t("registrations.eventRequired"));
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t("registrations.validationRequired"));
      return;
    }
    if (sendEmail && !email.trim()) {
      toast.error(t("registrations.validationRequired"));
      return;
    }

    const validParticipants = participants.map((p, idx) => ({
      first_name: (p.first_name || (idx === 0 ? firstName : "")).trim(),
      last_name: (p.last_name || (idx === 0 ? lastName : "")).trim(),
      dietary_restrictions: (p.dietary_restrictions || "").trim(),
      special_needs: (p.special_needs || "").trim(),
      additional_notes: (p.additional_notes || "").trim(),
    }));

    for (let i = 0; i < validParticipants.length; i++) {
      if (!validParticipants[i].first_name || !validParticipants[i].last_name) {
        toast.error(t("registrations.validationRequired"));
        return;
      }
    }

    try {
      await createMutation.mutateAsync({
        event_id: eventId,
        locale,
        status,
        contact: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        },
        participants: validParticipants,
        dietary_restrictions: generalDietary.trim(),
        special_needs: generalSpecialNeeds.trim(),
        additional_notes: generalNotes.trim(),
        send_email: sendEmail,
      });

      toast.success(t("registrations.createSuccess"));
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("registrations.createError");
      toast.error(errorMessage);
    }
  };

  const eventOptions = events.map((ev) => ({
    value: String(ev.id),
    label: ev.title?.[locale] || ev.title?.th || ev.title?.en || ev.title?.de || String(ev.id),
  }));

  const statusOptions = [
    { value: "confirmed", label: t("registrations.approved") },
    { value: "pending", label: t("registrations.pending") },
    { value: "attended", label: t("registrations.attended") },
    { value: "cancelled", label: t("registrations.cancelled") },
  ];

  return (
    <>
      <form id="admin-registration-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-6 p-4 sm:p-6">
        {/* Event & Status */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-admin-body flex items-center min-h-[24px] mb-1">
              {t("registrations.selectEvent")}
              <span className="text-admin-danger ml-1">*</span>
            </label>
            <Select
              value={eventId ? String(eventId) : ""}
              onChange={(e) => setEventId(Number(e.target.value))}
              options={eventOptions}
              placeholder={t("registrations.selectEventPlaceholder")}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-admin-body flex items-center min-h-[24px] mb-1">
              {t("registrations.initialStatus")}
              <span className="text-admin-danger ml-1">*</span>
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as RegistrationStatus)}
              options={statusOptions}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-admin-border pt-4">
          <h3 className="text-sm font-semibold text-admin-foreground mb-3">
            {t("registrations.contact")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t("registrations.firstName")}
              value={firstName}
              onChange={(e) => handleContactFirstNameChange(e.target.value)}
              required
            />
            <Input
              label={t("registrations.lastName")}
              value={lastName}
              onChange={(e) => handleContactLastNameChange(e.target.value)}
              required
            />
            <div>
              <Input
                label={t("registrations.email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="mt-1 text-xs text-admin-muted">
                {t("registrations.emailOptionalHint")}
              </p>
            </div>
            <Input
              label={t("registrations.phone")}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {email.trim() ? (
            <div className="mt-3">
              <Checkbox
                label={t("registrations.sendEmailConfirmation")}
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
            </div>
          ) : null}
        </div>

        {/* Participants */}
        <div className="border-t border-admin-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-admin-foreground">
              {t("registrations.participants")} ({participants.length}/{MAX_REGISTRATION_PARTICIPANTS})
            </h3>
            {participants.length < MAX_REGISTRATION_PARTICIPANTS ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addParticipant}
              >
                {t("registrations.addParticipant")}
              </Button>
            ) : null}
          </div>

          <div className="space-y-4">
            {participants.map((participant, index) => (
              <fieldset
                key={index}
                className="border border-admin-border bg-admin-surface-muted/40 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <legend className="px-1 text-xs font-semibold text-admin-foreground">
                    {t("registrations.participantNumber", { number: index + 1 })}
                  </legend>
                  {participants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeParticipant(index)}
                      className="text-xs font-semibold text-admin-danger hover:underline"
                    >
                      {t("registrations.removeParticipant")}
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={t("registrations.firstName")}
                    value={participant.first_name}
                    onChange={(e) => updateParticipant(index, "first_name", e.target.value)}
                    required
                  />
                  <Input
                    label={t("registrations.lastName")}
                    value={participant.last_name}
                    onChange={(e) => updateParticipant(index, "last_name", e.target.value)}
                    required
                  />
                  <Input
                    label={t("registrations.dietaryRestrictions")}
                    value={participant.dietary_restrictions}
                    onChange={(e) =>
                      updateParticipant(index, "dietary_restrictions", e.target.value)
                    }
                  />
                  <Input
                    label={t("registrations.specialNeeds")}
                    value={participant.special_needs}
                    onChange={(e) => updateParticipant(index, "special_needs", e.target.value)}
                  />
                  <div className="sm:col-span-2">
                    <Textarea
                      label={t("registrations.additionalNotes")}
                      rows={2}
                      value={participant.additional_notes}
                      onChange={(e) =>
                        updateParticipant(index, "additional_notes", e.target.value)
                      }
                    />
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        {/* General Notes & Requirements */}
        <div className="border-t border-admin-border pt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t("registrations.dietaryRestrictions")}
              value={generalDietary}
              onChange={(e) => setGeneralDietary(e.target.value)}
            />
            <Input
              label={t("registrations.specialNeeds")}
              value={generalSpecialNeeds}
              onChange={(e) => setGeneralSpecialNeeds(e.target.value)}
            />
          </div>
          <Textarea
            label={t("registrations.additionalNotes")}
            rows={2}
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
          />
        </div>
      </form>
      <div className="shrink-0 border-t border-admin-border bg-admin-surface-muted px-4 py-3 sm:px-5 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onClose} type="button">
          {t("common.cancel")}
        </Button>
        <Button
          variant="primary"
          form="admin-registration-form"
          type="submit"
          isLoading={createMutation.isPending}
        >
          {t("common.save")}
        </Button>
      </div>
    </>
  );
}

export function AdminRegistrationDrawer({
  isOpen,
  onClose,
  onSuccess,
  events,
  locale,
}: AdminRegistrationDrawerProps) {
  const t = useTranslations("Admin");

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("registrations.createTitle")}
      description={t("registrations.createDescription")}
      size="lg"
    >
      {isOpen ? (
        <AdminRegistrationFormContent
          onClose={onClose}
          onSuccess={onSuccess}
          events={events}
          locale={locale}
        />
      ) : null}
    </Drawer>
  );
}
