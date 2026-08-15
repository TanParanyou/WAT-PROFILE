"use client";

import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";

type ContentEditorProps = Omit<React.ComponentProps<typeof SectionContentEditorBase>, "heading" | "summary" | "children">;

export function MapSectionEditor(props: ContentEditorProps) {
  return (
    <SectionContentEditorBase heading="Map" summary="Public map embed and fallback address" {...props}>
      {(form) => {
        const embedUrl = String(form.watch("body.embed_url" as never) || "").trim();
        const directionsUrl = String(form.watch("body.directions_url" as never) || "").trim();
        const address = String(form.watch("body.address" as never) || "").trim();

        return (
          <div className="space-y-3">
            {!embedUrl && !directionsUrl && !address ? (
              <div className="border border-admin-warning-border bg-admin-warning-surface px-3 py-2 text-sm text-admin-warning rounded-none">
                Add at least one map reference so the public page does not render as an empty location block.
              </div>
            ) : null}
            <Input label="Map embed URL" type="url" {...form.register("body.embed_url" as never)} disabled={props.isSaving} />
            <Input label="Directions URL" {...form.register("body.directions_url" as never)} disabled={props.isSaving} />
            <Input label="Fallback address" {...form.register("body.address" as never)} disabled={props.isSaving} />
            <Switch label="Show directions button" {...form.register("settings.show_directions" as never)} disabled={props.isSaving} />
          </div>
        );
      }}
    </SectionContentEditorBase>
  );
}
