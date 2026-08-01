"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { Button } from "@/components/ui/Button";

interface AboutBuildingsTabProps {
  disabled?: boolean;
}

export function AboutBuildingsTab({ disabled = false }: AboutBuildingsTabProps) {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "content.buildings_items",
  });

  return (
    <div className="space-y-6">
      {/* Title Settings */}
      <div className="space-y-4 bg-admin-surface border border-admin-border p-4 rounded-none">
        <div>
          <h2 className="text-sm font-semibold text-admin-foreground">Buildings Section Header</h2>
          <p className="text-xs text-admin-muted">Configure titles for the temple's building structures.</p>
        </div>

        <LocalizedTextFields
          label="Buildings Title"
          name="content.buildings_title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />
      </div>

      {/* Buildings Items List */}
      <div className="space-y-4 bg-admin-surface border border-admin-border p-4 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-admin-foreground">Building Items</h2>
            <p className="text-xs text-admin-muted">List of buildings inside the temple area.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={<Plus size={14} />}
            disabled={disabled}
            onClick={() => append({ name: { th: "", en: "", de: "" }, description: { th: "", en: "", de: "" } })}
          >
            Add Building
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="relative border border-admin-border p-4 pt-10 space-y-4 bg-admin-surface-muted rounded-none">
            <div className="absolute right-2 top-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-admin-danger hover:text-admin-danger hover:bg-admin-danger-surface border-admin-danger-border"
                icon={<Trash2 size={14} />}
                disabled={disabled}
                onClick={() => remove(index)}
              >
                Delete Building
              </Button>
            </div>

            <LocalizedTextFields
              label={`Building #${index + 1} Name`}
              name={`content.buildings_items.${index}.name`}
              register={register as any}
              setValue={setValue as any}
              watch={watch as any}
              errors={errors as any}
              disabled={disabled}
            />

            <LocalizedTextareaFields
              label="Building Description"
              name={`content.buildings_items.${index}.description`}
              register={register as any}
              setValue={setValue as any}
              watch={watch as any}
              errors={errors as any}
              disabled={disabled}
              rows={3}
            />
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-6 text-xs text-admin-muted border border-dashed border-admin-border rounded-none">
            No buildings configured.
          </div>
        )}
      </div>
    </div>
  );
}
