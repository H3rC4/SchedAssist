// file: src/types/index.ts

export type UserRole = "tenant_admin" | "secretary" | "professional";
export type AppointmentStatus = "pending" | "confirmed" | "awaiting_confirmation" | "cancelled" | "completed" | "no_show" | "rescheduled";
export type AppointmentSource = "dashboard" | "whatsapp" | "telegram" | (string & {});

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
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
  active: boolean;
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
  notes?: string;
  whatsapp_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  start_at: string;
  end_at: string;
  notes?: string;
  cancellation_reason?: string;
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

export interface BlockedSlot {
  id: string;
  tenant_id: string;
  professional_id?: string;
  start_at: string;
  end_at: string;
  reason?: string;
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
