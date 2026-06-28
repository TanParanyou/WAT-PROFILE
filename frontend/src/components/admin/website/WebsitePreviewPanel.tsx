"use client";

import type { ContentPage } from "@/types/website-cms";
import { DevicePreviewFrame } from "@/components/admin/website/DevicePreviewFrame";
import { PublicContactPageLayout } from "@/components/public/website/PublicContactPageLayout";
import { PublicPageRenderer } from "@/components/public/website/PublicPageRenderer";
import type { WebsiteCmsPreviewDevice, WebsiteCmsPreviewMode } from "@/stores/website-cms-editor-store";
import { contentPageToPublicPreview, contentPageToPublishedPreview } from "@/utils/websiteCms";

export function WebsitePreviewPanel({
  page,
  locale,
  device,
  mode,
}: {
  page: ContentPage;
  locale: string;
  device: WebsiteCmsPreviewDevice;
  mode: WebsiteCmsPreviewMode;
}) {
  const previewPage = mode === "published" ? contentPageToPublishedPreview(page) : contentPageToPublicPreview(page);
  const isContactPage = previewPage.slug === "contact" || previewPage.page_key === "PAGE-CONTACT";

  return (
    <DevicePreviewFrame device={device}>
      {isContactPage ? (
        <PublicContactPageLayout
          page={previewPage}
          locale={locale}
          labels={{
            infoEyebrow: "Contact",
            infoTitle: "Contact details",
            messageEyebrow: "Message",
            formTitle: "Send us a message",
            address: "Address",
            phone: "Phone",
            email: "Email",
            social: "Social",
            bank: "Bank",
          }}
          formSlot={<PreviewContactForm />}
        />
      ) : (
        <PublicPageRenderer page={previewPage} locale={locale} />
      )}
    </DevicePreviewFrame>
  );
}

function PreviewContactForm() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <PreviewField label="Name" />
        <PreviewField label="Email" />
      </div>
      <PreviewField label="Subject" />
      <PreviewField label="Message" textarea />
      <div className="inline-flex h-11 items-center border border-zinc-950 bg-zinc-950 px-4 text-sm font-medium text-white">
        Send message
      </div>
    </div>
  );
}

function PreviewField({ label, textarea = false }: { label: string; textarea?: boolean }) {
  return (
    <div>
      <div className="text-sm font-medium text-zinc-700">{label}</div>
      <div
        className={
          textarea
            ? "mt-2 min-h-32 border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-400"
            : "mt-2 h-11 border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-400"
        }
      />
    </div>
  );
}
