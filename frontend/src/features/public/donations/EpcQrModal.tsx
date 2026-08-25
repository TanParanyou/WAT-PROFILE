"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { QrCode } from "lucide-react";
import QRCode from "qrcode";
import { SiteModal } from "@/components/public/modal";
import { CopyButton } from "@/components/common/CopyButton";
import { generateEpcQrPayload, cleanIban, cleanBic } from "./epc-qr";

interface EpcQrModalProps {
  open: boolean;
  onClose: () => void;
  bankName?: string;
  accountName?: string;
  iban?: string;
  bic?: string;
}

const PRESET_AMOUNTS: readonly number[] = [10, 25, 50, 100];

export function EpcQrModal({
  open,
  onClose,
  bankName,
  accountName,
  iban = "",
  bic,
}: EpcQrModalProps) {
  const t = useTranslations("EpcQrModal");
  const [amount, setAmount] = useState<number | undefined>(25);
  const [customAmountStr, setCustomAmountStr] = useState<string>("25");
  const [purpose, setPurpose] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const amountInputId = useId();
  const purposeInputId = useId();

  const recipientName = accountName || "Wat Loung Por Sai e.V.";
  const formattedIban = useMemo(() => cleanIban(iban), [iban]);

  const qrPayload = useMemo(() => {
    if (!formattedIban) return "";
    return generateEpcQrPayload({
      bic,
      recipientName,
      iban: formattedIban,
      amount,
      remittanceText: purpose || undefined,
    });
  }, [bic, recipientName, formattedIban, amount, purpose]);

  useEffect(() => {
    let isMounted = true;
    if (!qrPayload) {
      return;
    }

    QRCode.toDataURL(qrPayload, {
      width: 256,
      margin: 2,
      color: {
        dark: "#333333",
        light: "#FFFEF2",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(() => {
        if (isMounted) setQrDataUrl(null);
      });

    return () => {
      isMounted = false;
    };
  }, [qrPayload]);

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmountStr(val.toString());
  };

  const handleCustomAmountChange = (valStr: string) => {
    setCustomAmountStr(valStr);
    const parsed = parseFloat(valStr.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    } else if (valStr.trim() === "") {
      setAmount(undefined);
    }
  };

  return (
    <SiteModal
      open={open}
      onClose={onClose}
      title={t("title")}
      description={t("subtitle")}
      eyebrow={t("eyebrow")}
      closeLabel={t("close")}
      size="md"
    >
      <div className="space-y-6">
        {/* Preset & Custom Amount Selector */}
        <div>
          <label htmlFor={amountInputId} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-site-accent">
            {t("amountLabel")}
          </label>
          <div className="mb-3 grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((val) => {
              const isSelected = amount === val && customAmountStr === val.toString();
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelectPreset(val)}
                  className={`min-h-11 border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus ${
                    isSelected
                      ? "border-site-border bg-site-action text-site-on-action"
                      : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
                  }`}
                >
                  €{val}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-site-muted">
              €
            </span>
            <input
              id={amountInputId}
              type="text"
              inputMode="decimal"
              value={customAmountStr}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder={t("amountPlaceholder")}
              className="box-border h-11 w-full border border-site-border bg-site-canvas pl-8 pr-3 text-sm text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
            />
          </div>
        </div>

        {/* Optional Purpose / Note */}
        <div>
          <label htmlFor={purposeInputId} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-site-accent">
            {t("purposeLabel")}
          </label>
          <input
            id={purposeInputId}
            type="text"
            maxLength={70}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={t("purposePlaceholder")}
            className="box-border h-11 w-full border border-site-border bg-site-canvas px-3 text-sm text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
          />
        </div>

        {/* QR Code Display Card - Explicit light canvas background ensures high optical contrast for mobile banking scanner cameras */}
        <div className="flex flex-col items-center border border-site-border bg-site-surface p-6 text-center">
          {qrDataUrl ? (
            <div className="border border-site-border bg-[#FFFEF2] p-3 shadow-sm">
              <img
                src={qrDataUrl}
                alt={t("qrAlt")}
                width={220}
                height={220}
                className="size-[220px] object-contain"
              />
            </div>
          ) : (
            <div className="flex size-[220px] items-center justify-center border border-site-border bg-[#FFFEF2] text-site-muted">
              <QrCode size={48} className="animate-pulse" />
            </div>
          )}

          <p className="mt-4 max-w-xs text-xs leading-relaxed text-site-body">
            {t("scanInstructions")}
          </p>
        </div>

        {/* Bank Details with Copy Controls */}
        <div className="space-y-3 border border-site-border bg-site-canvas p-4 text-xs">
          {bankName ? (
            <div className="flex items-center justify-between border-b border-site-border/40 pb-2">
              <span className="text-site-muted">{t("bankLabel")}</span>
              <span className="font-semibold text-site-foreground">{bankName}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-b border-site-border/40 pb-2">
            <span className="text-site-muted">{t("recipientLabel")}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-site-foreground">{recipientName}</span>
              <CopyButton
                text={recipientName}
                label={t("copyRecipient")}
                copiedLabel={t("copied")}
                variant="icon"
                size="sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-site-border/40 pb-2">
            <span className="text-site-muted">{t("ibanLabel")}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-site-foreground">{formattedIban}</span>
              <CopyButton
                text={formattedIban}
                label={t("copyIban")}
                copiedLabel={t("copied")}
                variant="icon"
                size="sm"
              />
            </div>
          </div>

          {bic ? (
            <div className="flex items-center justify-between">
              <span className="text-site-muted">{t("bicLabel")}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-site-foreground">{cleanBic(bic)}</span>
                <CopyButton
                  text={cleanBic(bic)}
                  label={t("copyBic")}
                  copiedLabel={t("copied")}
                  variant="icon"
                  size="sm"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </SiteModal>
  );
}
