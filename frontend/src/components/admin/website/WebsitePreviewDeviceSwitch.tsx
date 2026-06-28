"use client";

import { LaptopMinimal, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { WebsiteCmsPreviewDevice } from "@/stores/website-cms-editor-store";

export function WebsitePreviewDeviceSwitch({
  value,
  onChange,
}: {
  value: WebsiteCmsPreviewDevice;
  onChange: (device: WebsiteCmsPreviewDevice) => void;
}) {
  return (
    <div className="inline-flex rounded-none border border-zinc-200 p-1">
      <Button
        type="button"
        size="sm"
        variant={value === "desktop" ? "primary" : "ghost"}
        icon={<LaptopMinimal size={14} />}
        onClick={() => onChange("desktop")}
      >
        Desktop
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "tablet" ? "primary" : "ghost"}
        icon={<Tablet size={14} />}
        onClick={() => onChange("tablet")}
      >
        Tablet
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "mobile" ? "primary" : "ghost"}
        icon={<Smartphone size={14} />}
        onClick={() => onChange("mobile")}
      >
        Mobile
      </Button>
    </div>
  );
}
