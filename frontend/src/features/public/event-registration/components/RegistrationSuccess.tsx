"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, QrCode, Download, Printer, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import QRCode from "qrcode";
import type { EventRegistrationDetail } from "../types";

export function RegistrationSuccess({ registration }: { registration: EventRegistrationDetail }) {
  const t = useTranslations("EventRegistration");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (registration.confirmation_code) {
      QRCode.toDataURL(registration.confirmation_code, {
        width: 240,
        margin: 2,
        color: {
          dark: "#333333",
          light: "#FFFFFF",
        },
      })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [registration.confirmation_code]);

  return (
    <section className="border border-site-border bg-site-surface p-6 sm:p-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="text-site-accent" size={32} aria-hidden="true" />
        <div>
          <h1 className="font-heading text-2xl font-semibold text-site-foreground">{t("successTitle")}</h1>
          <p className="text-sm text-site-body mt-0.5">{t("successDescription")}</p>
        </div>
      </div>

      {/* QR Code Pass Card */}
      <div className="mt-6 border border-site-border bg-site-canvas p-6 flex flex-col sm:flex-row items-center gap-6">
        {qrDataUrl ? (
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="border border-site-border p-2 bg-white">
              <img
                src={qrDataUrl}
                alt={`QR Code ${registration.confirmation_code}`}
                className="size-40 object-contain"
              />
            </div>
            <a
              href={qrDataUrl}
              download={`attendance_qr_${registration.confirmation_code}.png`}
              className="inline-flex items-center gap-1.5 text-xs text-site-muted hover:text-site-foreground transition-colors"
            >
              <Download size={13} />
              <span>บันทึกรูป QR Code</span>
            </a>
          </div>
        ) : (
          <div className="size-40 border border-site-border bg-site-surface flex items-center justify-center text-site-muted shrink-0">
            <QrCode size={40} />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-3 text-sm">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
            <span>บัตรลงทะเบียน / Attendance Pass</span>
          </div>

          <div>
            <span className="text-xs text-site-muted block">รหัสยืนยันการลงทะเบียน (Confirmation Code)</span>
            <span className="text-xl font-bold font-mono text-site-foreground tracking-wider block">
              {registration.confirmation_code}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-site-border/60">
            <div>
              <span className="text-xs text-site-muted block">จำนวนผู้เข้าร่วม</span>
              <span className="font-semibold text-site-foreground">
                {registration.participant_count} ท่าน
              </span>
            </div>
            <div>
              <span className="text-xs text-site-muted block">ผู้ลงทะเบียน</span>
              <span className="font-semibold text-site-foreground truncate block">
                {registration.contact?.first_name} {registration.contact?.last_name}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-1.5 pt-1 text-xs text-site-muted/90">
            <Lightbulb size={14} className="shrink-0 mt-0.5 text-amber-500" />
            <span>โปรดแสดง QR Code นี้แก่เจ้าหน้าที่โต๊ะลงทะเบียนหน้าศาลาเพื่อความสะดวกรวดเร็วในการเช็คชื่อ</span>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-site-body">{t("manageEmailHint")}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/events/${registration.event.slug}`}
          className="inline-flex min-h-11 items-center border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action hover:bg-site-action-hover transition-colors"
        >
          {t("backToEvent")}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-4 text-sm font-medium text-site-foreground hover:bg-site-surface transition-colors"
        >
          <Printer size={16} />
          <span>พิมพ์ใบคอนเฟิร์ม</span>
        </button>
      </div>
    </section>
  );
}
