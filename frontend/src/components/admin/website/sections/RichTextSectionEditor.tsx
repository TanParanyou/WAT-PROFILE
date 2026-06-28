"use client";

import { Select } from "@/components/ui/Select";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";

type ContentEditorProps = Omit<React.ComponentProps<typeof SectionContentEditorBase>, "heading" | "summary" | "children">;

export function RichTextSectionEditor(props: ContentEditorProps) {
  return (
    <SectionContentEditorBase heading="Rich text" summary="Readable narrative content for public pages" {...props}>
      {(form) => (
        <div className="space-y-3">
          <textarea
            rows={8}
            className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-950"
            disabled={props.isSaving}
            {...form.register("body.markdown" as never)}
          />
          <Select
            label="Content width"
            options={[
              { value: "narrow", label: "Narrow" },
              { value: "regular", label: "Regular" },
              { value: "wide", label: "Wide" },
            ]}
            {...form.register("settings.width" as never)}
            disabled={props.isSaving}
          />
        </div>
      )}
    </SectionContentEditorBase>
  );
}
