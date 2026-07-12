import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { MediaUrlField } from "@/components/admin/website/MediaUrlField";
import { Button } from "@/components/ui/Button";

interface ContentTabProps {
  disabled?: boolean;
}

export function ContentTab({ disabled = false }: ContentTabProps) {
  const { register, setValue, watch, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "content.features",
  });

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Hero Banner Section</h2>
          <p className="text-xs text-zinc-500">The main banner at the top of the homepage.</p>
        </div>

        <LocalizedTextFields
          label="Hero Title"
          name="content.hero_title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Hero Subtitle"
          name="content.hero_subtitle"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={2}
        />

        <Controller
          name="content.hero_image"
          control={control}
          render={({ field }) => (
            <MediaUrlField
              label="Hero Background Image"
              value={field.value || ""}
              disabled={disabled}
              inputProps={{
                value: field.value || "",
                onChange: field.onChange,
                readOnly: true,
                placeholder: "No image selected",
              }}
              onUrlChange={(url) => {
                setValue("content.hero_image", url, { shouldDirty: true });
              }}
            />
          )}
        />
      </div>

      {/* Welcome Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Welcome Section</h2>
          <p className="text-xs text-zinc-500">Brief greeting and introduction content shown under the hero.</p>
        </div>

        <LocalizedTextFields
          label="Welcome Title"
          name="content.welcome_title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Welcome Description"
          name="content.welcome_description"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={4}
        />
      </div>

      {/* Features List */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">Features & Highlights</h2>
            <p className="text-xs text-zinc-500">Three highlight cards shown on the homepage.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={<Plus size={14} />}
            disabled={disabled}
            onClick={() => append({ icon: "🙏", title: { th: "", en: "", de: "" }, description: { th: "", en: "", de: "" } })}
          >
            Add Feature
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="relative border border-zinc-100 p-4 pt-10 space-y-4 bg-zinc-50/50">
            <div className="absolute right-2 top-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-zinc-200"
                icon={<Trash2 size={14} />}
                disabled={disabled}
                onClick={() => remove(index)}
              >
                Delete Feature
              </Button>
            </div>

            <div className="space-y-1.5 w-full sm:w-1/3">
              <label className="text-xs font-medium text-zinc-700 font-mono">Emoji Icon</label>
              <input
                type="text"
                {...register(`content.features.${index}.icon`)}
                disabled={disabled}
                className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none bg-white"
                placeholder="🙏"
              />
            </div>

            <LocalizedTextFields
              label={`Feature #${index + 1} Title`}
              name={`content.features.${index}.title`}
              register={register as any}
              setValue={setValue as any}
              watch={watch as any}
              errors={errors as any}
              disabled={disabled}
            />

            <LocalizedTextareaFields
              label="Feature Description"
              name={`content.features.${index}.description`}
              register={register as any}
              setValue={setValue as any}
              watch={watch as any}
              errors={errors as any}
              disabled={disabled}
              rows={2}
            />
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-zinc-200">
            No features configured.
          </div>
        )}
      </div>
    </div>
  );
}
