"use client";

import { Select } from "@/components/ui/Select";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";
import { MediaUrlField } from "@/components/admin/website/MediaUrlField";
import { Input } from "@/components/ui/Input";

type ContentEditorProps = Omit<React.ComponentProps<typeof SectionContentEditorBase>, "heading" | "summary" | "children">;

export function HeroSectionEditor(props: ContentEditorProps) {
  return (
    <SectionContentEditorBase heading="Hero" summary="Main page headline and primary call to action" {...props}>
      {(form) => {
        const ctaLabel = String(form.watch("settings.cta_label" as never) || "").trim();
        const ctaHref = String(form.watch("settings.cta_href" as never) || "").trim();

        return (
          <div className="space-y-3">
            {ctaLabel && !ctaHref ? (
              <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                CTA label is filled, but the destination link is still empty.
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Eyebrow label" {...form.register("body.eyebrow" as never)} disabled={props.isSaving} />
              <Select
                label="Tone"
                options={[
                  { value: "calm", label: "Calm" },
                  { value: "neutral", label: "Neutral" },
                  { value: "highlight", label: "Highlight" },
                ]}
                {...form.register("settings.tone" as never)}
                disabled={props.isSaving}
              />
              <div className="md:col-span-2">
                <MediaUrlField
                  label="Image URL"
                  value={String(form.watch("body.image" as never) || "")}
                  disabled={props.isSaving}
                  inputProps={form.register("body.image" as never)}
                />
              </div>
              <Input label="CTA label" {...form.register("settings.cta_label" as never)} disabled={props.isSaving} />
              <Input label="CTA link" {...form.register("settings.cta_href" as never)} disabled={props.isSaving} />
            </div>
          </div>
        );
      }}
    </SectionContentEditorBase>
  );
}
