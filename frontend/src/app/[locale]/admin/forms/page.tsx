"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Printer,
  Download,
  FileCheck2,
  Award,
  BookOpen,
  HeartHandshake,
  Search,
  Sparkles,
  Settings,
  Languages,
  CheckCircle2,
  RefreshCw,
  X,
  Eye,
  Sliders,
  Save,
  Loader2,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { SignatureManager } from "@/components/admin/SignatureManager";
import { useToast } from "@/hooks/useToast";
import { usePermission } from "@/hooks/usePermission";
import { useSignaturePresets } from "@/hooks/useSignaturePresets";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { donationAdminService, settingsAdminService } from "@/services/adminService";
import type { Donation } from "@/types/entities";
import type { SignatureMode } from "@/types/signatures";
import { cn } from "@/utils/cn";

type TemplateType =
  | "donation_certificate"
  | "annual_tax_certificate"
  | "ordination_certificate"
  | "appreciation_letter";

type LanguageMode = "bilingual" | "th" | "de";

interface TemplateOption {
  id: TemplateType;
  titleTh: string;
  titleDe: string;
  description: string;
  icon: React.ElementType;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: "donation_certificate",
    titleTh: "ใบอนุโมทนาบัตร / ใบเสร็จรับเงิน",
    titleDe: "Spendenbescheinigung & Quittung",
    description: "ออกใบอนุโมทนาบัตรรายครั้งสำหรับผู้บริจาคเงินบำรุงวัด พร้อมตราประทับและลายเซ็น",
    icon: Award,
  },
  {
    id: "annual_tax_certificate",
    titleTh: "ใบรับรองเงินบริจาคประจำปี (ลดหย่อนภาษี)",
    titleDe: "Jahreszuwendungsbestätigung (§ 10b EStG)",
    description: "หนังสือรับรองการบริจาครวมรายปีตามกฎหมายภาษีของเยอรมนีสำหรับยื่น Finanzamt",
    icon: FileCheck2,
  },
  {
    id: "ordination_certificate",
    titleTh: "หนังสือรับรองการบรรพชา/อุปสมบท/ปฏิบัติธรรม",
    titleDe: "Ordinations- & Meditationsbescheinigung",
    description: "เอกสารรับรองการเข้าบวช บรรพชาสามเณร หรือการเข้าร่วมปฏิบัติธรรมเจริญจิตตภาวนา",
    icon: BookOpen,
  },
  {
    id: "appreciation_letter",
    titleTh: "หนังสือขอบคุณและอนุโมทนาเกียรติคุณ",
    titleDe: "Dankschreiben & Ehrenurkunde",
    description: "หนังสือแสดงความขอบคุณแก่เจ้าภาพ ผู้อุปถัมภ์ และจิตอาสาที่ช่วยงานกิจกรรมวัด",
    icon: HeartHandshake,
  },
];

