export type SignatureMode = "saved" | "pad" | "none";

export interface SignaturePreset {
  id: string;
  name: string;
  signatoryName?: string;
  signatoryTitle?: string;
  url: string;
  createdAt: string;
}

export interface SignatureManagerProps {
  signatureMode: SignatureMode;
  onModeChange: (mode: SignatureMode) => void;
  liveSignature: string | null;
  onLiveSignatureChange: (url: string | null) => void;
  savedSignatureUrl?: string;
  defaultSignatoryName?: string;
  selectedPresetId: string;
  onSelectPresetId: (id: string) => void;
  presets: SignaturePreset[];
  onSaveToPresets: (name: string, url: string) => void;
  onDeletePreset: (id: string, name: string) => void;
  onSaveAsWatDefault?: (url: string) => Promise<void> | void;
  canSaveWatDefault?: boolean;
  isSavingWatDefault?: boolean;
  onOpenSettings?: () => void;
}
