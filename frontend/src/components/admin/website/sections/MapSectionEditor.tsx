"use client";

import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";
import { MediaUrlField } from "@/components/admin/website/MediaUrlField";

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
              <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Add at least one map reference so the public page does not render as an empty location block.
              </div>
            ) : null}
            <MediaUrlField
              label="Map embed URL"
              value={String(form.watch("body.embed_url" as never) || "")}
              disabled={props.isSaving}
              inputProps={form.register("body.embed_url" as never)}
              onUrlChange={(url) => form.setValue("body.embed_url" as never, url as never, { shouldDirty: true })}
            />
            <Input label="Directions URL" {...form.register("body.directions_url" as never)} disabled={props.isSaving} />
            <Input label="Fallback address" {...form.register("body.address" as never)} disabled={props.isSaving} />
            <Switch label="Show directions button" {...form.register("settings.show_directions" as never)} disabled={props.isSaving} />
          </div>
        );
      }}
    </SectionContentEditorBase>
  );
}