export default function DocumentFormsHubPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const printSheetRef = useRef<HTMLDivElement>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("donation_certificate");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form Fields State
  const [recipientName, setRecipientName] = useState("นายสมชาย ใจดี และครอบครัว");
  const [recipientAddress, setRecipientAddress] = useState("Darmstädter Landstraße 123, 60311 Frankfurt am Main");
  const [paliDharmaName, setPaliDharmaName] = useState("ธมฺมธโร (ผู้ทรงไว้ซึ่งธรรม)");
  const [preceptorName, setPreceptorName] = useState("พระครูวิมลธรรมวิเทศ");
  const [taxYear, setTaxYear] = useState(() => String(new Date().getFullYear()));
  const [amount, setAmount] = useState<number>(500);
  const [amountInWords, setAmountInWords] = useState("ห้าร้อยยูโรถ้วน / Fünfhundert Euro");
  const [currency, setCurrency] = useState("EUR");
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [donationMethod, setDonationMethod] = useState("โอนเงินผ่านธนาคาร (Bank Transfer)");
  const [purpose, setPurpose] = useState("ร่วมทำบุญสร้างอุโบสถและบำรุงค่าน้ำค่าไฟวัด");
  const [referenceNumber, setReferenceNumber] = useState(() => `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [customBlessingTh, setCustomBlessingTh] = useState("");
  const [customBlessingDe, setCustomBlessingDe] = useState("");

  // Options
  const [languageMode, setLanguageMode] = useState<LanguageMode>("bilingual");
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("saved");
  const [liveSignature, setLiveSignature] = useState<string | null>(null);

  // Donation Picker State
  const [isDonationPickerOpen, setIsDonationPickerOpen] = useState(false);
  const [donationSearchQuery, setDonationSearchQuery] = useState("");

  // Settings Drawer State (In-page Configuration)
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch Settings
  const { data: settingsData } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => settingsAdminService.getAll(),
  });

  const settingsMap = useMemo(() => {
    if (!settingsData) return {};
    return Object.fromEntries(settingsData.map((s) => [s.key, s.value]));
  }, [settingsData]);

  const { can } = usePermission();
  const canManageSettings = can("settings", "update") || can("donations", "update");

  const savedSignatureUrl = settingsMap.certificate_signature_url || "";
  const {
    presets: signaturePresets,
    selectedPresetId,
    setSelectedPresetId,
    savePreset: handleSaveToPresets,
    deletePreset: handleDeletePreset,
    resolveActiveSignature,
  } = useSignaturePresets(savedSignatureUrl);

  const activeSignatureUrl = resolveActiveSignature(signatureMode, liveSignature);

  const handleSaveAsWatDefault = async (dataUrl: string) => {
    if (!canManageSettings) {
      toast.error("คุณไม่มีสิทธิ์แก้ไขลายเซ็นหลักของวัด (ต้องมีสิทธิ์ Settings หรือ Donations Update)");
      return;
    }
    setIsSavingSettings(true);
    try {
      await settingsAdminService.update([
        { key: "certificate_signature_url", value: dataUrl },
      ]);
      await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("บันทึกลายเซ็นเป็นลายเซ็นทางการของวัดเรียบร้อยแล้ว");
      setSelectedPresetId("default");
      setSignatureMode("saved");
    } catch {
      toast.error("ไม่สามารถบันทึกลายเซ็นได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Drawer Form State for in-page Settings
  const [drawerOrgNameTh, setDrawerOrgNameTh] = useState("");
  const [drawerOrgNameDe, setDrawerOrgNameDe] = useState("");
  const [drawerOrgSubtitle, setDrawerOrgSubtitle] = useState("");
  const [drawerTaxNumber, setDrawerTaxNumber] = useState("");
  const [drawerAddress, setDrawerAddress] = useState("");
  const [drawerBlessingTh, setDrawerBlessingTh] = useState("");
  const [drawerBlessingDe, setDrawerBlessingDe] = useState("");
  const [drawerSignatoryName, setDrawerSignatoryName] = useState("");
  const [drawerSignatoryTitle, setDrawerSignatoryTitle] = useState("");
  const [drawerSealUrl, setDrawerSealUrl] = useState("");
  const [drawerSignatureUrl, setDrawerSignatureUrl] = useState("");

  const openSettingsDrawer = () => {
    setDrawerOrgNameTh(settingsMap.certificate_org_name_th || "วัดหลวงพ่อสาย เยอรมนี");
    setDrawerOrgNameDe(settingsMap.certificate_org_name_de || "WAT LOUNG POR SAI e.V.");
    setDrawerOrgSubtitle(settingsMap.certificate_org_subtitle || "Theravada Buddhist Temple & Community Association e.V.");
    setDrawerTaxNumber(settingsMap.certificate_tax_number || "VR 12345 / FA Frankfurt");
    setDrawerAddress(settingsMap.certificate_address || "Darmstädter Landstraße, Frankfurt am Main, Germany");
    setDrawerBlessingTh(settingsMap.certificate_blessing_th || "ขออาราธนาคุณพระศรีรัตนตรัย จงดลบันดาลให้ท่านและครอบครัวประสบแต่ความสุข ความเจริญ ด้วยจตุรพิธพรชัยทุกประการเทอญ");
    setDrawerBlessingDe(settingsMap.certificate_blessing_de || "Möge diese heilsame Tat Ihnen und Ihrer Familie dauerhaften Frieden, Freude und Wohlergehen bringen.");
    setDrawerSignatoryName(settingsMap.certificate_signatory_name || "พระครูวิมลธรรมวิเทศ");
    setDrawerSignatoryTitle(settingsMap.certificate_signatory_title || "Vorstand / เจ้าอาวาส");
    setDrawerSealUrl(settingsMap.certificate_seal_url || "");
    setDrawerSignatureUrl(settingsMap.certificate_signature_url || "");
    setIsSettingsDrawerOpen(true);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const updates = [
        { key: "certificate_org_name_th", value: drawerOrgNameTh },
        { key: "certificate_org_name_de", value: drawerOrgNameDe },
        { key: "certificate_org_subtitle", value: drawerOrgSubtitle },
        { key: "certificate_tax_number", value: drawerTaxNumber },
        { key: "certificate_address", value: drawerAddress },
        { key: "certificate_blessing_th", value: drawerBlessingTh },
        { key: "certificate_blessing_de", value: drawerBlessingDe },
        { key: "certificate_signatory_name", value: drawerSignatoryName },
        { key: "certificate_signatory_title", value: drawerSignatoryTitle },
        { key: "certificate_seal_url", value: drawerSealUrl },
        { key: "certificate_signature_url", value: drawerSignatureUrl },
      ];

      await settingsAdminService.update(updates);

      await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("บันทึกข้อมูลหัวเอกสารและลายเซ็นวัดเรียบร้อยแล้ว");
      setIsSettingsDrawerOpen(false);
    } catch {
      toast.error("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Fetch recent confirmed donations for picker
  const { data: recentDonations, isLoading: isDonationsLoading } = useQuery({
    queryKey: ["admin", "donations", "forms-picker"],
    queryFn: () => donationAdminService.getAll({ status: "confirmed", limit: 20 }),
    enabled: isDonationPickerOpen,
  });

  // Settings values with fallback
  const orgNameTh = settingsMap.certificate_org_name_th || "วัดหลวงพ่อสาย เยอรมนี";
  const orgNameDe = settingsMap.certificate_org_name_de || "WAT LOUNG POR SAI e.V.";
  const orgSubtitle = settingsMap.certificate_org_subtitle || "Theravada Buddhist Temple & Community Association e.V.";
  const taxNumber = settingsMap.certificate_tax_number || "VR 12345 / FA Frankfurt";
  const addressLine = settingsMap.certificate_address || "Darmstädter Landstraße, Frankfurt am Main, Germany";
  const blessingTh = customBlessingTh || settingsMap.certificate_blessing_th || "ขออาราธนาคุณพระศรีรัตนตรัย จงดลบันดาลให้ท่านและครอบครัวประสบแต่ความสุข ความเจริญ ด้วยจตุรพิธพรชัยทุกประการเทอญ";
  const blessingDe = customBlessingDe || settingsMap.certificate_blessing_de || "Möge diese heilsame Tat Ihnen und Ihrer Familie dauerhaften Frieden, Freude und Wohlergehen bringen.";
  const signatoryName = settingsMap.certificate_signatory_name || "พระครูวิมลธรรมวิเทศ";
  const signatoryTitle = settingsMap.certificate_signatory_title || "Vorstand / เจ้าอาวาส";
  const sealUrl = settingsMap.certificate_seal_url || "";

  const handleSelectDonation = (d: Donation) => {
    setRecipientName(d.donor_name || (d.is_anonymous ? "Anonymous Donor / ผู้มีจิตศรัทธา" : ""));
    setRecipientAddress(d.donor_address || "");
    setAmount(d.amount || 0);
    setCurrency(d.currency || "EUR");
    if (d.donation_date) {
      const dateStr = new Date(d.donation_date).toISOString().split("T")[0];
      setDocumentDate(dateStr);
      setTaxYear(dateStr.split("-")[0]);
    }
    if (d.receipt_number) {
      setReferenceNumber(d.receipt_number);
    }
    if (d.donation_method) {
      setDonationMethod(d.donation_method);
    }
    const catTh = d.category?.name?.["th"];
    const catDe = d.category?.name?.["de"];
    const catEn = d.category?.name?.["en"];
    setPurpose(catTh || catDe || catEn || "บำรุงวัดและกิจกรรมพระพุทธศาสนา / Spende");
    setIsDonationPickerOpen(false);
    toast.success(`ดึงข้อมูลรายการบริจาค ${d.receipt_number || d.donor_name} สำเร็จ`);
  };

  const formattedAmount = useMemo(() => {
    return amount.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [amount]);

  const formattedDateDe = useMemo(() => {
    if (!documentDate) return new Date().toLocaleDateString("de-DE");
    return new Date(documentDate).toLocaleDateString("de-DE");
  }, [documentDate]);

  const formattedDateTh = useMemo(() => {
    if (!documentDate) return "";
    const d = new Date(documentDate);
    const thYear = d.getFullYear() + 543;
    const monthsTh = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${d.getDate()} ${monthsTh[d.getMonth()]} พ.ศ. ${thYear}`;
  }, [documentDate]);

  const filteredDonations: Donation[] = useMemo(() => {
    const list: Donation[] = recentDonations?.data || [];
    if (!donationSearchQuery.trim()) return list;
    const q = donationSearchQuery.toLowerCase();
    return list.filter(
      (d: Donation) =>
        Boolean(d.donor_name?.toLowerCase().includes(q)) ||
        Boolean(d.receipt_number?.toLowerCase().includes(q)) ||
        String(d.amount).includes(q)
    );
  }, [recentDonations, donationSearchQuery]);

  // Direct PDF Download Handler
  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const [{ toPng }, { default: jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const sheet = printSheetRef.current;
      const imgData = await toPng(sheet, {
        quality: 0.98,
        pixelRatio: 2, // 2x Retina resolution for sharp Thai and German fonts
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      const safeName = recipientName.replace(/[^a-zA-Z0-9ก-๙_-]/g, "_") || "certificate";
      pdf.save(`${referenceNumber || "cert"}_${safeName}.pdf`);
      toast.success("ดาวน์โหลดไฟล์ PDF สำเร็จเรียบร้อยแล้ว");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error(
        "เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: " +
          (err instanceof Error ? err.message : "กรุณาลองใช้ปุ่มพิมพ์เอกสารเพื่อบันทึกเป็น PDF")
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Header (Hidden in Print) */}
      <div className="print:hidden">
        <AdminPageHeader
          title="แบบฟอร์มเอกสารและใบอนุโมทนาบัตร (Document Forms & Certificates)"
          breadcrumbs={[
            { label: "การเงินและชุมชน", href: "/admin/donations" },
            { label: "แบบฟอร์มเอกสาร" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={openSettingsDrawer}
                className="text-xs flex items-center gap-1.5"
              >
                <Settings size={14} />
                <span>ตั้งค่าหัวเอกสาร &amp; ตราประทับวัด</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="text-xs flex items-center gap-1.5 text-admin-action border-admin-action/30 hover:bg-admin-action/5"
              >
                {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{isGeneratingPdf ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF (Download)"}</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="text-xs flex items-center gap-1.5"
              >
                <Printer size={15} />
                <span>พิมพ์เอกสาร (Print)</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Template Selector Cards (Hidden in Print) */}
      <div className="print:hidden bg-admin-surface border border-admin-border p-5 rounded-none space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-admin-foreground flex items-center gap-2">
            <Sliders size={14} className="text-admin-action" />
            <span>เลือกประเภทแบบฟอร์มเอกสาร (Select Document Template)</span>
          </h2>
          <span className="text-xs text-admin-muted">
            มี {TEMPLATES.length} รูปแบบพร้อมใช้งาน
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={cn(
                  "p-4 border text-left flex flex-col justify-between transition-all rounded-none relative overflow-hidden",
                  isSelected
                    ? "border-admin-focus bg-admin-focus/5 ring-1 ring-admin-focus shadow-xs"
                    : "border-admin-border bg-admin-surface hover:border-admin-body/40 hover:bg-admin-surface-muted/30"
                )}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-7 h-7 flex items-center justify-center bg-admin-focus text-white">
                    <CheckCircle2 size={14} />
                  </div>
                )}
                <div>
                  <div className="p-2 w-fit bg-admin-surface-muted border border-admin-border text-admin-action mb-2.5">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-xs font-bold text-admin-foreground leading-snug">
                    {tmpl.titleTh}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{tmpl.titleDe}</p>
                </div>
                <p className="text-[11px] text-admin-muted mt-3 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Interface: Left (Interactive Form) & Right (Live A4 Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* LEFT COLUMN: EDIT FORM CONTROLS (Hidden in Print) */}
        <div className="print:hidden lg:col-span-4 space-y-5">
          {/* Smart Data Sync */}
          <div className="bg-admin-surface border border-admin-border p-4 space-y-3 rounded-none">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-foreground flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                <span>แหล่งข้อมูล (Data Source)</span>
              </h3>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDonationPickerOpen(true)}
              className="w-full flex items-center justify-center gap-2 text-xs py-2 bg-amber-50/50 hover:bg-amber-100/50 border-amber-300 dark:border-amber-900/50 text-amber-900 dark:text-amber-300"
            >
              <Search size={14} />
              <span>ดึงข้อมูลจากรายการบริจาคจริง (Select Donation)</span>
            </Button>
          </div>

          {/* Form Fields Card */}
          <div className="bg-admin-surface border border-admin-border p-4 space-y-4 rounded-none">
            <div className="flex items-center justify-between border-b border-admin-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-foreground">
                ปรับแต่งข้อมูลในเอกสาร (Document Fields)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRecipientName("ผู้มีจิตศรัทธา");
                  setRecipientAddress("");
                  setAmount(100);
                  setPurpose("บำรุงวัด");
                  setCustomBlessingTh("");
                  setCustomBlessingDe("");
                }}
                className="text-[11px] text-admin-muted hover:text-admin-focus flex items-center gap-1"
              >
                <RefreshCw size={11} />
                <span>ล้างค่า</span>
              </button>
            </div>

            {/* Language Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-admin-foreground flex items-center gap-1.5">
                <Languages size={13} className="text-admin-muted" />
                <span>ภาษาของเอกสาร</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "bilingual", label: "ไทย-เยอรมัน" },
                  { id: "th", label: "ไทยล้วน" },
                  { id: "de", label: "Deutsch" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguageMode(item.id as LanguageMode)}
                    className={cn(
                      "py-1.5 px-2 text-xs font-medium border text-center transition-colors",
                      languageMode === item.id
                        ? "border-admin-focus bg-admin-focus/10 text-admin-focus font-bold"
                        : "border-admin-control-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Name */}
            <div>
              <label className="text-xs font-medium text-admin-foreground block mb-1">
                {selectedTemplate === "ordination_certificate"
                  ? "ชื่อผู้รับมอบ / ผู้เข้าบรรพชา (Ordained Name)"
                  : "ชื่อผู้รับเอกสาร / ผู้บริจาค (Recipient Name)"}
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
              />
            </div>

            {/* Pali / Monastic Name (For Ordination Template) */}
            {selectedTemplate === "ordination_certificate" && (
              <>
                <div>
                  <label className="text-xs font-medium text-admin-foreground block mb-1">
                    ฉายาทางธรรม / บาลี (Pali Dharma Name)
                  </label>
                  <input
                    type="text"
                    value={paliDharmaName}
                    onChange={(e) => setPaliDharmaName(e.target.value)}
                    placeholder="เช่น ธมฺมธโร"
                    className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-admin-foreground block mb-1">
                    พระอุปัชฌาย์ / พระอาจารย์ผู้สอน (Preceptor / Teacher)
                  </label>
                  <input
                    type="text"
                    value={preceptorName}
                    onChange={(e) => setPreceptorName(e.target.value)}
                    className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                  />
                </div>
              </>
            )}

            {/* Recipient Address */}
            <div>
              <label className="text-xs font-medium text-admin-foreground block mb-1">
                ที่อยู่ (Address)
              </label>
              <textarea
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                rows={2}
                placeholder="เช่น 123 Musterstraße, 60311 Frankfurt"
                className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
              />
            </div>

            {/* Annual Tax Year */}
            {selectedTemplate === "annual_tax_certificate" && (
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  ปีภาษีที่รับรอง (Tax Assessment Year)
                </label>
                <input
                  type="text"
                  value={taxYear}
                  onChange={(e) => setTaxYear(e.target.value)}
                  className="w-full text-xs p-2 font-mono border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                />
              </div>
            )}

            {/* Amount & Currency (For Donation & Tax Templates) */}
            {(selectedTemplate === "donation_certificate" || selectedTemplate === "annual_tax_certificate") && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-admin-foreground block mb-1">
                      จำนวนเงิน (Amount)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 font-mono font-bold border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-admin-foreground block mb-1">
                      สกุลเงิน
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="THB">THB (฿)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-admin-foreground block mb-1">
                    จำนวนเงินตัวอักษร (Amount in Words)
                  </label>
                  <input
                    type="text"
                    value={amountInWords}
                    onChange={(e) => setAmountInWords(e.target.value)}
                    placeholder="เช่น ห้าร้อยยูโรถ้วน / Fünfhundert Euro"
                    className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-admin-foreground block mb-1">
                    ช่องทางชำระเงิน (Payment Method)
                  </label>
                  <input
                    type="text"
                    value={donationMethod}
                    onChange={(e) => setDonationMethod(e.target.value)}
                    placeholder="เช่น โอนเงินผ่านธนาคาร, เงินสด, PayPal"
                    className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                  />
                </div>
              </>
            )}

            {/* Date & Document Reference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  วันที่ในเอกสาร
                </label>
                <input
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  เลขที่เอกสาร (Ref No.)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full text-xs p-2 font-mono border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-xs font-medium text-admin-foreground block mb-1">
                {selectedTemplate === "ordination_certificate"
                  ? "หลักสูตร / กิจกรรมที่ผ่านการอบรม (Course / Activity)"
                  : selectedTemplate === "appreciation_letter"
                  ? "เนื่องในวาระ / คุณงามความดี (Occasion / Commendation)"
                  : "วัตถุประสงค์ (Purpose)"}
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
              />
            </div>

            {/* Custom Blessings Override */}
            <div>
              <label className="text-xs font-medium text-admin-foreground block mb-1">
                คำอนุโมทนาบุญเฉพาะฉบับ (ภาษาไทย)
              </label>
              <textarea
                value={customBlessingTh}
                onChange={(e) => setCustomBlessingTh(e.target.value)}
                rows={2}
                placeholder={settingsMap.certificate_blessing_th || "ใช้ค่าเริ่มต้นจากระบบ"}
                className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-admin-foreground block mb-1">
                คำอนุโมทนาบุญเฉพาะฉบับ (Deutsch)
              </label>
              <textarea
                value={customBlessingDe}
                onChange={(e) => setCustomBlessingDe(e.target.value)}
                rows={2}
                placeholder={settingsMap.certificate_blessing_de || "Standardtext verwenden"}
                className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
              />
            </div>
          </div>

          {/* Reusable Signature Manager Component */}
          <SignatureManager
            signatureMode={signatureMode}
            onModeChange={setSignatureMode}
            liveSignature={liveSignature}
            onLiveSignatureChange={setLiveSignature}
            savedSignatureUrl={savedSignatureUrl}
            defaultSignatoryName={signatoryName}
            selectedPresetId={selectedPresetId}
            onSelectPresetId={setSelectedPresetId}
            presets={signaturePresets}
            onSaveToPresets={(name, url) => handleSaveToPresets(name, url, signatoryName, signatoryTitle)}
            onDeletePreset={handleDeletePreset}
            onSaveAsWatDefault={handleSaveAsWatDefault}
            canSaveWatDefault={canManageSettings}
            isSavingWatDefault={isSavingSettings}
            onOpenSettings={openSettingsDrawer}
          />
        </div>

        {/* RIGHT COLUMN: LIVE A4 PREVIEW (Printable Container) */}
        <div className="lg:col-span-8 bg-zinc-200 dark:bg-zinc-900 p-4 sm:p-8 flex flex-col items-center justify-start overflow-y-auto rounded-none border border-admin-border print:p-0 print:border-none print:bg-white print:block">
          <div className="print:hidden w-full max-w-[210mm] flex items-center justify-between mb-3 text-xs text-admin-muted">
            <span className="flex items-center gap-1 font-semibold text-admin-foreground">
              <Eye size={14} className="text-admin-action" />
              <span>ตัวอย่างเอกสารจริงขนาด A4 (Live A4 Preview)</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500">พร้อมดาวน์โหลดและพิมพ์</span>
              <button
                type="button"
                onClick={openSettingsDrawer}
                className="text-admin-action hover:underline flex items-center gap-1 font-medium"
              >
                <Settings size={12} />
                <span>แก้ไขหัวกระดาษวัด</span>
              </button>
            </div>
          </div>

          {/* PRINTABLE A4 SHEET REF */}
          <div
            ref={printSheetRef}
            id="printable-certificate-sheet"
            className="printable-certificate-sheet bg-white text-zinc-950 w-full max-w-[210mm] min-h-[297mm] p-10 sm:p-14 shadow-2xl relative flex flex-col justify-between border border-zinc-300 print:shadow-none print:border-none print:p-8 print:w-full print:min-h-0"
            style={{ fontFamily: "'Sarabun', 'Inter', -apple-system, sans-serif" }}
          >
            {/* Outer Double Frame */}
            <div className="absolute inset-4 border-2 border-amber-950/80 pointer-events-none" />
            <div className="absolute inset-5 border border-amber-800/40 pointer-events-none" />

            {/* Background Watermark Seal */}
            {sealUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sealUrl} crossOrigin="anonymous" alt="" className="w-96 h-96 object-contain" />
              </div>
            )}

            {/* TOP SECTION: HEADER & TITLES */}
            <div className="relative z-10 space-y-6">
              {/* Header: Temple Crest & Names */}
              <div className="text-center space-y-2 border-b border-amber-950/30 pb-5">
                {sealUrl && (
                  <div className="flex justify-center mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sealUrl} crossOrigin="anonymous" alt="Wat Seal" className="w-16 h-16 object-contain" />
                  </div>
                )}
                {(languageMode === "bilingual" || languageMode === "th") && (
                  <h1 className="text-2xl font-bold tracking-wide text-amber-950 font-serif">
                    {orgNameTh}
                  </h1>
                )}
                {(languageMode === "bilingual" || languageMode === "de") && (
                  <h2 className="text-sm font-semibold tracking-wider text-zinc-700 uppercase">
                    {orgNameDe}
                  </h2>
                )}
                <p className="text-xs text-zinc-500">{orgSubtitle}</p>
                <p className="text-[11px] text-zinc-400">
                  {addressLine} | {taxNumber}
                </p>
              </div>

              {/* Title based on selected template */}
              <div className="text-center space-y-1 py-1">
                <div className="inline-block border-y-2 border-amber-900/70 py-1.5 px-8">
                  <h3 className="text-xl font-bold uppercase tracking-widest text-amber-950">
                    {selectedTemplate === "donation_certificate" && (
                      languageMode === "th" ? "ใบอนุโมทนาบัตร" : languageMode === "de" ? "SPENDENBESCHEINIGUNG" : "ใบอนุโมทนาบัตร / SPENDENBESCHEINIGUNG"
                    )}
                    {selectedTemplate === "annual_tax_certificate" && (
                      languageMode === "th" ? `หนังสือรับรองเงินบริจาคประจำปี ${taxYear}` : languageMode === "de" ? `JAHRESZUWENDUNGSBESTÄTIGUNG ${taxYear}` : `หนังสือรับรองเงินบริจาคประจำปี ${taxYear} / JAHRESBESTÄTIGUNG`
                    )}
                    {selectedTemplate === "ordination_certificate" && (
                      languageMode === "th" ? "หนังสือรับรองการบรรพชาและปฏิบัติธรรม" : languageMode === "de" ? "ORDINATIONS- & MEDITATIONSBESCHEINIGUNG" : "หนังสือรับรองการบรรพชา / ORDINATIONSURKUNDE"
                    )}
                    {selectedTemplate === "appreciation_letter" && (
                      languageMode === "th" ? "หนังสืออนุโมทนาเกียรติคุณ" : languageMode === "de" ? "EHRENURKUNDE & DANKSCHREIBEN" : "หนังสืออนุโมทนาเกียรติคุณ / EHRENURKUNDE"
                    )}
                  </h3>
                </div>

                <div className="flex justify-between items-center text-xs text-zinc-500 pt-2 px-2">
                  <span>
                    เลขที่ / Beleg-Nr.: <strong className="text-zinc-900 font-mono">{referenceNumber}</strong>
                  </span>
                  <span>
                    {languageMode === "th" && `วันที่: ${formattedDateTh}`}
                    {languageMode === "de" && `Datum: ${formattedDateDe}`}
                    {languageMode === "bilingual" && `วันที่ / Datum: ${formattedDateDe} (${formattedDateTh})`}
                  </span>
                </div>
              </div>

              {/* Recipient Information Statement */}
              <div className="border border-zinc-300 p-4 bg-amber-50/20 text-xs space-y-3">
                <div>
                  <span className="text-zinc-500 block text-[11px]">
                    {selectedTemplate === "ordination_certificate"
                      ? "ขอมอบหนังสือรับรองฉบับนี้ให้แก่ (This certificate is awarded to):"
                      : languageMode === "de"
                      ? "Zuwendender / Spender (Issued to):"
                      : "ขอมอบเอกสารฉบับนี้เพื่อแสดงว่า (Received with gratitude from):"}
                  </span>
                  <p className="text-base font-bold text-amber-950 mt-0.5">
                    {recipientName || "ผู้มีจิตศรัทธา"}
                  </p>
                  {selectedTemplate === "ordination_certificate" && (
                    <div className="mt-1 flex items-center gap-4 text-xs font-semibold text-zinc-700">
                      <span>ฉายาทางธรรม: <strong className="text-amber-950 font-serif">{paliDharmaName}</strong></span>
                      <span>พระอุปัชฌาย์: {preceptorName}</span>
                    </div>
                  )}
                  {recipientAddress ? (
                    <p className="text-zinc-600 text-xs mt-1 whitespace-pre-line">{recipientAddress}</p>
                  ) : (
                    <p className="text-zinc-400 italic text-[11px] mt-0.5">ไม่ระบุที่อยู่</p>
                  )}
                </div>
              </div>

              {/* Amount Box (If Donation Certificate or Annual Tax) */}
              {(selectedTemplate === "donation_certificate" || selectedTemplate === "annual_tax_certificate") && (
                <div className="border-2 border-amber-950 p-4 bg-zinc-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-600 block">
                      {languageMode === "de"
                        ? "Betrag der Zuwendung (Donation Amount):"
                        : "ได้บริจาคทรัพย์เป็นจำนวนเงิน (Amount):"}
                    </span>
                    <span className="text-2xl font-bold font-mono text-amber-950">
                      {currency === "EUR" ? "€" : currency} {formattedAmount} {currency}
                    </span>
                    {amountInWords && (
                      <span className="block text-[11px] text-zinc-600 italic mt-0.5">
                        ({amountInWords})
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs text-zinc-700">
                    <span className="text-zinc-500 block text-[11px]">วัตถุประสงค์ / Zweck:</span>
                    <strong className="text-sm">{purpose}</strong>
                    <span className="block text-[11px] text-zinc-500 mt-0.5">
                      ผ่าน: {donationMethod}
                    </span>
                  </div>
                </div>
              )}

              {/* Purpose Box for Ordination / Appreciation */}
              {(selectedTemplate === "ordination_certificate" || selectedTemplate === "appreciation_letter") && (
                <div className="border-2 border-amber-950 p-4 bg-zinc-50 text-xs space-y-1">
                  <span className="text-zinc-500 block text-[11px]">เนื่องในวาระ / ด้วยความอุตสาหะ:</span>
                  <p className="text-sm font-bold text-amber-950">{purpose}</p>
                </div>
              )}

              {/* Blessing & Words of Appreciation */}
              <div className="border-l-4 border-amber-800/80 pl-4 py-2 text-xs text-zinc-700 space-y-1.5 leading-relaxed bg-amber-50/10">
                {(languageMode === "bilingual" || languageMode === "th") && (
                  <p className="font-serif italic text-zinc-800">
                    &ldquo;{blessingTh}&rdquo;
                  </p>
                )}
                {(languageMode === "bilingual" || languageMode === "de") && (
                  <p className="text-[11px] text-zinc-600 italic">
                    &ldquo;{blessingDe}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* BOTTOM SECTION: TAX STATUTE & SIGNATURES */}
            <div className="relative z-10 space-y-6 pt-6 mt-6 border-t border-zinc-200">
              {/* Statutory Tax Exemption Declaration for German Tax Law */}
              <div className="text-[10px] text-zinc-500 space-y-1 leading-relaxed border-b border-zinc-200 pb-4">
                <p>
                  Wir sind wegen Förderung religiöser Zwecke nach dem Freistellungsbescheid des Finanzamtes als gemeinnützigen Zwecken dienend anerkannt und nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer befreit.
                </p>
                <p>
                  Es wird bestätigt, dass die Zuwendung nur zur Förderung steuerbegünstigter religiöser und gemeinnütziger Zwecke verwendet wird (§ 10b EStG).
                </p>
              </div>

              {/* Signatures & Seal Block */}
              <div className="grid grid-cols-2 gap-8 items-end pt-2">
                <div className="text-xs text-zinc-600">
                  <p className="font-semibold text-zinc-800">สถานที่และวันที่ (Place, Date):</p>
                  <p className="text-zinc-600 mt-1">Frankfurt am Main, {formattedDateDe}</p>
                  <div className="mt-6">
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Document Ref: {referenceNumber}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Wat Loung Por Sai Administration
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="relative inline-block w-48 text-center">
                    {/* Signature Image / Canvas / Blank Line */}
                    <div className="h-16 flex items-center justify-center relative">
                      {activeSignatureUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={activeSignatureUrl}
                          crossOrigin="anonymous"
                          alt="Signature"
                          className="max-h-14 max-w-full object-contain"
                        />
                      )}
                    </div>

                    <div className="border-b border-zinc-800 w-full mb-1.5" />
                    <p className="text-xs font-bold text-zinc-900">{signatoryName}</p>
                    <p className="text-[11px] text-zinc-500">{signatoryTitle}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">ผู้มีอำนาจลงนาม / Authorized Signatory</p>
                  </div>

                  {signatureMode !== "none" && (
                    <p className="text-[9px] text-zinc-400 italic pt-1 text-right">
                      * Hinweis: Dieses Dokument wurde maschinell erstellt und ist ohne handschriftliche Unterschrift rechtsgültig (§ 10b EStG).
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* IN-PAGE TEMPLATE & HEADER SETTINGS DRAWER (Hidden in Print) */}
      <Drawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        title="ตั้งค่าหัวเอกสาร ตราประทับ และลายเซ็นวัด (Temple Header & Signature Settings)"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSettingsDrawerOpen(false)}
              disabled={isSavingSettings}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="flex items-center gap-1.5"
            >
              {isSavingSettings ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>{isSavingSettings ? "กำลังบันทึก..." : "บันทึกการตั้งค่าส่วนกลาง"}</span>
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          <p className="text-xs text-admin-muted leading-relaxed">
            ข้อมูลที่ตั้งค่าในส่วนนี้จะถูกใช้เป็นหัวเอกสารทางการ คำอวยพร ตราประทับ และลายเซ็นของวัดในทุกแบบฟอร์มเอกสารโดยอัตโนมัติ
          </p>

          {/* Section 1: Organization Names */}
          <div className="border border-admin-border bg-admin-surface p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-2">
              1. ข้อมูลชื่อวัดและนิติบุคคล (Organization Names)
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  ชื่อวัด (ภาษาไทย)
                </label>
                <input
                  type="text"
                  value={drawerOrgNameTh}
                  onChange={(e) => setDrawerOrgNameTh(e.target.value)}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  ชื่อสมาคม/องค์กรทางการ (Deutsch / English)
                </label>
                <input
                  type="text"
                  value={drawerOrgNameDe}
                  onChange={(e) => setDrawerOrgNameDe(e.target.value)}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  คำอธิบายนิติบุคคล / ประเภทสมาคม (Subtitle)
                </label>
                <input
                  type="text"
                  value={drawerOrgSubtitle}
                  onChange={(e) => setDrawerOrgSubtitle(e.target.value)}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address & Tax Registration */}
          <div className="border border-admin-border bg-admin-surface p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-2">
              2. ที่อยู่และเลขทะเบียนภาษี (Address &amp; Tax Number)
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  ที่อยู่วัดเต็ม (Address)
                </label>
                <input
                  type="text"
                  value={drawerAddress}
                  onChange={(e) => setDrawerAddress(e.target.value)}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  เลขทะเบียนสมาคม / เลขประจำตัวผู้เสียภาษี (Steuernummer / VR)
                </label>
                <input
                  type="text"
                  value={drawerTaxNumber}
                  onChange={(e) => setDrawerTaxNumber(e.target.value)}
                  className="w-full text-xs p-2 font-mono border border-admin-control-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Standard Blessings */}
          <div className="border border-admin-border bg-admin-surface p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-2">
              3. คำอนุโมทนาบุญมาตรฐาน (Standard Blessings)
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  คำอนุโมทนาบุญ (ภาษาไทย)
                </label>
                <textarea
                  value={drawerBlessingTh}
                  onChange={(e) => setDrawerBlessingTh(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  คำอวยพรและขอบคุณ (Deutsch)
                </label>
                <textarea
                  value={drawerBlessingDe}
                  onChange={(e) => setDrawerBlessingDe(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Signatory & Assets */}
          <div className="border border-admin-border bg-admin-surface p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-2">
              4. ผู้มีอำนาจลงนามและรูปภาพตราประทับ (Signatory &amp; Images)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  ชื่อผู้ลงนาม
                </label>
                <input
                  type="text"
                  value={drawerSignatoryName}
                  onChange={(e) => setDrawerSignatoryName(e.target.value)}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  ตำแหน่งผู้ลงนาม
                </label>
                <input
                  type="text"
                  value={drawerSignatoryTitle}
                  onChange={(e) => setDrawerSignatoryTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground focus:outline-admin-focus"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <ImageUpload
                  label="รูปตราประทับวัด (Official Temple Seal)"
                  value={drawerSealUrl}
                  onChange={(val) => setDrawerSealUrl(typeof val === "string" ? val : "")}
                />
              </div>
              <div>
                <ImageUpload
                  label="รูปลายเซ็นเจ้าอาวาส (Default Signature Image)"
                  value={drawerSignatureUrl}
                  onChange={(val) => setDrawerSignatureUrl(typeof val === "string" ? val : "")}
                />
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* DONATION RECORD PICKER MODAL (Hidden in Print) */}
      {isDonationPickerOpen && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 text-admin-foreground w-full max-w-2xl max-h-[85vh] flex flex-col border border-admin-border shadow-2xl rounded-none">
            <div className="p-4 border-b border-admin-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-admin-action" />
                <h3 className="text-sm font-bold">เลือกรายการบริจาคที่ยืนยันแล้ว (Select Confirmed Donation)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDonationPickerOpen(false)}
                className="p-1 hover:bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 border-b border-admin-border bg-admin-surface-muted/30">
              <input
                type="text"
                placeholder="ค้นหาตามชื่อผู้บริจาค, เลขที่ใบเสร็จ หรือยอดเงิน..."
                value={donationSearchQuery}
                onChange={(e) => setDonationSearchQuery(e.target.value)}
                className="w-full text-xs p-2.5 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
              />
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-admin-border">
              {isDonationsLoading ? (
                <div className="py-8 text-center text-xs text-admin-muted">กำลังโหลดรายการบริจาค...</div>
              ) : filteredDonations.length === 0 ? (
                <div className="py-8 text-center text-xs text-admin-muted">ไม่พบรายการบริจาคที่ค้นหา</div>
              ) : (
                filteredDonations.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between hover:bg-admin-surface-muted/50 px-2 transition-colors cursor-pointer"
                    onClick={() => handleSelectDonation(item)}
                  >
                    <div>
                      <div className="font-bold text-xs text-admin-foreground">
                        {item.donor_name || (item.is_anonymous ? "Anonymous Donor" : "ผู้บริจาค")}
                      </div>
                      <div className="text-[11px] text-admin-muted flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{item.receipt_number || `#${item.id}`}</span>
                        <span>•</span>
                        <span>{item.donation_date ? new Date(item.donation_date).toLocaleDateString("th-TH") : "-"}</span>
                        <span>•</span>
                        <span>{item.category?.name?.["th"] || "ทั่วไป"}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-admin-success block">
                        € {Number(item.amount || 0).toFixed(2)} {item.currency || "EUR"}
                      </span>
                      <Button size="sm" variant="outline" className="text-[11px] h-7 px-2.5 mt-1">
                        เลือกรายการนี้
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
