import type { MultiLangText } from "./api";

// User & Role
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role_id: string | null;
  role?: Role;
  email_verified: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// Event
export interface Event {
  id: number;
  slug: string;
  title: MultiLangText;
  description: MultiLangText;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  location: MultiLangText;
  image_url: string;
  map_url: string;
  event_type: string;
  is_recurring: boolean;
  recurring_pattern: string;
  max_participants: number | null;
  registration_enabled: boolean;
  registration_deadline: string | null;
  is_active: boolean;
  display_order: number;
  schedules?: EventSchedule[];
  created_at: string;
  updated_at: string;
}

export interface EventSchedule {
  id: number;
  event_id: number;
  start_time: string;
  end_time: string;
  activity: MultiLangText;
  display_order: number;
  created_at: string;
}

// Monk
export interface Monk {
  id: number;
  slug: string;
  image_url: string;
  name: MultiLangText;
  title: MultiLangText;
  bio: MultiLangText;
  ordination_date: string | null;
  position: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Gallery
export interface GalleryCategory {
  id: number;
  slug: string;
  name: MultiLangText;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Gallery {
  id: number;
  image_url: string;
  thumbnail_url: string;
  caption: MultiLangText;
  category_id: number | null;
  category?: GalleryCategory;
  event_id: number | null;
  event?: Event;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Schedule
export interface Schedule {
  id: number;
  schedule_type: string;
  day_of_week: number | null;
  time_start: string | null;
  time_end: string | null;
  activity: MultiLangText;
  location: MultiLangText;
  online_link: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Donation
export interface DonationCategory {
  id: number;
  name: MultiLangText;
  description: MultiLangText;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Donation {
  id: number;
  receipt_number: string;
  donor_type: string;
  member_id: number | null;
  member?: Member;
  donor_name: string;
  donor_email: string;
  donor_phone: string;
  donor_address: string;
  amount: number;
  currency: string;
  donation_date: string;
  donation_method: string;
  category_id: number | null;
  category?: DonationCategory;
  purpose: MultiLangText;
  is_anonymous: boolean;
  tax_receipt_required: boolean;
  tax_receipt_sent: boolean;
  tax_receipt_sent_at: string | null;
  notes: string;
  status: string;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
}

// Member
export interface Member {
  id: number;
  user_id: string | null;
  member_code: string;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  birth_date: string | null;
  gender: string;
  nationality: string;
  address_th: string;
  address_en: string;
  phone: string;
  line_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  membership_type: string;
  membership_status: string;
  membership_date: string;
  profile_image_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Contact Inquiry
export interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  inquiry_type: string;
  status: string;
  replied_by_id: string | null;
  replied_at: string | null;
  reply_message: string;
  created_at: string;
  updated_at: string;
}

// Setting
export interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
