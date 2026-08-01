"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Compass, Home, Users, Search, Save } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { AboutIntroTab } from "./tabs/AboutIntroTab";
import { AboutHistoryTab } from "./tabs/AboutHistoryTab";
import { AboutBuildingsTab } from "./tabs/AboutBuildingsTab";
import { AboutSanghaTab } from "./tabs/AboutSanghaTab";
import { SeoEditorTab } from "../shared/SeoEditorTab";
import { aboutPageMasterSchema, type AboutPageMasterFormData } from "@/schemas/website-page.schema";
import { useAboutPageQuery, useUpdateAboutPageMutation } from "@/hooks/website-cms";
import { useWebsiteCmsEditorStore } from "@/stores/website-cms-editor-store";
import { useToast } from "@/hooks/useToast";
import { richTextMigrationService } from "@/services/richTextMigrationService";
import {
  contentPageToAboutFormData,
  aboutFormDataToContentPagePayload,
  hasLegacyAboutRichTextBody,
} from "@/utils/websiteCms";

export function AboutPageEditor() {
  const { data: pageData, isLoading } = useAboutPageQuery();
  const updateMutation = useUpdateAboutPageMutation();
  const [activeTab, setActiveTab] = useState<"intro" | "history" | "buildings" | "sangha" | "seo">("intro");
  
  const store = useWebsiteCmsEditorStore();
  const { toast } = useToast();

  const methods = useForm<AboutPageMasterFormData>({
    resolver: zodResolver(aboutPageMasterSchema) as Resolver<AboutPageMasterFormData>,
    defaultValues: {
      slug: "about",
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
        intro_title: { th: "", en: "", de: "" },
        intro_description: { th: "", en: "", de: "" },
        intro_founded: { th: "", en: "", de: "" },
        intro_location: { th: "", en: "", de: "" },
        objective_title: { th: "", en: "", de: "" },
        objective_content: { th: { type: "doc", content: [] }, en: { type: "doc", content: [] }, de: { type: "doc", content: [] } },
        objective_subtitle: { th: "", en: "", de: "" },
        administration_title: { th: "", en: "", de: "" },
        administration_content: { th: { type: "doc", content: [] }, en: { type: "doc", content: [] }, de: { type: "doc", content: [] } },
        history_title: { th: "", en: "", de: "" },
        history_content: { th: { type: "doc", content: [] }, en: { type: "doc", content: [] }, de: { type: "doc", content: [] } },
        buildings_title: { th: "", en: "", de: "" },
        buildings_items: [],
        sangha_title: { th: "", en: "", de: "" },
        sangha_mission: { th: "", en: "", de: "" },
        sangha_current_work: { th: "", en: "", de: "" },
      },
    },
  });

  const { reset, handleSubmit, formState: { isDirty, errors } } = methods;

  useEffect(() => {
    if (pageData) {
      const formData = contentPageToAboutFormData(pageData);
      reset(formData);

      if (hasLegacyAboutRichTextBody(pageData.body)) {
        void richTextMigrationService.migrate({
          resource: "content_page",
          id: pageData.id,
          updated_at: pageData.updated_at,
          field: "body",
          value: aboutFormDataToContentPagePayload(formData).body,
        }).catch(() => undefined);
      }
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

  const onSubmit = (values: AboutPageMasterFormData) => {
    if (!pageData?.id) return;
    
    updateMutation.mutate(
      { id: pageData.id, payload: aboutFormDataToContentPagePayload(values) },
      {
        onSuccess: (updatedPage) => {
          toast.success("Saved successfully");
          reset(contentPageToAboutFormData(updatedPage));
        },
        onError: () => {
          toast.error("Failed to save data");
        },
      },
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header toolbar */}
        <div className="flex flex-col gap-4 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-admin-foreground">About Page Master Data</h1>
            <p className="text-sm text-admin-muted">
              Manage the content and configurations for the About page.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col gap-4 border-b border-admin-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeTab === "intro" ? "primary" : "outline"}
              icon={<FileText size={14} />}
              onClick={() => setActiveTab("intro")}
            >
              Intro & Vision
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "history" ? "primary" : "outline"}
              icon={<Compass size={14} />}
              onClick={() => setActiveTab("history")}
            >
              History & Board
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "buildings" ? "primary" : "outline"}
              icon={<Home size={14} />}
              onClick={() => setActiveTab("buildings")}
            >
              Buildings
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "sangha" ? "primary" : "outline"}
              icon={<Users size={14} />}
              onClick={() => setActiveTab("sangha")}
            >
              Sangha
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
          <div className="flex items-center gap-3 text-xs text-admin-muted">
            <span>Status: </span>
            <span className="font-mono bg-admin-success-surface text-admin-success px-2 py-0.5 border border-admin-success-border rounded font-medium uppercase tracking-wider">
              {pageData?.status || "published"}
            </span>
          </div>
        </div>

        {/* Form Error Alert if validation fails */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 border border-admin-danger-border bg-admin-danger-surface text-admin-danger text-xs rounded-none">
            Please fix the validation errors before saving.
          </div>
        )}

        {/* Form Body */}
        <div className="space-y-4">
          {activeTab === "intro" && (
            <AboutIntroTab disabled={updateMutation.isPending} />
          )}
          {activeTab === "history" && (
            <AboutHistoryTab disabled={updateMutation.isPending} />
          )}
          {activeTab === "buildings" && (
            <AboutBuildingsTab disabled={updateMutation.isPending} />
          )}
          {activeTab === "sangha" && (
            <AboutSanghaTab disabled={updateMutation.isPending} />
          )}
          {activeTab === "seo" && (
            <SeoEditorTab disabled={updateMutation.isPending} />
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-admin-border bg-admin-surface/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-admin-warning">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-admin-warning opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-admin-warning"></span>
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
