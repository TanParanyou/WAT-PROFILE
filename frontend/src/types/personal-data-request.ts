export type PrivacyRequestType = "access" | "erasure";
export type PrivacyAction = "export" | "anonymise";

export interface PersonalDataRequestItem {
  id?: string;
  domain: string;
  record_id: string;
  match_basis?: string;
  display_name?: string;
  masked_email?: string;
  selected_action: PrivacyAction | "";
  result?: string;
}

export interface PersonalDataRequest {
  id: string;
  subject_email: string;
  subject_member_code: string;
  request_type: PrivacyRequestType;
  verification_method: string;
  verification_status: string;
  status: string;
  notes: string;
  items: PersonalDataRequestItem[];
  created_at: string;
}

export interface PersonalDataCandidate {
  domain: string;
  record_id: string;
  match_basis: string;
  display_name: string;
  masked_email: string;
}
