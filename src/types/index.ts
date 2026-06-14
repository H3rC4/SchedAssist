// file: src/types/index.ts

export type UserRole = "tenant_admin" | "secretary" | "professional";
export type AppointmentStatus = "pending" | "confirmed" | "awaiting_confirmation" | "cancelled" | "completed" | "no_show" | "rescheduled" | "needs_rescheduling";
export type AppointmentSource = "dashboard" | "whatsapp" | "telegram" | (string & {});

// Plan & Gateway Types
export type PlanTier = 'basic' | 'pro' | 'premium';
export type PaymentGateway = 'stripe';
export type BillingCycle = 'monthly' | 'yearly';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  settings: Record<string, any>;
  
  // Plan & Gateway
  plan_tier?: PlanTier;
  payment_gateway?: PaymentGateway;
  billing_cycle?: BillingCycle;
  
  // Stripe
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  subscription_price_id?: string;
  
  // Limits
  max_professionals?: number;
  max_services?: number;
  max_locations?: number;
  max_appointments_per_month?: number;
  max_patients?: number;
  
  // Features
  custom_domain_enabled?: boolean;
  white_label_enabled?: boolean;
  api_access_enabled?: boolean;
  analytics_tier?: 'basic' | 'advanced' | 'custom';
  
  // WhatsApp
  whatsapp_numbers_count?: number;
  whatsapp_numbers_limit?: number;

  // Trial
  trial_ends_at?: string;

  created_at: string;
  updated_at: string;
}

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  stripe_price_monthly?: string;
  stripe_price_yearly?: string;
  max_professionals: number;
  max_services: number;
  max_locations: number;
  max_appointments_per_month: number;
  max_patients: number;
  custom_domain_enabled: boolean;
  white_label_enabled: boolean;
  api_access_enabled: boolean;
  analytics_tier: 'basic' | 'advanced' | 'custom';
  whatsapp_numbers_limit: number;
}

export interface Payment {
  id: string;
  tenant_id: string;
  gateway: PaymentGateway;
  gateway_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  billing_period_start?: string;
  billing_period_end?: string;
  plan_tier: PlanTier;
  billing_cycle: BillingCycle;
  receipt_url?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface WhatsappNumber {
  id: string;
  tenant_id: string;
  phone_number: string;
  whapi_instance_id?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Professional {
  id: string;
  tenant_id: string;
  user_id?: string;
  full_name: string;
  specialty?: string;
  phone?: string;
  active: boolean;
  auth_email?: string;
  auth_password_hint?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes: number;
  price?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  dni?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  occupation?: string;
  notes?: string;
  allergies?: string;
  whatsapp_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  tenant_id: string;
  name: string;
  address?: string;
  city?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  location_id?: string | null;
  status: AppointmentStatus;
  source: AppointmentSource;
  start_at: string;
  end_at: string;
  notes?: string;
  cancellation_token?: string;
  cancellation_reason?: string;
  cancellation_notified?: boolean;
  cancellation_notified_notes?: string;
  rescheduled_from_appointment_id?: string;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id: string;
  tenant_id: string;
  professional_id: string;
  day_of_week: number; // 0-6
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  active: boolean;
  created_at: string;
}

export type NotificationType =
  | "appointment_created"
  | "appointment_cancelled"
  | "appointment_rescheduled"
  | "professional_blocked"
  | "appointment_confirmed"
  | "appointment_attended"
  | "plan_activated";

export interface Notification {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}
