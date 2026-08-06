"use client";

import { Check, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PasswordPolicyResult } from "@/features/public/account/validation";

interface PasswordRequirementsProps {
  id: string;
  requirements: PasswordPolicyResult;
}

interface RequirementItemProps {
  label: string;
  passed: boolean;
  statusLabel: string;
}

function RequirementItem({ label, passed, statusLabel }: RequirementItemProps) {
  return (
    <li className={`flex items-start gap-2 ${passed ? "text-site-foreground" : "text-site-muted"}`}>
      <span className="sr-only">{statusLabel}</span>
      {passed ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{label}</span>
    </li>
  );
}

export function PasswordRequirements({ id, requirements }: PasswordRequirementsProps) {
  const t = useTranslations("Account");
  const statusLabel = (passed: boolean) => (passed ? t("passwordPolicy.met") : t("passwordPolicy.notMet"));

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="space-y-2 border border-site-border bg-site-surface p-3 text-sm text-site-muted"
    >
      <p id={`${id}-title`} className="font-semibold text-site-foreground">
        {t("passwordPolicy.title")}
      </p>
      <p aria-live="polite">{t("passwordPolicy.characterGroups", { count: requirements.characterGroups })}</p>
      <ul className="grid gap-1 sm:grid-cols-2">
        <RequirementItem
          label={t("passwordPolicy.length")}
          passed={requirements.hasMinLength && requirements.hasMaxLength}
          statusLabel={statusLabel(requirements.hasMinLength && requirements.hasMaxLength)}
        />
        <RequirementItem
          label={t("passwordPolicy.lowercase")}
          passed={requirements.hasLowercase}
          statusLabel={statusLabel(requirements.hasLowercase)}
        />
        <RequirementItem
          label={t("passwordPolicy.uppercase")}
          passed={requirements.hasUppercase}
          statusLabel={statusLabel(requirements.hasUppercase)}
        />
        <RequirementItem
          label={t("passwordPolicy.number")}
          passed={requirements.hasNumber}
          statusLabel={statusLabel(requirements.hasNumber)}
        />
        <RequirementItem
          label={t("passwordPolicy.special")}
          passed={requirements.hasSpecial}
          statusLabel={statusLabel(requirements.hasSpecial)}
        />
      </ul>
      <p>{t("passwordPolicy.spacesAllowed")}</p>
    </section>
  );
}
