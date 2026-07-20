import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export interface ResourceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface Resource {
  id: string;
  name: string;
  category_id: string | null;
  subcategory: string;
  description: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zip_code: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  website: string | null;
  email: string | null;
  hours: Record<string, string>;
  accepts_uninsured: boolean;
  sliding_scale: boolean;
  medicaid: boolean;
  medicare: boolean;
  private_insurance: boolean;
  walk_ins_welcome: boolean;
  appointments: boolean;
  telehealth: boolean;
  cost_free: boolean;
  cost_estimate_min: number;
  cost_estimate_max: number;
  languages: string[];
  accessibility: string[];
  services: string[];
  specialties: string[];
  audiences: string[];
  rating: number;
  photo_url: string | null;
  domain: string | null;
  google_place_id: string | null;
  tags: string[];
  search_text: string | null;
  created_at: string;
}

export interface CareType {
  id: string;
  name: string;
  slug: string;
  description: string;
  when_to_use: string;
  average_cost_min: number;
  average_cost_max: number;
  wait_time_typical: string;
  severity_level: number;
  icon: string;
  color: string;
  sort_order: number;
}

export interface Symptom {
  id: string;
  name: string;
  slug: string;
  category: string;
  severity_level: number;
  recommended_care_type_id: string | null;
  keywords: string[];
  red_flag: boolean;
}

export interface ResourceRequest {
  id: string;
  category: string;
  name: string;
  city: string;
  details: string;
  contact_email: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  resource_id: string | null;
  feedback_type: string;
  message: string;
  contact_email: string | null;
  created_at: string;
}

export type ResourceWithCategory = Resource & {
  resource_categories?: Pick<ResourceCategory, 'id' | 'name' | 'slug' | 'icon' | 'color'> | null;
};
