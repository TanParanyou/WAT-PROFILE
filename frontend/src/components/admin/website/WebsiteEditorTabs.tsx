"use client";

import { FileText, Search, Settings, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { WebsiteCmsEditorTab } from "@/stores/website-cms-editor-store";

const tabs = [
  { value: "content", label: "Content", icon: FileText },
  { value: "seo", label: "SEO", icon: Search },
  { value: "settings", label: "Settings", icon: Settings },
  { value: "advanced", label: "Advanced", icon: SlidersHorizontal },
] as const;

export function WebsiteEditorTabs({
  value,
  onChange,
}: {
  value: WebsiteCmsEditorTab;
  onChange: (tab: WebsiteCmsEditorTab) => void;
}) {
  const t = useTranslations("Admin.website");
  return (
    <div className="grid grid-cols-2 gap-2 border-b border-zinc-200 pb-3 md:grid-cols-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={value === tab.value ? "primary" : "outline"}
            icon={<Icon size={14} />}
            onClick={() => onChange(tab.value)}
          >
            {tab.value === "content" ? "Content" : tab.value === "seo" ? t("seo") : tab.value === "settings" ? t("settingsTab") : t("advanced")}
          </Button>
        );
      })}
    </div>
  );
}
