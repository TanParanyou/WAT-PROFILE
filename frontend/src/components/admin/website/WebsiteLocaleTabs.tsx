"use client";

import { Button } from "@/components/ui/Button";
import { WEBSITE_CMS_LOCALES } from "@/utils/websiteCms";
import type { WebsiteCmsLocale } from "@/stores/website-cms-editor-store";

export function WebsiteLocaleTabs({
  activeLocale,
  onChange,
}: {
  activeLocale: WebsiteCmsLocale;
  onChange: (locale: WebsiteCmsLocale) => void;
}) {
  return (
    <div className="flex gap-2 border-b border-admin-border pb-3">
      {WEBSITE_CMS_LOCALES.map((locale) => (
        <Button
          key={locale}
          type="button"
          size="sm"
          variant={activeLocale === locale ? "primary" : "outline"}
          onClick={() => onChange(locale)}
        >
          {locale.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
