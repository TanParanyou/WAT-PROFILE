"use client";

import { Controller } from "react-hook-form";
import { Select } from "@/components/ui/Select";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import type { LocalizedRichText } from "@/lib/rich-text/document";
import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";

type ContentEditorProps = Omit<React.ComponentProps<typeof SectionContentEditorBase>, "heading" | "summary" | "children">;

const websiteLocales = WEBSITE_CMS_LOCALES.map(lang => ({ code: lang, label: lang }));

export function RichTextSectionEditor(props: ContentEditorProps) {
  return (
    <SectionContentEditorBase heading="Rich text" summary="Readable narrative content for public pages" {...props}>
      {(form) => (
        <div className="space-y-4">
          <Controller
            control={form.control}
            name="body.richText"
            render={({ field }) => (
              <MultiLangRichText
                label="Content"
                locales={websiteLocales}
                defaultLocale="th"
                value={(field.value || {}) as LocalizedRichText}
                onChange={field.onChange}
                disabled={props.isSaving}
              />
            )}
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
