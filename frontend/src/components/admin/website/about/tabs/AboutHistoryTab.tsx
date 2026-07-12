"use client";

import { useFormContext } from "react-hook-form";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";

interface AboutHistoryTabProps {
  disabled?: boolean;
}

export function AboutHistoryTab({ disabled = false }: AboutHistoryTabProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Administration Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Administration</h2>
          <p className="text-xs text-zinc-500">Board information and structure.</p>
        </div>

        <LocalizedTextFields
          label="Administration Title"
          name="content.administration_title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Administration Content"
          name="content.administration_content"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={5}
        />
      </div>

      {/* History Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">History & Heritage</h2>
          <p className="text-xs text-zinc-500">Temple's history and background story.</p>
        </div>

        <LocalizedTextFields
          label="History Title"
          name="content.history_title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="History Content"
          name="content.history_content"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={6}
        />
      </div>
    </div>
  );
}
