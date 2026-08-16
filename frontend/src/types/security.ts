export interface SecurityPreferences {
  email_on_new_device: boolean;
  email_on_failed_login: boolean;
  email_on_security_change: boolean;
}

export interface TOTPSetupResponse {
  secret: string;
  otpauth_uri: string;
}

export interface TOTPVerifySetupRequest {
  secret: string;
  code: string;
}

export interface TOTPVerifySetupResponse {
  message: string;
  backup_codes: string[];
}

export interface TOTPDisableRequest {
  password: string;
  code: string;
}

export interface RegenerateBackupCodesRequest {
  password: string;
}

export interface RegenerateBackupCodesResponse {
  message: string;
  backup_codes: string[];
}

export interface AdminSessionItem {
  id: string;
  ip_address: string;
  user_agent: string;
  last_used_at: string;
  expires_at: string;
  is_current: boolean;
  created_at: string;
}
