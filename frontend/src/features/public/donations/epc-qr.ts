/**
 * European Payments Council Quick Response Code (EPC QR Code / GiroCode) generator.
 * Conforms to EPC069-08 Quick Response Code Guidelines to Enable Data Capture for the Initiation of an SCT.
 * Standard format:
 *   Line 1: Service Tag (BCD)
 *   Line 2: Version (002)
 *   Line 3: Character Set (1 = UTF-8)
 *   Line 4: Identification (SCT)
 *   Line 5: BIC (optional, 8 or 11 chars)
 *   Line 6: Beneficiary Name (max 70 chars)
 *   Line 7: IBAN (max 34 chars)
 *   Line 8: Amount (EUR + decimal, max 12 chars e.g. "EUR15.00", optional)
 *   Line 9: Purpose Code (max 4 chars, optional)
 *   Line 10: Remittance Reference (Structured, max 35 chars, optional)
 *   Line 11: Remittance Text (Unstructured, max 140 chars, optional)
 *   Line 12: Beneficiary to originator information (optional)
 */

export interface EpcQrOptions {
  bic?: string;
  recipientName: string;
  iban: string;
  amount?: number;
  purpose?: string;
  remittanceText?: string;
}

export function cleanIban(iban: string): string {
  return iban.replace(/[\s-]/g, "").toUpperCase();
}

export function cleanBic(bic: string): string {
  return bic.replace(/[\s-]/g, "").toUpperCase();
}

export function formatEpcAmount(amount: number): string {
  if (amount <= 0 || isNaN(amount)) {
    return "";
  }
  return `EUR${amount.toFixed(2)}`;
}

export function generateEpcQrPayload(options: EpcQrOptions): string {
  const serviceTag = "BCD";
  const version = "002";
  const characterSet = "1"; // 1 = UTF-8
  const identification = "SCT"; // SEPA Credit Transfer

  const bic = options.bic ? cleanBic(options.bic) : "";
  const recipientName = options.recipientName.trim().slice(0, 70);
  const iban = cleanIban(options.iban);
  const amountStr = options.amount !== undefined ? formatEpcAmount(options.amount) : "";
  const purpose = options.purpose ? options.purpose.trim().slice(0, 4) : "";
  const remittanceRef = ""; // Structured reference (leave empty if unstructured text is used)
  const remittanceText = options.remittanceText ? options.remittanceText.trim().slice(0, 140) : "";
  const beneficiaryInfo = "";

  const lines = [
    serviceTag,
    version,
    characterSet,
    identification,
    bic,
    recipientName,
    iban,
    amountStr,
    purpose,
    remittanceRef,
    remittanceText,
    beneficiaryInfo,
  ];

  return lines.join("\n");
}
