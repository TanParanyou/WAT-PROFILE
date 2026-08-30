"use client";

import { useState, useCallback, useMemo } from "react";
import type { SignaturePreset, SignatureMode } from "@/types/signatures";
import { useToast } from "@/hooks/useToast";

const STORAGE_KEY = "wat_signature_presets";

function parsePresets(raw: string): SignaturePreset[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const result: SignaturePreset[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        "id" in item &&
        "name" in item &&
        "url" in item &&
        typeof (item as { id: unknown }).id === "string" &&
        typeof (item as { name: unknown }).name === "string" &&
        typeof (item as { url: unknown }).url === "string"
      ) {
        const p = item as {
          id: string;
          name: string;
          url: string;
          createdAt?: unknown;
          signatoryName?: unknown;
          signatoryTitle?: unknown;
        };
        result.push({
          id: p.id,
          name: p.name,
          url: p.url,
          createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString(),
          signatoryName: typeof p.signatoryName === "string" ? p.signatoryName : undefined,
          signatoryTitle: typeof p.signatoryTitle === "string" ? p.signatoryTitle : undefined,
        });
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function useSignaturePresets(defaultWatSignatureUrl?: string) {
  const [presets, setPresets] = useState<SignaturePreset[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? parsePresets(raw) : [];
    } catch {
      return [];
    }
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string>("default");
  const { toast } = useToast();

  const savePreset = useCallback(
    (name: string, url: string, signatoryName?: string, signatoryTitle?: string) => {
      const trimmed = name.trim();
      if (!trimmed || !url) return;

      const newPreset: SignaturePreset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: trimmed,
        signatoryName,
        signatoryTitle,
        url,
        createdAt: new Date().toISOString(),
      };

      setPresets((prev) => {
        const next = [newPreset, ...prev];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (err) {
          console.error("Failed to save preset to localStorage", err);
        }
        return next;
      });

      setSelectedPresetId(newPreset.id);
      toast.success(`บันทึกลายเซ็น "${trimmed}" ลงในคลังเรียบร้อยแล้ว`);
    },
    [toast]
  );

  const deletePreset = useCallback(
    (id: string, name: string) => {
      setPresets((prev) => {
        const next = prev.filter((p) => p.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (err) {
          console.error("Failed to delete preset from localStorage", err);
        }
        return next;
      });

      setSelectedPresetId((curr) => (curr === id ? "default" : curr));
      toast.success(`ลบลายเซ็น "${name}" ออกจากคลังเรียบร้อยแล้ว`);
    },
    [toast]
  );

  const resolveActiveSignature = useCallback(
    (
      mode: SignatureMode,
      liveSignature: string | null,
      customDefaultUrl?: string
    ): string | null => {
      if (mode === "none") return null;
      if (mode === "pad") return liveSignature;
      const fallbackUrl = customDefaultUrl ?? defaultWatSignatureUrl ?? "";

      if (selectedPresetId === "default") {
        return fallbackUrl || null;
      }

      const found = presets.find((p) => p.id === selectedPresetId);
      return found ? found.url : (fallbackUrl || null);
    },
    [presets, selectedPresetId, defaultWatSignatureUrl]
  );

  const activePreset = useMemo(() => {
    if (selectedPresetId === "default") return null;
    return presets.find((p) => p.id === selectedPresetId) || null;
  }, [presets, selectedPresetId]);

  return {
    presets,
    selectedPresetId,
    setSelectedPresetId,
    savePreset,
    deletePreset,
    resolveActiveSignature,
    activePreset,
  };
}
