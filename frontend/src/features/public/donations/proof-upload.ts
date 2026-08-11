export interface DonationProofMetadata {
  type: string;
  size: number;
}

export interface DonationProofValidationMessages {
  invalidType: string;
  tooLarge: string;
}

export const DONATION_PROOF_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const DONATION_PROOF_MAX_BYTES = 10 * 1024 * 1024;

const donationProofTypeSet = new Set<string>(DONATION_PROOF_TYPES);

export function validateDonationProofMetadata(file: DonationProofMetadata, messages: DonationProofValidationMessages): string | null {
  if (!donationProofTypeSet.has(file.type)) return messages.invalidType;
  if (file.size <= 0 || file.size > DONATION_PROOF_MAX_BYTES) return messages.tooLarge;
  return null;
}

export function isDonationProofImage(file: DonationProofMetadata): boolean {
  return file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
}

export function formatDonationProofSize(bytes: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}
