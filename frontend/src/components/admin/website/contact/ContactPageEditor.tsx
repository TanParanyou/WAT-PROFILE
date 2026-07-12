"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Settings, Compass, Search, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { ContactContentTab } from "./tabs/ContactContentTab";
import { ContactSettingsTab } from "./tabs/ContactSettingsTab";
import { ContactTransportTab } from "./tabs/ContactTransportTab";
import { SeoEditorTab } from "../shared/SeoEditorTab";
import { contactPageMasterSchema, type ContactPageMasterFormData } from "@/schemas/website-page.schema";
import { useContactPageQuery, useUpdateContactPageMutation } from "@/hooks/website-page-master";
import { useWebsiteCmsEditorStore } from "@/stores/website-cms-editor-store";

export function ContactPageEditor() {
  const t = useTranslations("Admin");
  const { data: pageData, isLoading } = useContactPageQuery();
  const updateMutation = useUpdateContactPageMutation();
  const [activeTab, setActiveTab] = useState<"content" | "settings" | "transport" | "seo">("content");
  
  const store = useWebsiteCmsEditorStore();

  const methods = useForm<ContactPageMasterFormData>({
    resolver: zodResolver(contactPageMasterSchema) as any,
    defaultValues: {
      slug: "contact",
      status: "published",
      seo: {
        title: { th: "", en: "", de: "" },
        description: { th: "", en: "", de: "" },
        keywords: { th: "", en: "", de: "" },
        og_image: "",
        canonical_url: "",
      },
      content: {
        hero_title: { th: "", en: "", de: "" },
        hero_subtitle: { th: "", en: "", de: "" },
        hero_tone: "calm",
        info_title: { th: "", en: "", de: "" },
        info_description: { th: "", en: "", de: "" },
        address: { th: "", en: "", de: "" },
        phone: "",
        email: "",
        show_social: true,
        show_bank: true,
        facebook: "",
        instagram: "",
        messenger: "",
        opening_days: { th: "", en: "", de: "" },
        opening_time: "",
        opening_remark: { th: "", en: "", de: "" },
        parking: { th: "", en: "", de: "" },
        directions_url: "",
        public_transport: [],
        car_directions: { th: "", en: "", de: "" },
        map_embed_url: "",
        map_location_name: "",
        bank_name: "",
        bank_account: "",
        bank_iban: "",
        bank_bic: "",
        form_title: { th: "", en: "", de: "" },
        form_description: { th: "", en: "", de: "" },
        form_enabled: true,
      },
    },
  });

  const { reset, handleSubmit, formState: { isDirty, errors } } = methods;

  useEffect(() => {
    if (pageData) {
      reset(pageData);
    }
  }, [pageData, reset]);

  // Update store status when form is dirty
  useEffect(() => {
    store.setHasUnsavedChanges(isDirty);
    return () => store.setHasUnsavedChanges(false);
  }, [isDirty]);

  if (isLoading) {
    return <PageLoading text="Loading Page Data..." />;
  }

  const onSubmit = (values: ContactPageMasterFormData) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        reset(values); // clear isDirty state
      },
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header toolbar */}
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950">Contact Page Master Data</h1>
            <p className="text-sm text-zinc-500">
              Manage the content, transport, and contact configurations for the Contact page.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeTab === "content" ? "primary" : "outline"}
              icon={<FileText size={14} />}
              onClick={() => setActiveTab("content")}
            >
              Headers & Form
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "settings" ? "primary" : "outline"}
              icon={<Settings size={14} />}
              onClick={() => setActiveTab("settings")}
            >
              Contact Details
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "transport" ? "primary" : "outline"}
              icon={<Compass size={14} />}
              onClick={() => setActiveTab("transport")}
            >
              Transportation
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "seo" ? "primary" : "outline"}
              icon={<Search size={14} />}
              onClick={() => setActiveTab("seo")}
            >
              SEO Settings
            </Button>
          </div>

          {/* Quick Info */}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>Status: </span>
            <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200 rounded font-medium uppercase tracking-wider">
              {pageData?.status || "published"}
            </span>
          </div>
        </div>

        {/* Form Error Alert if validation fails */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded">
            Please fix the validation errors before saving.
          </div>
        )}

        {/* Form Body */}
        <div className="space-y-4">
          {activeTab === "content" && (
            <ContactContentTab disabled={updateMutation.isPending} />
          )}
          {activeTab === "settings" && (
            <ContactSettingsTab disabled={updateMutation.isPending} />
          )}
          {activeTab === "transport" && (
            <ContactTransportTab disabled={updateMutation.isPending} />
          )}
          {activeTab === "seo" && (
            <SeoEditorTab disabled={updateMutation.isPending} />
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                </span>
                Unsaved changes
              </span>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            isLoading={updateMutation.isPending}
            icon={<Save size={16} />}
            className="w-full sm:w-auto shadow-sm"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
