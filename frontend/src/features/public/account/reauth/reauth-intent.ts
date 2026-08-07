const reauthMessageType = "wat-account-reauth-complete";

interface ReauthPopupMessage {
  type: typeof reauthMessageType;
  success: boolean;
  code?: string;
}

export function createReauthPopupMessage(
  success: boolean,
  code?: string,
): ReauthPopupMessage {
  return { type: reauthMessageType, success, ...(code ? { code } : {}) };
}

export function isReauthPopupMessage(
  value: unknown,
): value is ReauthPopupMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ReauthPopupMessage>;
  return (
    message.type === reauthMessageType && typeof message.success === "boolean"
  );
}

export { reauthMessageType };
