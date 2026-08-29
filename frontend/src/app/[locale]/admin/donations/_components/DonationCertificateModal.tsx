"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Printer,
  Download,
  Loader2,
  X,
  Languages,
  PenLine,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";
import type { Donation } from "@/types/entities";
import { SignaturePad } from "./SignaturePad";
import { cn } from "@/utils/cn";

interface DonationCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: Donation | null;
  settings?: Record<string, string>;
}

type LanguageMode = "bilingual" | "th" | "de";
type SignatureMode = "saved" | "pad" | "none";

export function DonationCertificateModal({
  isOpen,
  onClose,
  donation,
  settings = {},
}: DonationCertificateModalProps) {
  if (!isOpen || !donation) return null;

  return (
    <DonationCertificateModalContent
      key={donation.id}
      donation={donation}
      onClose={onClose}
      settings={settings}
    />
  );
}

function DonationCertificateModalContent({
  donation,
  onClose,
  settings,
}: {
  donation: Donation;
  onClose: () => void;
  settings: Record<string, string>;
}) {
  // Form State initialized directly from props
  const [donorName, setDonorName] = useState(
    () => donation.donor_name || (donation.is_anonymous ? "Anonymous Donor / ผู้มีจิตศรัทธา" : "")
  );
  const [donorAddress, setDonorAddress] = useState(() => donation.donor_address || "");
  const [amount, setAmount] = useState<number>(() => donation.amount || 0);
  const [currency, setCurrency] = useState(() => donation.currency || "EUR");
  const [donationDate, setDonationDate] = useState(() =>
    donation.donation_date
      ? new Date(donation.donation_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [donationMethod, setDonationMethod] = useState(() => donation.donation_method || "BANK_TRANSFER");
  const [categoryName, setCategoryName] = useState(() => {
    const catTh = donation.category?.name?.["th"];
    const catDe = donation.category?.name?.["de"];
    const catEn = donation.category?.name?.["en"];
    return catTh || catDe || catEn || "บำรุงวัดและกิจกรรมพระพุทธศาสนา / Spende";
  });
  const [receiptNumber] = useState(
    () => donation.receipt_number || `REC-${donation.id || "001"}`
  );

  // Options State
  const [languageMode, setLanguageMode] = useState<LanguageMode>("bilingual");
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("saved");
  const [liveSignature, setLiveSignature] = useState<string | null>(null);

  // Global settings fallback
  const orgNameTh = settings.certificate_org_name_th || "วัดหลวงพ่อสาย เยอรมนี";
  const orgNameDe = settings.certificate_org_name_de || "WAT LOUNG POR SAI e.V.";
  const orgSubtitle = settings.certificate_org_subtitle || "Theravada Buddhist Temple & Community Association e.V.";
  const taxNumber = settings.certificate_tax_number || "VR 12345 / FA Frankfurt";
  const addressLine = settings.certificate_address || "Darmstädter Landstraße, Frankfurt am Main, Germany";
  const blessingTh = settings.certificate_blessing_th || "ขออาราธนาคุณพระศรีรัตนตรัย จงดลบันดาลให้ท่านและครอบครัวประสบแต่ความสุข ความเจริญ ด้วยจตุรพิธพรชัยทุกประการเทอญ";
  const blessingDe = settings.certificate_blessing_de || "Möge diese heilsame Tat Ihnen und Ihrer Familie dauerhaften Frieden, Freude und Wohlergehen bringen.";
  const signatoryName = settings.certificate_signatory_name || "พระครูวิมลธรรมวิเทศ";
  const signatoryTitle = settings.certificate_signatory_title || "Vorstand / เจ้าอาวาส";
  const sealUrl = settings.certificate_seal_url || "";
  const savedSignatureUrl = settings.certificate_signature_url || "";

  const formattedAmount = useMemo(() => {
    return amount.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [amount]);

  const formattedDateDe = useMemo(() => {
    if (!donationDate) return new Date().toLocaleDateString("de-DE");
    return new Date(donationDate).toLocaleDateString("de-DE");
  }, [donationDate]);

  const formattedDateTh = useMemo(() => {
    if (!donationDate) return "";
    const d = new Date(donationDate);
    const thYear = d.getFullYear() + 543;
    const monthsTh = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${d.getDate()} ${monthsTh[d.getMonth()]} พ.ศ. ${thYear}`;
  }, [donationDate]);

  const printSheetRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
        pixelRatio: 2,
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
      const safeName = (donorName || "donor").replace(/[^a-zA-Z0-9ก-๙_-]/g, "_");
      pdf.save(`${receiptNumber || "receipt"}_${safeName}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-zinc-950 text-admin-foreground w-full max-w-7xl max-h-[96vh] rounded-none shadow-2xl flex flex-col border border-admin-border overflow-hidden print:max-h-none print:h-auto print:border-none print:shadow-none print:w-full">
        {/* ========================================================================= */}
        {/* MODAL HEADER CONTROLS (Hidden during print)                               */}
        {/* ========================================================================= */}
        <div className="print:hidden p-4 border-b border-admin-border bg-admin-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <FileCheck2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-admin-foreground">
                ออกและปรับแต่งใบอนุโมทนาบัตร (Donation Certificate &amp; Receipt)
              </h2>
              <p className="text-xs text-admin-muted">
                เลขที่เอกสาร: <span className="font-mono font-bold text-admin-foreground">{receiptNumber}</span> | ผู้บริจาค: {donorName || "-"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="min-h-9 px-3.5 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-colors rounded-none"
            >
              {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{isGeneratingPdf ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-9 px-4 bg-admin-focus hover:bg-admin-focus/90 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors rounded-none shadow-xs"
            >
              <Printer size={15} />
              <span>พิมพ์เอกสาร (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 px-3 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-admin-foreground text-xs font-semibold transition-colors"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SPLIT VIEW: LEFT (FORM EDIT) | RIGHT (LIVE A4 PREVIEW)                    */}
        {/* ========================================================================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-y-auto print:block">
          {/* LEFT FORM PANEL (Hidden during print) */}
          <div className="print:hidden lg:col-span-4 p-5 bg-admin-surface-muted/40 border-r border-admin-border space-y-5 overflow-y-auto max-h-[calc(96vh-4.5rem)]">
            {/* Language Selection */}
            <div className="bg-admin-surface border border-admin-border p-3.5 space-y-2.5 rounded-none">
              <label className="text-xs font-bold uppercase tracking-wider text-admin-foreground flex items-center gap-1.5">
                <Languages size={13} className="text-admin-muted" />
                <span>ภาษาของเอกสาร (Language)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "bilingual", label: "ไทย-เยอรมัน" },
                  { id: "th", label: "ภาษาไทย" },
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

            {/* Editable Details */}
            <div className="bg-admin-surface border border-admin-border p-4 space-y-3 rounded-none">
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-2">
                ข้อมูลผู้บริจาคและรายการ (Editable Details)
              </h3>

              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  ชื่อผู้บริจาค (Donor Name)
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  ที่อยู่ผู้บริจาค (Donor Address)
                </label>
                <textarea
                  value={donorAddress}
                  onChange={(e) => setDonorAddress(e.target.value)}
                  rows={2}
                  placeholder="เช่น 123 Musterstraße, 60311 Frankfurt"
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-admin-foreground block mb-1">
                    ยอดเงินบริจาค
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-admin-foreground block mb-1">
                    วันที่บริจาค
                  </label>
                  <input
                    type="date"
                    value={donationDate}
                    onChange={(e) => setDonationDate(e.target.value)}
                    className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-admin-foreground block mb-1">
                    ช่องทางชำระ
                  </label>
                  <input
                    type="text"
                    value={donationMethod}
                    onChange={(e) => setDonationMethod(e.target.value)}
                    className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-admin-foreground block mb-1">
                  วัตถุประสงค์ (Purpose)
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full text-xs p-2 border border-admin-control-border bg-admin-surface text-admin-foreground rounded-none focus:outline-admin-focus"
                />
              </div>
            </div>

            {/* Signature Mode Controls */}
            <div className="bg-admin-surface border border-admin-border p-4 space-y-3 rounded-none">
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-foreground border-b border-admin-border pb-2 flex items-center justify-between">
                <span>การลงลายมือชื่อ (Signature)</span>
                <PenLine size={13} className="text-admin-muted" />
              </h3>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "saved", label: "รูปลายเซ็น" },
                  { id: "pad", label: "เซ็นสด" },
                  { id: "none", label: "เว้นว่าง" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSignatureMode(s.id as SignatureMode)}
                    className={cn(
                      "py-1.5 px-2 text-xs font-medium border text-center transition-colors",
                      signatureMode === s.id
                        ? "border-admin-focus bg-admin-focus/10 text-admin-focus font-bold"
                        : "border-admin-control-border bg-admin-surface text-admin-foreground hover:bg-admin-surface-muted"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {signatureMode === "saved" && (
                <div className="p-2.5 bg-admin-surface-muted/50 border border-admin-border text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-admin-muted">รูปลายเซ็นจาก Settings:</span>
                    {savedSignatureUrl ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> มีรูปพร้อมใช้
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">ยังไม่มีรูปลายเซ็น</span>
                    )}
                  </div>
                  {savedSignatureUrl && (
                    <div className="h-14 bg-white border border-gray-200 flex items-center justify-center p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={savedSignatureUrl}
                        alt="Saved Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {signatureMode === "pad" && (
                <SignaturePad
                  value={liveSignature}
                  onChange={(url) => setLiveSignature(url)}
                />
              )}

              {signatureMode === "none" && (
                <p className="text-[11px] text-admin-muted italic leading-relaxed">
                  * จะแสดงเส้นประสำหรับให้เจ้าอาวาสหรือไวยาวัจกรลงลายมือชื่อจริงด้วยปากกาหลังพิมพ์เอกสาร
                </p>
              )}
            </div>
          </div>

          {/* RIGHT LIVE A4 PREVIEW SHEET */}
          <div className="lg:col-span-8 p-4 sm:p-8 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-y-auto print:p-0 print:bg-white print:block">
            {/* The Official Printable Certificate (A4 Page Proportion) */}
            <div
              ref={printSheetRef}
              className="printable-certificate-sheet bg-white text-zinc-950 w-full max-w-[210mm] min-h-[297mm] p-10 sm:p-14 shadow-2xl relative flex flex-col justify-between border border-zinc-300 print:shadow-none print:border-none print:p-8 print:w-full print:min-h-0"
              style={{ fontFamily: "'Sarabun', 'Inter', -apple-system, sans-serif" }}
            >
              {/* Outer Decorative Double Border */}
              <div className="absolute inset-4 border-2 border-amber-950/80 pointer-events-none" />
              <div className="absolute inset-5 border border-amber-800/40 pointer-events-none" />

              {/* Watermark / Seal Background */}
              {sealUrl && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sealUrl} crossOrigin="anonymous" alt="" className="w-96 h-96 object-contain" />
                </div>
              )}

              {/* Top Section */}
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

                {/* Certificate Main Title */}
                <div className="text-center space-y-1 py-1">
                  <div className="inline-block border-y-2 border-amber-900/70 py-1.5 px-8">
                    <h3 className="text-xl font-bold uppercase tracking-widest text-amber-950">
                      {languageMode === "th" && "ใบอนุโมทนาบัตร"}
                      {languageMode === "de" && "SPENDENBESCHEINIGUNG"}
                      {languageMode === "bilingual" && "ใบอนุโมทนาบัตร / SPENDENBESCHEINIGUNG"}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-500 pt-2 px-2">
                    <span>
                      เลขที่ / Beleg-Nr.: <strong className="text-zinc-900 font-mono">{receiptNumber}</strong>
                    </span>
                    <span>
                      {languageMode === "th" && `วันที่: ${formattedDateTh}`}
                      {languageMode === "de" && `Datum: ${formattedDateDe}`}
                      {languageMode === "bilingual" && `วันที่ / Datum: ${formattedDateDe} (${formattedDateTh})`}
                    </span>
                  </div>
                </div>

                {/* Donor & Beneficiary Statement */}
                <div className="border border-zinc-300 p-4 bg-amber-50/20 text-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">
                        {languageMode === "de" ? "Zuwendender / Spender (Donor):" : "ขอมอบใบอนุโมทนาบัตรนี้เพื่อแสดงว่า (Received with gratitude from):"}
                      </span>
                      <p className="text-base font-bold text-amber-950 mt-0.5">
                        {donorName || "ผู้มีจิตศรัทธา"}
                      </p>
                      {donorAddress ? (
                        <p className="text-zinc-600 text-xs mt-0.5 whitespace-pre-line">{donorAddress}</p>
                      ) : (
                        <p className="text-zinc-400 italic text-[11px]">ไม่ระบุที่อยู่</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount Highlight Box */}
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
                  </div>
                  <div className="text-right text-xs text-zinc-700">
                    <span className="text-zinc-500 block text-[11px]">วัตถุประสงค์ / Zweck:</span>
                    <strong className="text-sm">{categoryName}</strong>
                    <span className="block text-[11px] text-zinc-500 mt-0.5">
                      ผ่าน: {donationMethod}
                    </span>
                  </div>
                </div>

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

              {/* Bottom Section: Tax Declaration & Signatures */}
              <div className="relative z-10 space-y-6 pt-6 mt-6 border-t border-zinc-200">
                {/* Statutory Tax Exemption Declaration (§ 10b EStG) */}
                <div className="text-[10px] text-zinc-500 space-y-1 leading-relaxed border-b border-zinc-200 pb-4">
                  <p>
                    Wir sind wegen Förderung religiöser Zwecke nach dem Freistellungsbescheid des Finanzamtes als gemeinnützigen Zwecken dienend anerkannt und nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer befreit.
                  </p>
                  <p>
                    Es wird bestätigt, dass die Zuwendung nur zur Förderung steuerbegünstigter religiöser und gemeinnütziger Zwecke verwendet wird.
                  </p>
                </div>

                {/* Signatures & Seal Block */}
                <div className="grid grid-cols-2 gap-8 items-end pt-2">
                  <div className="text-xs text-zinc-600">
                    <p className="font-semibold text-zinc-800">สถานที่และวันที่ (Place, Date):</p>
                    <p className="text-zinc-600 mt-1">Frankfurt am Main, {formattedDateDe}</p>
                    <div className="mt-6">
                      <p className="text-[10px] text-zinc-400 font-mono">
                        Document ID: {receiptNumber}
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
                        {signatureMode === "saved" && savedSignatureUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={savedSignatureUrl}
                            crossOrigin="anonymous"
                            alt="Signature"
                            className="max-h-14 max-w-full object-contain"
                          />
                        )}
                        {signatureMode === "pad" && liveSignature && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={liveSignature}
                            alt="Live Signature"
                            className="max-h-14 max-w-full object-contain"
                          />
                        )}
                      </div>

                      <div className="border-b border-zinc-800 w-full mb-1.5" />
                      <p className="text-xs font-bold text-zinc-900">{signatoryName}</p>
                      <p className="text-[11px] text-zinc-500">{signatoryTitle}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">ผู้มีอำนาจลงนาม / Authorized Signatory</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
