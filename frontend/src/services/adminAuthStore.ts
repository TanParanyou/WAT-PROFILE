let accessToken: string | null = null;
let authLostHandler: (() => void) | null = null;

export const getAdminAccessToken = (): string | null => accessToken;

export const setAdminAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const setAdminAuthLostHandler = (handler: (() => void) | null): void => {
  authLostHandler = handler;
};

export const notifyAdminAuthLost = (): void => {
  authLostHandler?.();
};
