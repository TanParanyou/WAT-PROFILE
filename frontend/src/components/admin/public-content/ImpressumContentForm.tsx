"use client";

import React, { useState, useEffect } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Scale, FileText, UserCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { LocalizedFieldGroup } from "./LocalizedFieldGroup";
import { PublicContentSaveBar } from "./PublicContentSaveBar";
import { impressumContentFormSchema } from "@/schemas/public-content.schema";
import { useImpressumContentQuery, useUpdateImpressumContentMutation } from "@/hooks/public-content";
import type { ImpressumContentFormData } from "@/types/public-content";
import type { MultiLangText } from "@/types/api";

export function ImpressumContentForm() {
  const { data: impressumData, isLoading } = useImpressumContentQuery();
  const updateMutation = useUpdateImpressumContentMutation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"details" | "legal" | "responsibility" | "seo">("details");
  const [activeLocale, setActiveLocale] = useState<"th" | "en" | "de">("th");

  const methods = useForm<ImpressumContentFormData>({
    resolver: zodResolver(impressumContentFormSchema),
    defaultValues: {
      title: { th: "", en: "", de: "" },
      description: { th: "", en: "", de: "" },
      seo: {
        title: { th: "", en: "", de: "" },
        description: { th: "", en: "", de: "" },
        keywords: { th: "", en: "", de: "" },
        og_image: "",
        canonical_url: "",
      },
      body: {
        organization_name: { th: "", en: "", de: "" },
        legal_form: { th: "", en: "", de: "" },
        address: { th: "", en: "", de: "" },
        phone: "",
        email: "",
        representative: { th: "", en: "", de: "" },
        registry_court: { th: "", en: "", de: "" },
        registry_number: "",
        vat_id: "",
        content_responsibility: { th: "", en: "", de: "" },
      },
    },
  });

  const { control, handleSubmit, reset, watch, formState: { isDirty, errors } } = methods;

  useEffect(() => {
    if (impressumData) {
      reset(impressumData);
    }
  }, [impressumData, reset]);

  if (isLoading) {
    return <PageLoading text="กำลังโหลดข้อมูลหน้าข้อมูลทางกฎหมาย..." />;
  }

  const onSubmit = (values: ImpressumContentFormData) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success("บันทึกข้อมูลหน้าข้อมูลทางกฎหมายสำเร็จแล้ว");
      },
      onError: (err) => {
        toast.error(`บันทึกข้อมูลล้มเหลว: ${err.message}`);
      },
    });
  };

  const checkCompleteness = () => {
    const values = watch();
    const hasLang = (lang: "en" | "de") => {
      return !!(values.body?.organization_name?.[lang] && values.body?.address?.[lang]);
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
              <h1 className="text-xl font-semibold text-zinc-950">ข้อมูลทางกฎหมาย (Impressum)</h1>
              <p className="text-sm text-zinc-500">จัดการข้อมูลผู้จัดตั้งสมาคม ผู้แทนนิติบัญญัติ และข้อมูลจดทะเบียนตามกฎหมายเยอรมัน</p>
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
              icon={<FileText size={14} />}
              onClick={() => setActiveTab("details")}
            >
              ข้อมูลสมาคม & ที่อยู่
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "legal" ? "primary" : "outline"}
              icon={<Scale size={14} />}
              onClick={() => setActiveTab("legal")}
            >
              ข้อมูลลงทะเบียน
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "responsibility" ? "primary" : "outline"}
              icon={<UserCheck size={14} />}
              onClick={() => setActiveTab("responsibility")}
            >
              ผู้รับผิดชอบเนื้อหา
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
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">ข้อมูลสมาคมและที่อยู่จัดตั้ง</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="คำอธิบายหน้าเพจย่อ"
                        value={field.value}
                        onChange={field.onChange}
                        type="textarea"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.organization_name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="ชื่อองค์กร/สมาคมตามกฎหมาย"
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.legal_form"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="รูปแบบการจดทะเบียนตามกฎหมาย (เช่น สมาคมจดทะเบียน e.V.)"
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <Controller
                  name="body.address"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label="ที่อยู่จดตั้งสมาคม (Address)"
                      value={field.value}
                      onChange={field.onChange}
                      type="textarea"
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์ (Phone)</label>
                    <input
                      type="text"
                      {...methods.register("body.phone")}
                      placeholder="+49 160-1604486"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">อีเมลทางการของสมาคม (Official Email)</label>
                    <input
                      type="text"
                      {...methods.register("body.email")}
                      placeholder="info@watloungporsai.de"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                    {errors.body?.email && <p className="text-sm text-red-600 mt-1">{errors.body.email.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "legal" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">ข้อมูลตัวแทนและข้อมูลการจดทะเบียนศาล</h3>
                
                <Controller
                  name="body.representative"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label="ผู้แทนสมาคมตามกฎหมาย (Legal Representative)"
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.registry_court"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="ศาลที่จดทะเบียนจัดตั้งสมาคม (Registry Court)"
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">เลขทะเบียนการจดทะเบียน (Registry Number)</label>
                    <input
                      type="text"
                      {...methods.register("body.registry_number")}
                      placeholder="VR 20123"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">เลขประจำตัวผู้เสียภาษีอากร / VAT ID (ถ้ามี)</label>
                  <input
                    type="text"
                    {...methods.register("body.vat_id")}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "responsibility" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">ผู้รับผิดชอบเนื้อหาเว็บไซต์</h3>
                
                <Controller
                  name="body.content_responsibility"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label="ผู้รับผิดชอบการเผยแพร่เนื้อหาตามมาตรา § 55 Abs. 2 RStV (Content Responsibility)"
                      value={field.value}
                      onChange={field.onChange}
                      required
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
                        value={field.value as MultiLangText}
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
                        value={field.value as MultiLangText}
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
                      placeholder="/th/impressum"
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
          updatedAt={impressumData?.updated_at}
          publicUrl="/impressum"
        />
      </form>
    </FormProvider>
  );
}
export default ImpressumContentForm;
