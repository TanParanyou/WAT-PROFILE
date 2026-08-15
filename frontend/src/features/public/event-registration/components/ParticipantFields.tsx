"use client";

import { Trash2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import type { RegistrationFormValues } from "../schema";
import { MAX_REGISTRATION_PARTICIPANTS } from "../types";

interface ParticipantFieldsProps {
  control: Control<RegistrationFormValues>;
  register: UseFormRegister<RegistrationFormValues>;
  errors: FieldErrors<RegistrationFormValues>;
}

export function ParticipantFields({ control, register, errors }: ParticipantFieldsProps) {
  const t = useTranslations("EventRegistration");
  const { fields, append, remove } = useFieldArray({ control, name: "participants" });
  return (
    <fieldset className="space-y-4 border-t border-site-border pt-5">
      <legend className="text-base font-semibold text-site-foreground">{t("participantsTitle")}</legend>
      {fields.map((field, index) => {
        const participantErrors = errors.participants?.[index];
        return (
          <div key={field.id} className="space-y-3 border border-site-border bg-site-canvas p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium text-site-foreground">{t("participantNumber", { number: index + 1 })}</h3>
              {fields.length > 1 ? (
                <button type="button" onClick={() => remove(index)} className="inline-flex min-h-11 items-center gap-2 border border-site-border px-3 text-xs text-site-danger hover:bg-site-danger-surface" aria-label={t("removeParticipant")}>
                  <Trash2 size={14} aria-hidden="true" />{t("removeParticipant")}
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id={`participants.${index}.first_name`} label={t("firstName")} registration={register(`participants.${index}.first_name`)} error={participantErrors?.first_name?.message} />
              <TextField id={`participants.${index}.last_name`} label={t("lastName")} registration={register(`participants.${index}.last_name`)} error={participantErrors?.last_name?.message} />
            </div>
            <TextField id={`participants.${index}.dietary_restrictions`} label={t("dietaryRestrictions")} registration={register(`participants.${index}.dietary_restrictions`)} error={participantErrors?.dietary_restrictions?.message} />
            <TextField id={`participants.${index}.special_needs`} label={t("specialNeeds")} registration={register(`participants.${index}.special_needs`)} error={participantErrors?.special_needs?.message} />
            <TextField id={`participants.${index}.additional_notes`} label={t("additionalNotes")} registration={register(`participants.${index}.additional_notes`)} error={participantErrors?.additional_notes?.message} textarea />
          </div>
        );
      })}
      <button type="button" onClick={() => append({ first_name: "", last_name: "", dietary_restrictions: "", special_needs: "", additional_notes: "" })} disabled={fields.length >= MAX_REGISTRATION_PARTICIPANTS} className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-4 text-sm font-semibold text-site-foreground hover:bg-site-surface disabled:cursor-not-allowed disabled:opacity-50">
        <UserPlus size={16} aria-hidden="true" />{t("addParticipant")}
      </button>
    </fieldset>
  );
}

function TextField({ id, label, registration, error, textarea = false }: { id: string; label: string; registration: ReturnType<UseFormRegister<RegistrationFormValues>>; error?: string; textarea?: boolean }) {
  const inputClass = "mt-1 block min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2 text-sm text-site-foreground outline-none focus:border-site-focus focus-visible:outline-3 focus-visible:outline-site-focus";
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-site-foreground">{label}</label>
      {textarea ? <textarea id={id} rows={3} className={inputClass} {...registration} /> : <input id={id} className={inputClass} {...registration} />}
      {error ? <p className="mt-1 text-xs text-site-danger" role="alert">{String(error)}</p> : null}
    </div>
  );
}
