"use client";

import { useFormContext } from "react-hook-form";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";

interface ContactContentTabProps {
  disabled?: boolean;
}

export function ContactContentTab({ disabled = false }: ContactContentTabProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Hero Banner Section</h2>
          <p className="text-xs text-zinc-500">Header of the contact page.</p>
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

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-700">Hero Tone</label>
          <select
            {...register("content.hero_tone")}
            disabled={disabled}
            className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="calm">Calm</option>
          </select>
        </div>
      </div>

      {/* Contact Info Header Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Contact Information Headers</h2>
          <p className="text-xs text-zinc-500">Titles and descriptive headers for the contact details section.</p>
        </div>

        <LocalizedTextFields
          label="Section Title"
          name="content.info_title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Section Description"
          name="content.info_description"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={2}
        />
      </div>

      {/* Message Form Section */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Message Form Settings</h2>
          <p className="text-xs text-zinc-500">Configure the contact form on the page.</p>
        </div>

        <LocalizedTextFields
          label="Form Title"
          name="content.form_title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Form Description"
          name="content.form_description"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={2}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="form_enabled"
            {...register("content.form_enabled")}
            disabled={disabled}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
          />
          <label htmlFor="form_enabled" className="text-sm font-medium text-zinc-700 select-none">
            Enable Contact Form
          </label>
        </div>
      </div>
    </div>
  );
}
