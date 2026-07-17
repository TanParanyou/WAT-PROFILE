"use client";

import React, { useState, useEffect } from "react";
import { FormProvider, useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Target, Landmark, History, Home, Users, Search, Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { MultiLangRichText } from "@/components/admin/rich-text/MultiLangRichText";
import { LocalizedFieldGroup } from "./LocalizedFieldGroup";
import { PublicContentSaveBar } from "./PublicContentSaveBar";
import { aboutContentFormSchema } from "@/schemas/public-content.schema";
import { useAboutContentQuery, useUpdateAboutContentMutation } from "@/hooks/public-content";
import type { AboutContentFormData } from "@/types/public-content";

const locales = [
  { code: "th", label: "TH" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

export function AboutContentForm() {
  const { data: aboutData, isLoading } = useAboutContentQuery();
  const updateMutation = useUpdateAboutContentMutation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"intro" | "objective" | "administration" | "history" | "buildings" | "sangha" | "seo">("intro");
  const [activeLocale, setActiveLocale] = useState<"th" | "en" | "de">("th");

  const methods = useForm<AboutContentFormData>({
    resolver: zodResolver(aboutContentFormSchema),
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
        intro: {
          heading: { th: "", en: "", de: "" },
          description: { th: "", en: "", de: "" },
          founded: { th: "", en: "", de: "" },
          location: { th: "", en: "", de: "" },
        },
        objective: {
          heading: { th: "", en: "", de: "" },
          subtitle: { th: "", en: "", de: "" },
          content: { th: null, en: null, de: null },
        },
        administration: {
          heading: { th: "", en: "", de: "" },
          content: { th: null, en: null, de: null },
        },
        history: {
          heading: { th: "", en: "", de: "" },
          content: { th: null, en: null, de: null },
        },
        buildings: {
          heading: { th: "", en: "", de: "" },
          items: [],
        },
        sangha: {
          heading: { th: "", en: "", de: "" },
          mission: { th: "", en: "", de: "" },
          content: { th: null, en: null, de: null },
        },
      },
    },
  });

  const { control, handleSubmit, reset, watch, formState: { isDirty } } = methods;

  const { fields: buildingFields, append: appendBuilding, remove: removeBuilding } = useFieldArray({
    control,
    name: "body.buildings.items",
  });

  useEffect(() => {
    if (aboutData) {
      reset(aboutData);
    }
  }, [aboutData, reset]);

  if (isLoading) {
    return <PageLoading text="กำลังโหลดข้อมูลหน้าเกี่ยวกับวัด..." />;
  }

  const onSubmit = (values: AboutContentFormData) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success("บันทึกข้อมูลหน้าเกี่ยวกับวัดสำเร็จแล้ว");
      },
      onError: (err) => {
        toast.error(`บันทึกข้อมูลล้มเหลว: ${err.message}`);
      },
    });
  };

  // Check completeness helper for current section locale
  const checkCompleteness = () => {
    const values = watch();
    // We can evaluate if basic EN/DE fields have any content
    const hasLang = (lang: "en" | "de") => {
      const introHeading = values.body?.intro?.heading?.[lang] || "";
      const objHeading = values.body?.objective?.heading?.[lang] || "";
      const adminHeading = values.body?.administration?.heading?.[lang] || "";
      const histHeading = values.body?.history?.heading?.[lang] || "";
      return !!(introHeading && objHeading && adminHeading && histHeading);
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
              <h1 className="text-xl font-semibold text-zinc-950">ข้อมูลหน้าเกี่ยวกับวัด (About Page)</h1>
              <p className="text-sm text-zinc-500">จัดการเนื้อหา ข้อมูลความเป็นมา วัตถุประสงค์ และข้อมูลอาคารศาสนสถาน</p>
            </div>
          </div>

          <LocalizedFieldGroup
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
            completeness={checkCompleteness()}
          />

          {/* Tabs header */}
          <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
            <Button
              type="button"
              size="sm"
              variant={activeTab === "intro" ? "primary" : "outline"}
              icon={<Info size={14} />}
              onClick={() => setActiveTab("intro")}
            >
              แนะนำ & วิสัยทัศน์
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "objective" ? "primary" : "outline"}
              icon={<Target size={14} />}
              onClick={() => setActiveTab("objective")}
            >
              วัตถุประสงค์
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "administration" ? "primary" : "outline"}
              icon={<Landmark size={14} />}
              onClick={() => setActiveTab("administration")}
            >
              การบริหารจัดการ
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "history" ? "primary" : "outline"}
              icon={<History size={14} />}
              onClick={() => setActiveTab("history")}
            >
              ความเป็นมา
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "buildings" ? "primary" : "outline"}
              icon={<Home size={14} />}
              onClick={() => setActiveTab("buildings")}
            >
              อาคารศาสนสถาน
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "sangha" ? "primary" : "outline"}
              icon={<Users size={14} />}
              onClick={() => setActiveTab("sangha")}
            >
              คณะสงฆ์
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
            
            {activeTab === "intro" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">แนะนำและวิสัยทัศน์</h3>
                
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
                    name="body.intro.heading"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="หัวข้อการแนะนำ (Intro Heading)"
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.intro.description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="รายละเอียดการแนะนำ (Intro Description)"
                        value={field.value}
                        onChange={field.onChange}
                        type="textarea"
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.intro.founded"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="ปีที่ก่อตั้ง (Founded Text/Date)"
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.intro.location"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="สถานที่ตั้งวัด (Location Text)"
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {activeTab === "objective" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">วัตถุประสงค์</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.objective.heading"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="หัวข้อวัตถุประสงค์"
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.objective.subtitle"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="หัวข้อย่อยวัตถุประสงค์"
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <Controller
                  name="body.objective.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label="เนื้อหาวัตถุประสงค์ (แบบ Rich Text)"
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

            {activeTab === "administration" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">การบริหารจัดการ</h3>
                
                <Controller
                  name="body.administration.heading"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label="หัวข้อการบริหารจัดการ"
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="body.administration.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label="ข้อมูลบริหารจัดการ (แบบ Rich Text)"
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

            {activeTab === "history" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">ความเป็นมาและประวัติ</h3>
                
                <Controller
                  name="body.history.heading"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label="หัวข้อประวัติความเป็นมา"
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="body.history.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label="ข้อมูลประวัติความเป็นมา (แบบ Rich Text)"
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

            {activeTab === "buildings" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">อาคารศาสนสถาน</h3>
                
                <Controller
                  name="body.buildings.heading"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangInput
                      label="หัวข้อหลักศาสนสถาน"
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-800">รายการศาสนสถานภายในวัด</label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      icon={<Plus size={14} />}
                      onClick={() => appendBuilding({ name: { th: "", en: "", de: "" }, description: { th: "", en: "", de: "" } })}
                    >
                      เพิ่มอาคาร
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {buildingFields.map((field, index) => (
                      <div key={field.id} className="p-4 border border-zinc-200 rounded-lg bg-zinc-50/50 space-y-4 relative">
                        <button
                          type="button"
                          onClick={() => removeBuilding(index)}
                          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-zinc-100 transition-colors"
                          title="ลบอาคารนี้"
                        >
                          <Trash size={16} />
                        </button>
                        
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">อาคารลำดับที่ {index + 1}</span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Controller
                            name={`body.buildings.items.${index}.name`}
                            control={control}
                            render={({ field: f, fieldState: fs }) => (
                              <MultiLangInput
                                label="ชื่ออาคาร"
                                value={f.value}
                                onChange={f.onChange}
                                required
                                error={fs.error?.message}
                              />
                            )}
                          />
                          <Controller
                            name={`body.buildings.items.${index}.description`}
                            control={control}
                            render={({ field: f, fieldState: fs }) => (
                              <MultiLangInput
                                label="คำอธิบาย/รายละเอียดอาคาร"
                                value={f.value}
                                onChange={f.onChange}
                                type="textarea"
                                error={fs.error?.message}
                              />
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    {buildingFields.length === 0 && (
                      <div className="text-center py-8 text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                        ยังไม่มีข้อมูลอาคารศาสนสถาน คลิกปุ่มเพิ่มอาคารเพื่อเริ่มต้น
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sangha" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-zinc-900 border-b pb-2">คณะสงฆ์</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="body.sangha.heading"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="หัวข้อคณะสงฆ์"
                        value={field.value}
                        onChange={field.onChange}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="body.sangha.mission"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MultiLangInput
                        label="พันธกิจคณะสงฆ์"
                        value={field.value}
                        onChange={field.onChange}
                        type="textarea"
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <Controller
                  name="body.sangha.content"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MultiLangRichText
                      label="ข้อมูลคณะสงฆ์ (แบบ Rich Text)"
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
                        value={field.value}
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
                        value={field.value}
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
                      placeholder="/th/about"
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
          updatedAt={aboutData?.updated_at}
          publicUrl="/about"
        />
      </form>
    </FormProvider>
  );
}
export default AboutContentForm;
