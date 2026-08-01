"use client";

import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";

type ContentEditorProps = Omit<React.ComponentProps<typeof SectionContentEditorBase>, "heading" | "summary" | "children">;

export function ContactFormSectionEditor(props: ContentEditorProps) {
  return (
    <SectionContentEditorBase heading="Contact form copy" summary="Form labels, button text, and helper copy" {...props}>
      {(form) => {
        const enabled = Boolean(form.watch("settings.enabled" as never));

        return (
          <div className="space-y-3">
            {!enabled ? (
              <div className="border border-admin-warning-border bg-admin-warning-surface px-3 py-2 text-sm text-admin-warning rounded-lg">
                The public page will hide the live form and keep only the surrounding content block.
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <Switch label="Enable contact form" {...form.register("settings.enabled" as never)} disabled={props.isSaving} className="md:col-span-2" />
              <Input label="Submit label" {...form.register("settings.submit_label" as never)} disabled={props.isSaving} />
              <Input label="Success message" {...form.register("settings.success_message" as never)} disabled={props.isSaving} />
              <Input label="Form destination label" {...form.register("settings.destination_label" as never)} disabled={props.isSaving} className="md:col-span-2" />
            </div>
          </div>
        );
      }}
    </SectionContentEditorBase>
  );
}
