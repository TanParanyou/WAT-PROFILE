"use client";

import React, { useState, useEffect } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Search } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import { LocalizedFieldGroup } from "./LocalizedFieldGroup";
import { PublicContentSaveBar } from "./PublicContentSaveBar";
import { privacyContentFormSchema } from "@/schemas/public-content.schema";
import { usePrivacyContentQuery, useUpdatePrivacyContentMutation } from "@/hooks/public-content";
import type { PrivacyContentFormData } from "@/types/public-content";
import type { LocalizedRichText } from "@/lib/rich-text/document";

const locales = [
  { code: "th", label: "TH" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

export function PrivacyContentForm() {
  const { data: privacyData, isLoading } = usePrivacyContentQuery();
  const updateMutation = useUpdatePrivacyContentMutation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"details" | "seo">("details");
  const [activeLocale, setActiveLocale] = useState<"th" | "en" | "de">("th");

  const methods = useForm<PrivacyContentFormData>({
    resolver: zodResolver(privacyContentFormSchema) as any,
    defaultValues: {
      title: { th: "", en: "", de: "" },
      seo: {
        title: { th: "", en: "", de: "" },
        description: { th: "", en: "", de: "" },
        keywords: { th: "", en: "", de: "" },
        og_image: "",
        canonical_url: "",
      },
      body: {
        content: { th: null, en: null, de: null },
        last_updated: "",
      },
    },
  });

  const { control, handleSubmit, reset, watch, formState: { isDirty, errors } } = methods;

  useEffect(() => {
    if (privacyData) {
      reset(privacyData);
    }
  }, [privacyData, reset]);

  if (isLoading) {
    return <PageLoading text="กำลังโหลดข้อมูลหน้าความเป็นส่วนตัว..." />;
  }

  const onSubmit = (values: PrivacyContentFormData) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success("บันทึกข้อมูลหน้านโยบายความเป็นส่วนตัวสำเร็จแล้ว");
      },
      onError: (err) => {
        toast.error(`บันทึกข้อมูลล้มเหลว: ${err.message}`);
      },
    });
  };

  const checkCompleteness = () => {
    const values = watch();
    // Checked if English and German rich text values have content
    const hasLang = (lang: "en" | "de") => {
      const content = values.body?.content?.[lang];
      if (!content) return false;
      const str = JSON.stringify(content);
      return !(str === "null" || str === "{}" || str.includes('"content":[]'));
    };
    return {
      th: true,
      en: hasLang("en"),
      de: hasLang("de"),
    };
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="min-h-[calc(100vh-7rem)] flex flex-col justify-between space-y-6">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-950">ข้อมูลหน้านโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
              <p className="text-sm text-zinc-500">จัดการข้อมูลนโยบายสิทธิความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล</p>
            </div>
          </div>

          <LocalizedFieldGroup
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
            completeness={checkCompleteness()}
          />

          {/* Tabs header */}
          <div className="flex gap-2 border-b border-zinc-200 pb-3">
            <Button
              type="button"
              size="sm"
              variant={activeTab === "details" ? "primary" : "outline"}
              icon={<Shield size={14} />}
              onClick={() => setActiveTab("details")}
            >
              เนื้อหานโยบาย
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "seo" ? "primary" : "outline"}
              icon={<Search size={14} />}
              onClick={() => setActiveTab("seo")}
            >
              SEO & ค้นหา
            </Button>
          </div>

          {/* Form Content per tab */}
          <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm space-y-6">
            
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-medium text-zinc-900">เนื้อหานโยบายความเป็นส่วนตัว</h3>
                  {watch("body.last_updated") && (
                    <span className="text-xs text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded">
                      อัปเดตล่าสุดโดยระบบ: {new Date(watch("body.last_updated")).toLocaleString("th-TH")}
                    </span>
                  )}
                </div>

                <Controller
                  name="title"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label="ชื่อหัวข้อหน้าเพจ"
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="body.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label="เนื้อหานโยบายฉบับสมบูรณ์ (แบบ Rich Text)"
                      locales={locales}
                      defaultLocale="th"
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">การตั้งค่าค้นหา (SEO Settings)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="seo.title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="SEO Title (ถ้าเว้นว่างจะใช้ชื่อหัวข้อเพจ)"
                        value={field.value as any}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="seo.description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="SEO Description (คำอธิบายสำหรับ Google)"
                        value={field.value as any}
                        onChange={field.onChange}
                        type="textarea"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Canonical URL</label>
                    <input
                      type="text"
                      {...methods.register("seo.canonical_url")}
                      placeholder="/th/privacy"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="seo_noindex"
                      {...methods.register("seo.noindex")}
                      className="rounded text-amber-600 focus:ring-amber-500 border-gray-300 w-4 h-4"
                    />
                    <label htmlFor="seo_noindex" className="text-sm font-medium text-gray-700 select-none">
                      No Index (ไม่ให้แสดงผลบน Google)
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">OG Image URL (ภาพตัวอย่างเมื่อแชร์ลิงก์)</label>
                  <input
                    type="text"
                    {...methods.register("seo.og_image")}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        <PublicContentSaveBar
          isDirty={isDirty}
          isPending={updateMutation.isPending}
          updatedAt={privacyData?.updated_at}
          publicUrl="/privacy"
        />
      </form>
    </FormProvider>
  );
}
export default PrivacyContentForm;
