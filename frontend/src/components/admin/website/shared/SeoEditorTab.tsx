"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";

interface SeoEditorTabProps {
  disabled?: boolean;
}

export function SeoEditorTab({ disabled = false }: SeoEditorTabProps) {
  const t = useTranslations("Admin.website");
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  const titleValue = watch("seo.title.th") || "";
  const descValue = watch("seo.description.th") || "";
  const ogImage = watch("seo.og_image") || "";

  return (
    <div className="space-y-6">
      {/* Live SEO Preview Panel */}
      <div className="border border-admin-border bg-admin-surface-muted p-4 rounded-none">
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-admin-muted">
          SEO Search Result Preview (Google & Facebook)
        </h3>
        
        {/* Google Preview */}
        <div className="mb-4 border-b border-admin-border pb-4">
          <div className="text-[11px] text-admin-muted">Google Search Result</div>
          <div className="mt-1 text-lg font-medium text-admin-action hover:underline cursor-pointer truncate max-w-xl">
            {titleValue || "Example Title | Wat Profile"}
          </div>
          <div className="text-xs text-admin-success truncate">
            https://watprofile.org/th/home
          </div>
          <div className="mt-1 text-xs text-admin-body line-clamp-2 max-w-xl">
            {descValue || "Please enter a meta description to see how this page will appear in search results."}
          </div>
        </div>

        {/* Facebook/OG Preview */}
        <div>
          <div className="text-[11px] text-admin-muted mb-1">Social Media Share Preview</div>
          <div className="border border-admin-border bg-admin-surface max-w-md overflow-hidden rounded-none">
            {ogImage ? (
              <img src={ogImage} alt="OG Preview" className="h-48 w-full object-cover" />
            ) : (
              <div className="h-48 w-full bg-admin-surface-muted flex items-center justify-center text-xs text-admin-muted">
                No OG Image Selected
              </div>
            )}
            <div className="p-3 border-t border-admin-border">
              <div className="text-[11px] text-admin-muted uppercase tracking-wider">watprofile.org</div>
              <div className="mt-1 font-semibold text-sm text-admin-foreground truncate">
                {titleValue || "Example Title"}
              </div>
              <div className="mt-1 text-xs text-admin-muted line-clamp-2">
                {descValue || "Example Meta Description"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Form Fields */}
      <div className="space-y-4 bg-admin-surface border border-admin-border p-4 rounded-none">
        <div>
          <h2 className="text-sm font-semibold text-admin-foreground">Search Engine Optimization (SEO)</h2>
          <p className="text-xs text-admin-muted">Configure how this page looks in search engines and social shares.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input 
            label="Canonical URL" 
            disabled={disabled} 
            {...register("seo.canonical_url")} 
          />
          <Input 
            label="OG Image URL" 
            disabled={disabled} 
            {...register("seo.og_image")} 
          />
        </div>

        <LocalizedTextFields
          label="Meta Title"
          name="seo.title"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <LocalizedTextareaFields
          label="Meta Description"
          name="seo.description"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={3}
        />

        <LocalizedTextFields
          label="Meta Keywords"
          name="seo.keywords"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
