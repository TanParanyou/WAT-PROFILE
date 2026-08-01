"use client";

import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import { SectionContentEditorBase } from "@/components/admin/website/sections/SectionContentEditorBase";

type ContentEditorProps = Omit<React.ComponentProps<typeof SectionContentEditorBase>, "heading" | "summary" | "children">;

export function ContactInfoSectionEditor(props: ContentEditorProps) {
  return (
    <SectionContentEditorBase heading="Contact information" summary="Address, phone, email, and contact display options" {...props}>
      {(form) => {
        const address = String(form.watch("body.address" as never) || "").trim();
        const phone = String(form.watch("body.phone" as never) || "").trim();
        const email = String(form.watch("body.email" as never) || "").trim();

        return (
          <div className="space-y-3">
            {!address && !phone && !email ? (
              <div className="border border-admin-border bg-admin-surface-muted px-3 py-2 text-sm text-admin-body rounded-lg">
                This section is currently using the shared contact data file for address, phone, and email.
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Phone override" {...form.register("body.phone" as never)} disabled={props.isSaving} />
              <Input label="Email override" {...form.register("body.email" as never)} disabled={props.isSaving} />
              <Input label="Address override" {...form.register("body.address" as never)} disabled={props.isSaving} className="md:col-span-2" />
              <Input label="Map URL" {...form.register("settings.map_url" as never)} disabled={props.isSaving} className="md:col-span-2" />
              <Switch label="Show map card" {...form.register("settings.show_map" as never)} disabled={props.isSaving} />
              <Switch label="Show social links" {...form.register("settings.show_social" as never)} disabled={props.isSaving} />
              <Switch label="Show bank info" {...form.register("settings.show_bank" as never)} disabled={props.isSaving} />
            </div>
          </div>
        );
      }}
    </SectionContentEditorBase>
  );
}
