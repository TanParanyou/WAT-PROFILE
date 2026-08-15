"use client";

import { Controller, useFormContext } from "react-hook-form";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import type { AboutPageMasterFormData } from "@/schemas/website-page.schema";
import { normalizeLocalizedRichText } from "@/lib/rich-text/document";

interface AboutHistoryTabProps {
  disabled?: boolean;
}

export function AboutHistoryTab({ disabled = false }: AboutHistoryTabProps) {
  const { register, setValue, watch, control, formState: { errors } } = useFormContext<AboutPageMasterFormData>();

  return (
    <div className="space-y-6">
      {/* Administration Section */}
      <div className="space-y-4 bg-admin-surface border border-admin-border p-4 rounded-none">
        <div>
          <h2 className="text-sm font-semibold text-admin-foreground">Administration</h2>
          <p className="text-xs text-admin-muted">Board information and structure.</p>
        </div>

        <LocalizedTextFields
          label="Administration Title"
          name="content.administration_title"
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          disabled={disabled}
        />

        <Controller
          control={control}
          name="content.administration_content"
          render={({ field }) => (
            <MultiLangRichText
              label="Administration Content"
              value={normalizeLocalizedRichText(field.value)}
              onChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
      </div>

      {/* History Section */}
      <div className="space-y-4 bg-admin-surface border border-admin-border p-4 rounded-none">
        <div>
          <h2 className="text-sm font-semibold text-admin-foreground">History & Heritage</h2>
          <p className="text-xs text-admin-muted">Temple's history and background story.</p>
        </div>

        <LocalizedTextFields
          label="History Title"
          name="content.history_title"
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          disabled={disabled}
        />

        <Controller
          control={control}
          name="content.history_content"
          render={({ field }) => (
            <MultiLangRichText
              label="History Content"
              value={normalizeLocalizedRichText(field.value)}
              onChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
      </div>
    </div>
  );
}

