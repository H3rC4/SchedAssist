// file: src/validation/schemas.ts
import { z } from "zod";

// Creación de Cita
export const createAppointmentSchema = z.object({
  client_id: z.string().uuid(),
  professional_id: z.string().uuid(),
  service_id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  notes: z.string().optional(),
  source: z.enum(["dashboard", "whatsapp"]).default("dashboard"),
});

// Reprogramación de Cita
export const rescheduleAppointmentSchema = z.object({
  id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  notes: z.string().optional(),
});

// Cancelación de Cita
export const cancelAppointmentSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(5, "El motivo debe tener al menos 5 caracteres"),
});

// Creación de Servicio
export const createServiceSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().min(2, "El nombre del servicio es obligatorio"),
  duration_minutes: z.coerce.number().min(5, "La duración mínima es de 5 minutos"),
  price: z.coerce.number().optional(),
  active: z.boolean().default(true),
});

// Creación de Profesional
export const createProfessionalSchema = z.object({
  tenant_id: z.string().uuid(),
  full_name: z.string().min(3, "El nombre completo es obligatorio"),
  specialty: z.string().optional(),
  email: z.string().email("El email es obligatorio"),
  phone: z.string().optional(),
  location_id: z.string().uuid().optional(),
  active: z.boolean().default(true),
  user_id: z.string().uuid().optional(),
});

// Creación de Cliente
export const createClientSchema = z.object({
  tenant_id: z.string().uuid(),
  first_name: z.string().min(1, "El nombre es obligatorio"),
  last_name: z.string().min(1, "El apellido es obligatorio"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Formato de teléfono inválido"),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  allergies: z.string().optional(),
  address: z.string().optional(),
  dni: z.string().optional(),
  birth_date: z.string().optional().or(z.literal("")),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  whatsapp_opt_in: z.boolean().default(true),
});

// Actualización de notas de cita
export const updateAppointmentNotesSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  notes: z.string().nullable().optional(),
});

// Creación de Ubicación
export const createLocationSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().min(1, "El nombre es obligatorio"),
  address: z.string().optional(),
  city: z.string().optional(),
  active: z.boolean().default(true),
});

// Actualización de Servicio
export const updateServiceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(2).optional(),
  duration_minutes: z.coerce.number().min(5).optional(),
  price: z.coerce.number().optional(),
  active: z.boolean().optional(),
});
