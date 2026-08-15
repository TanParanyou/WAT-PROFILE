"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  publicPrivacyService,
  type PublicPrivacyRequestPayload,
} from "@/services/publicPrivacyService";

export interface PrivacyRequestModalProps {
  isOpen: boolean;
  onClose(): void;
  defaultEmail?: string;
  defaultMemberCode?: string;
}

export function PrivacyRequestModal({
  isOpen,
  onClose,
  defaultEmail = "",
  defaultMemberCode = "",
}: PrivacyRequestModalProps) {
  const t = useTranslations("PrivacyRequestModal");

  const [requestType, setRequestType] = useState<"access" | "erasure">("access");
  const [email, setEmail] = useState(defaultEmail);
  const [memberCode, setMemberCode] = useState(defaultMemberCode);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const handleClose = () => {
    setErrorMsg(null);
    setSubmittedRefId(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    const trimmedMemberCode = memberCode.trim();

    if (!trimmedEmail && !trimmedMemberCode) {
      setErrorMsg(t("validationRequired"));
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg(t("validationEmailInvalid"));
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: PublicPrivacyRequestPayload = {
        subject_email: trimmedEmail || undefined,
        subject_member_code: trimmedMemberCode || undefined,
        request_type: requestType,
        notes: notes.trim() || undefined,
        website: website || undefined,
      };

      const result = await publicPrivacyService.submitRequest(payload);
      setSubmittedRefId(result.id);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setErrorMsg(error.response?.data?.error || t("errorSubmit"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="public-theme">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs"
        onClick={handleClose}
      />
      {/* Modal Container */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
      >
        <div
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-site-canvas border border-site-border shadow-2xl overflow-hidden my-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {submittedRefId ? (
          /* Success Screen */
          <div className="p-6 sm:p-8 text-center space-y-4 my-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2
              id="privacy-modal-title"
              className="text-xl font-bold text-site-foreground"
            >
              {t("successTitle")}
            </h2>
            <div className="space-y-2 text-sm text-site-muted max-w-md mx-auto leading-relaxed">
              <p>{t("successDesc")}</p>
              <p className="font-mono text-xs font-semibold bg-site-surface px-3 py-1.5 border border-site-border inline-block text-site-foreground select-all">
                {submittedRefId}
              </p>
              <p className="pt-2 text-xs">{t("successNextStep")}</p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-site-action text-site-on-action font-semibold hover:bg-site-action-hover transition-colors"
              >
                {t("close")}
              </button>
            </div>
          </div>
        ) : (
          /* Request Form with Fixed Header, Scrollable Body, Fixed Action Footer */
          <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
            {/* Fixed Header (Never overlaps with close button) */}
            <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-site-border bg-site-canvas flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-site-action mb-1">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    PDPA / GDPR
                  </span>
                </div>
                <h2
                  id="privacy-modal-title"
                  className="text-lg sm:text-xl font-bold text-site-foreground leading-snug break-words"
                >
                  {t("modalTitle")}
                </h2>
                <p className="text-xs text-site-muted mt-1 leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 p-1.5 text-site-muted hover:text-site-foreground hover:bg-site-surface transition-colors rounded-none"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Error Message Alert */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 text-xs bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="flex-1">{errorMsg}</p>
                </div>
              )}

              {/* Request Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-site-foreground block">
                  {t("typeLabel")} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Access / Export Card */}
                  <label
                    className={`flex flex-col gap-1.5 p-3.5 border cursor-pointer transition-all ${
                      requestType === "access"
                        ? "border-site-action bg-site-action/5 ring-1 ring-site-action"
                        : "border-site-border bg-site-canvas hover:bg-site-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-site-action" />
                        <span className="text-xs font-bold text-site-foreground">
                          {t("accessTitle")}
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="request_type"
                        value="access"
                        checked={requestType === "access"}
                        onChange={() => setRequestType("access")}
                        className="text-site-action focus:ring-site-action"
                      />
                    </div>
                    <p className="text-[11px] text-site-muted leading-relaxed pl-6">
                      {t("accessDesc")}
                    </p>
                  </label>

                  {/* Erasure Card */}
                  <label
                    className={`flex flex-col gap-1.5 p-3.5 border cursor-pointer transition-all ${
                      requestType === "erasure"
                        ? "border-amber-600 bg-amber-50/20 dark:bg-amber-950/20 ring-1 ring-amber-600"
                        : "border-site-border bg-site-canvas hover:bg-site-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-bold text-site-foreground">
                          {t("erasureTitle")}
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="request_type"
                        value="erasure"
                        checked={requestType === "erasure"}
                        onChange={() => setRequestType("erasure")}
                        className="text-amber-600 focus:ring-amber-600"
                      />
                    </div>
                    <p className="text-[11px] text-site-muted leading-relaxed pl-6">
                      {t("erasureDesc")}
                    </p>
                  </label>
                </div>
              </div>

              {/* Requester Identity Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="privacy-email"
                    className="text-xs font-semibold text-site-foreground block mb-1"
                  >
                    {t("emailLabel")}
                  </label>
                  <input
                    id="privacy-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="w-full px-3 py-2 text-sm border border-site-border bg-site-canvas text-site-foreground placeholder:text-site-muted focus:outline-none focus:border-site-action"
                  />
                </div>

                <div>
                  <label
                    htmlFor="privacy-member-code"
                    className="text-xs font-semibold text-site-foreground block mb-1"
                  >
                    {t("memberCodeLabel")}
                  </label>
                  <input
                    id="privacy-member-code"
                    type="text"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    placeholder={t("memberCodePlaceholder")}
                    className="w-full px-3 py-2 text-sm border border-site-border bg-site-canvas text-site-foreground placeholder:text-site-muted focus:outline-none focus:border-site-action font-mono"
                  />
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label
                  htmlFor="privacy-notes"
                  className="text-xs font-semibold text-site-foreground block mb-1"
                >
                  {t("notesLabel")}
                </label>
                <textarea
                  id="privacy-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="w-full px-3 py-2 text-sm border border-site-border bg-site-canvas text-site-foreground placeholder:text-site-muted focus:outline-none focus:border-site-action resize-none"
                />
              </div>

              {/* Honeypot field (hidden from users) */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {/* Security and Accounting Notice */}
              <div className="flex items-start gap-2.5 p-3.5 bg-site-surface border border-site-border text-[11px] text-site-muted leading-relaxed">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <p>{t("legalNotice")}</p>
              </div>
            </div>

            {/* Fixed Action Footer */}
            <div className="shrink-0 p-4 sm:px-6 border-t border-site-border bg-site-canvas flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-site-foreground hover:bg-site-surface border border-site-border transition-colors disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 bg-site-action text-site-on-action text-xs font-semibold hover:bg-site-action-hover transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t("submitting")}</span>
                  </>
                ) : (
                  <span>{t("submit")}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </div>,
  document.body
);
}
