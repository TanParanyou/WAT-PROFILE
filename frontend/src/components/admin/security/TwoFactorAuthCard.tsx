"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
  Download,
  KeyRound,
  RefreshCw,
  X,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import adminSecurityService from "@/services/adminSecurityService";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { OtpInput } from "./OtpInput";
import type { TOTPSetupResponse } from "@/types/security";

export function TwoFactorAuthCard() {
  const t = useTranslations("Admin");
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const is2FAEnabled = Boolean(user?.totp_enabled);

  // Setup Modal states
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [setupData, setSetupData] = useState<TOTPSetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [hasCopiedBackupCodes, setHasCopiedBackupCodes] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupError, setSetupError] = useState("");

  // Disable Modal states
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableError, setDisableError] = useState("");

  // Regenerate Backup Codes Modal states
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [regeneratePassword, setRegeneratePassword] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [regenerateError, setRegenerateError] = useState("");

  // Start 2FA Setup
  const handleStartSetup = async () => {
    setIsSettingUp(true);
    setSetupError("");
    try {
      const data = await adminSecurityService.setup2FA();
      setSetupData(data);
      setSetupStep(1);
      setVerifyCode("");
      setBackupCodes([]);
      setIsSetupOpen(true);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(errorMsg || t("security.setup2FAError"));
    } finally {
      setIsSettingUp(false);
    }
  };

  // Verify Setup
  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || verifyCode.length !== 6) {
      setSetupError(t("security.enter6DigitCode"));
      return;
    }

    setIsVerifying(true);
    setSetupError("");
    try {
      const res = await adminSecurityService.verify2FASetup({
        secret: setupData.secret,
        code: verifyCode.trim(),
      });
      setBackupCodes(res.backup_codes);
      setSetupStep(3);
      await refreshUser();
      toast.success(t("security.enable2FASuccess"));
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setSetupError(errorMsg || t("security.invalid2FACode"));
    } finally {
      setIsVerifying(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword || !disableCode) return;

    setIsDisabling(true);
    setDisableError("");
    try {
      await adminSecurityService.disable2FA({
        password: disablePassword,
        code: disableCode.trim(),
      });
      await refreshUser();
      setIsDisableOpen(false);
      setDisablePassword("");
      setDisableCode("");
      toast.success(t("security.disable2FASuccess"));
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setDisableError(errorMsg || t("security.disable2FAError"));
    } finally {
      setIsDisabling(false);
    }
  };

  // Regenerate Backup Codes
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regeneratePassword) return;

    setIsRegenerating(true);
    setRegenerateError("");
    try {
      const res = await adminSecurityService.regenerateBackupCodes({
        password: regeneratePassword,
      });
      setNewBackupCodes(res.backup_codes);
      setRegeneratePassword("");
      toast.success(t("security.regenerateCodesSuccess"));
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setRegenerateError(errorMsg || t("security.regenerateCodesError"));
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = (text: string, isSecret = false) => {
    navigator.clipboard.writeText(text);
    if (isSecret) {
      setHasCopiedSecret(true);
      setTimeout(() => setHasCopiedSecret(false), 2000);
    } else {
      setHasCopiedBackupCodes(true);
      setTimeout(() => setHasCopiedBackupCodes(false), 2000);
    }
    toast.success(t("common.copiedToClipboard"));
  };

  const downloadBackupCodes = (codes: string[]) => {
    const content = `WAT LOUNG POR SAI - 2FA BACKUP RECOVERY CODES\nGenerated: ${new Date().toISOString()}\nAccount: ${user?.email}\n\n${codes.join("\n")}\n\nKeep these codes safe! Each code can be used once.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wat-admin-backup-codes-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatSecretKey = (secret: string) => {
    return secret.match(/.{1,4}/g)?.join(" ") || secret;
  };

  return (
    <div className="bg-admin-surface border border-admin-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-admin-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-foreground">
            {is2FAEnabled ? (
              <ShieldCheck size={20} className="text-admin-action" />
            ) : (
              <ShieldAlert size={20} className="text-admin-warning" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-admin-foreground">
              {t("security.twoFactorTitle")}
            </h2>
            <p className="text-xs text-admin-muted">
              {t("security.twoFactorSubtitle")}
            </p>
          </div>
        </div>

        <div>
          {is2FAEnabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-admin-action/10 text-admin-action border border-admin-action/20">
              <span className="w-1.5 h-1.5 rounded-full bg-admin-action animate-pulse" />
              {t("security.statusEnabled")}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-admin-surface-muted text-admin-muted border border-admin-border">
              {t("security.statusDisabled")}
            </span>
          )}
        </div>
      </div>

      {/* Description & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-admin-surface-muted border border-admin-border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-admin-foreground">
            {is2FAEnabled
              ? t("security.twoFactorActiveDesc")
              : t("security.twoFactorInactiveDesc")}
          </p>
          <p className="text-xs text-admin-muted">
            {t("security.authenticatorAppSupport")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {is2FAEnabled ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewBackupCodes([]);
                  setRegeneratePassword("");
                  setRegenerateError("");
                  setIsRegenerateOpen(true);
                }}
                icon={<RefreshCw size={14} />}
              >
                {t("security.regenerateCodesBtn")}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  setDisablePassword("");
                  setDisableCode("");
                  setDisableError("");
                  setIsDisableOpen(true);
                }}
              >
                {t("security.disable2FABtn")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSettingUp}
              onClick={handleStartSetup}
              icon={<Smartphone size={16} />}
            >
              {t("security.enable2FABtn")}
            </Button>
          )}
        </div>
      </div>

      {/* Modern 3-Step Setup Modal */}
      {isSetupOpen && setupData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-admin-surface border border-admin-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-surface">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-admin-action/10 border border-admin-action/20 text-admin-action">
                  <Smartphone size={18} />
                </div>
                <h3 className="text-base font-semibold text-admin-foreground">
                  {t("security.setupModalTitle")}
                </h3>
              </div>
              {setupStep !== 3 && (
                <button
                  type="button"
                  onClick={() => setIsSetupOpen(false)}
                  className="p-1 text-admin-muted hover:text-admin-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-3 border-b border-admin-border text-xs text-center font-medium bg-admin-surface-muted">
              <div
                className={`py-2.5 px-2 border-r border-admin-border transition-colors flex items-center justify-center gap-1.5 ${
                  setupStep === 1
                    ? "bg-admin-surface text-admin-action font-semibold border-b-2 border-b-admin-action"
                    : setupStep > 1
                    ? "text-admin-foreground"
                    : "text-admin-muted"
                }`}
              >
                <span className="w-4 h-4 rounded-full border border-current inline-flex items-center justify-center text-[10px]">
                  1
                </span>
                <span className="hidden sm:inline">สแกน QR</span>
              </div>
              <div
                className={`py-2.5 px-2 border-r border-admin-border transition-colors flex items-center justify-center gap-1.5 ${
                  setupStep === 2
                    ? "bg-admin-surface text-admin-action font-semibold border-b-2 border-b-admin-action"
                    : setupStep > 2
                    ? "text-admin-foreground"
                    : "text-admin-muted"
                }`}
              >
                <span className="w-4 h-4 rounded-full border border-current inline-flex items-center justify-center text-[10px]">
                  2
                </span>
                <span className="hidden sm:inline">ยืนยันรหัส</span>
              </div>
              <div
                className={`py-2.5 px-2 transition-colors flex items-center justify-center gap-1.5 ${
                  setupStep === 3
                    ? "bg-admin-surface text-admin-action font-semibold border-b-2 border-b-admin-action"
                    : "text-admin-muted"
                }`}
              >
                <span className="w-4 h-4 rounded-full border border-current inline-flex items-center justify-center text-[10px]">
                  3
                </span>
                <span className="hidden sm:inline">รหัสสำรอง</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Step 1: Scan QR & Secret */}
              {setupStep === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-admin-muted leading-relaxed">
                    {t("security.setupStep1Desc")}
                  </p>

                  <div className="flex flex-col items-center justify-center p-4 bg-admin-surface-muted border border-admin-border">
                    <QRCodeDisplay value={setupData.otpauth_uri} size={200} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-admin-foreground">
                      {t("security.manualSecretLabel")}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2.5 bg-admin-surface-muted border border-admin-border text-xs font-mono select-all text-admin-foreground tracking-wider font-semibold text-center overflow-x-auto">
                        {formatSecretKey(setupData.secret)}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(setupData.secret, true)}
                        icon={hasCopiedSecret ? <Check size={14} /> : <Copy size={14} />}
                      >
                        {hasCopiedSecret ? t("common.copied") : t("common.copy")}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => setSetupStep(2)}
                      icon={<ArrowRight size={16} />}
                    >
                      {t("common.next")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Verify 6-digit Code */}
              {setupStep === 2 && (
                <form onSubmit={handleVerifySetup} className="space-y-5">
                  <p className="text-xs text-admin-muted leading-relaxed text-center">
                    {t("security.setupStep2Desc")}
                  </p>

                  <div className="py-2">
                    <OtpInput
                      value={verifyCode}
                      onChange={(val) => {
                        setVerifyCode(val);
                        setSetupError("");
                      }}
                      error={setupError}
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-admin-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSetupStep(1)}
                      icon={<ArrowLeft size={14} />}
                    >
                      {t("common.back")}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={verifyCode.length !== 6}
                      isLoading={isVerifying}
                      icon={<CheckCircle2 size={16} />}
                    >
                      {t("security.verifyAndActivate")}
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 3: Backup Codes */}
              {setupStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3.5 bg-admin-warning-surface border border-admin-warning/20 text-admin-warning">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed font-medium">
                      {t("security.backupCodesWarning")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-admin-surface-muted border border-admin-border font-mono text-xs text-center text-admin-foreground font-semibold">
                    {backupCodes.map((code, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-admin-surface border border-admin-border tracking-wider select-all"
                      >
                        {code}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyToClipboard(backupCodes.join("\n"))}
                      icon={hasCopiedBackupCodes ? <Check size={14} /> : <Copy size={14} />}
                    >
                      {hasCopiedBackupCodes ? t("common.copied") : t("security.copyAllCodes")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadBackupCodes(backupCodes)}
                      icon={<Download size={14} />}
                    >
                      {t("security.downloadCodes")}
                    </Button>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => {
                        setIsSetupOpen(false);
                        setSetupData(null);
                      }}
                    >
                      {t("security.doneSetup")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {isDisableOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-admin-surface border border-admin-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h3 className="text-base font-semibold text-admin-danger flex items-center gap-2">
                <AlertTriangle size={18} />
                {t("security.disable2FAModalTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setIsDisableOpen(false)}
                className="text-admin-muted hover:text-admin-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <p className="text-xs text-admin-muted leading-relaxed">
                {t("security.disable2FAModalDesc")}
              </p>

              <Input
                id="disable-password"
                type="password"
                label={t("profile.currentPassword")}
                placeholder="••••••••"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
              />

              <Input
                id="disable-code"
                type="text"
                label={t("security.totpOrBackupCode")}
                placeholder="123456"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.trim())}
                error={disableError}
                required
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDisableOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isDisabling}
                >
                  {t("security.confirmDisable")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Modal */}
      {isRegenerateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-admin-surface border border-admin-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h3 className="text-base font-semibold text-admin-foreground flex items-center gap-2">
                <KeyRound size={18} className="text-admin-action" />
                {t("security.regenerateModalTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setIsRegenerateOpen(false)}
                className="text-admin-muted hover:text-admin-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {newBackupCodes.length === 0 ? (
              <form onSubmit={handleRegenerateCodes} className="space-y-4">
                <p className="text-xs text-admin-muted leading-relaxed">
                  {t("security.regenerateModalDesc")}
                </p>

                <Input
                  id="regenerate-password"
                  type="password"
                  label={t("profile.currentPassword")}
                  placeholder="••••••••"
                  value={regeneratePassword}
                  onChange={(e) => setRegeneratePassword(e.target.value)}
                  error={regenerateError}
                  required
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRegenerateOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isRegenerating}
                  >
                    {t("security.generateNewCodesBtn")}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-3 bg-admin-surface-muted border border-admin-border font-mono text-xs text-center text-admin-foreground font-semibold">
                  {newBackupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-admin-surface border border-admin-border tracking-wider select-all"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyToClipboard(newBackupCodes.join("\n"))}
                    icon={<Copy size={14} />}
                  >
                    {t("security.copyAllCodes")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => downloadBackupCodes(newBackupCodes)}
                    icon={<Download size={14} />}
                  >
                    {t("security.downloadCodes")}
                  </Button>
                </div>

                <div className="flex justify-end pt-3 border-t border-admin-border">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsRegenerateOpen(false);
                      setNewBackupCodes([]);
                    }}
                  >
                    {t("common.close")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
