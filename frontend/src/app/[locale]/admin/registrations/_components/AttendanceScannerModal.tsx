"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, Camera, CameraOff, CheckCircle2, AlertCircle, Loader2, X, RefreshCw, UserCheck } from "lucide-react";
import { checkInAdminEventRegistrationByCode } from "@/features/admin/event-registrations/api";
import type { AdminEventRegistrationDetail } from "@/features/public/event-registration/types";

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCheckIn?: (detail: AdminEventRegistrationDetail) => void;
}

export function AttendanceScannerModal({
  isOpen,
  onClose,
  onSuccessCheckIn,
}: AttendanceScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<AdminEventRegistrationDetail | null>(null);
  const [checkedInList, setCheckedInList] = useState<AdminEventRegistrationDetail[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Focus manual input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleCheckIn = useCallback(
    async (codeToScan: string) => {
      const code = codeToScan.trim().toUpperCase();
      if (!code) return;

      setIsLoading(true);
      setErrorMsg(null);

      try {
        const detail = await checkInAdminEventRegistrationByCode(code);
        setLastCheckIn(detail);
        setCheckedInList((prev) => [detail, ...prev.filter((p) => p.id !== detail.id)]);
        setManualCode("");
        onSuccessCheckIn?.(detail);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "ไม่พบรหัสลงทะเบียน หรือการลงทะเบียนถูกยกเลิก";
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
        // refocus
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    },
    [onSuccessCheckIn]
  );

  // Camera stream controls
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Start BarcodeDetector if available
      if ("BarcodeDetector" in window) {
        type BarcodeDetectorInstance = {
          detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
        };
        const BarcodeDetectorConstructor = (window as unknown as { BarcodeDetector: new (options?: { formats: string[] }) => BarcodeDetectorInstance }).BarcodeDetector;
        const detector = new BarcodeDetectorConstructor({ formats: ["qr_code", "code_128", "code_39"] });

        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const scanned = barcodes[0].rawValue;
                if (scanned) {
                  void handleCheckIn(scanned);
                }
              }
            } catch {
              // ignore detection frame errors
            }
          }
        }, 500);
      }
    } catch {
      setCameraError("ไม่สามารถเปิดกล้องได้ โปรดอนุญาตสิทธิ์เข้าถึงกล้อง หรือใช้ช่องกรอกรหัสด้วยตนเอง");
      setCameraActive(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-admin-surface border border-admin-border w-full max-w-2xl rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between bg-admin-surface">
          <div className="flex items-center gap-2.5">
            <QrCode className="text-admin-action" size={20} />
            <h2 className="text-base font-semibold text-admin-foreground">
              สแกนเช็คชื่อผู้เข้าร่วมกิจกรรม (Attendance Check-in)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-admin-muted hover:text-admin-foreground hover:bg-admin-surface-muted transition-colors rounded-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Manual Code Input / Barcode Scanner Gun Box */}
          <div>
            <label className="block text-xs font-semibold text-admin-foreground mb-1.5">
              พิมพ์รหัสยืนยัน หรือ ยิงบาร์โค้ด / สแกน QR Code (Confirmation Code)
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleCheckIn(manualCode);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="เช่น REG-2026-ABCD"
                disabled={isLoading}
                className="flex-1 min-h-11 px-3.5 border border-admin-control-border bg-admin-surface text-admin-foreground font-mono text-sm uppercase placeholder:normal-case placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
              />
              <button
                type="submit"
                disabled={isLoading || !manualCode.trim()}
                className="min-h-11 px-5 bg-admin-action text-admin-on-action hover:bg-admin-action-hover text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                <span>เช็คชื่อ</span>
              </button>
            </form>
          </div>

          {/* Camera Scanner Toggle */}
          <div className="border border-admin-border bg-admin-surface-muted/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-admin-foreground flex items-center gap-2">
                <Camera size={15} className="text-admin-muted" />
                โหมดเปิดกล้องสแกนสด (Camera Live Scanner)
              </span>
              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                className="text-xs font-semibold text-admin-action hover:underline inline-flex items-center gap-1.5"
              >
                {cameraActive ? (
                  <>
                    <CameraOff size={14} />
                    <span>ปิดกล้อง</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    <span>เปิดกล้องมือถือ/แท็บเล็ต</span>
                  </>
                )}
              </button>
            </div>

            {cameraActive && (
              <div className="relative aspect-video bg-black overflow-hidden border border-admin-border flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none m-8 flex items-center justify-center">
                  <span className="text-[11px] bg-black/70 text-white px-2.5 py-1">
                    วาง QR Code ให้อยู่ในกรอบ
                  </span>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-admin-danger mt-2 flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>{cameraError}</span>
              </p>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-admin-danger-surface border border-admin-danger/30 text-admin-danger text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Check-in Feedback Banner */}
          {lastCheckIn && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold">เช็คชื่อสำเร็จเรียบร้อย! (Checked-in)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-500/20">
                <div>
                  <span className="text-admin-muted block">ชื่อผู้เข้าร่วม:</span>
                  <span className="font-semibold text-admin-foreground">
                    {lastCheckIn.contact?.first_name} {lastCheckIn.contact?.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-admin-muted block">รหัสยืนยัน:</span>
                  <span className="font-mono font-bold text-admin-foreground">
                    {lastCheckIn.confirmation_code}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-admin-muted block">กิจกรรม:</span>
                  <span className="font-medium text-admin-foreground">
                    {lastCheckIn.event.title["th"] || lastCheckIn.event.title["en"] || "Event"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Checked-in Session History */}
          {checkedInList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-admin-foreground">
                  รายชื่อที่เช็คชื่อแล้วในเซสชันนี้ ({checkedInList.length})
                </span>
                <button
                  type="button"
                  onClick={() => setCheckedInList([])}
                  className="text-[11px] text-admin-muted hover:text-admin-danger"
                >
                  ล้างประวัติเซสชัน
                </button>
              </div>
              <div className="border border-admin-border divide-y divide-admin-border max-h-40 overflow-y-auto text-xs">
                {checkedInList.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between bg-admin-surface">
                    <div>
                      <span className="font-medium text-admin-foreground">
                        {item.contact?.first_name} {item.contact?.last_name}
                      </span>
                      <span className="text-admin-muted ml-2 font-mono text-[11px]">
                        ({item.confirmation_code})
                      </span>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1 font-mono">
                      <CheckCircle2 size={12} />
                      Attended
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-admin-border bg-admin-surface flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-5 border border-admin-control-border bg-admin-surface hover:bg-admin-surface-muted text-xs font-semibold text-admin-foreground transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
