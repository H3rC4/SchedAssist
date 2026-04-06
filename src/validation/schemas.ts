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
  name: z.string().min(2, "El nombre del servicio es obligatorio"),
  duration_minutes: z.number().min(5, "La duración mínima es de 5 minutos"),
  price: z.number().optional(),
  active: z.boolean().default(true),
});

// Creación de Profesional
export const createProfessionalSchema = z.object({
  full_name: z.string().min(3, "El nombre completo es obligatorio"),
  specialty: z.string().optional(),
  active: z.boolean().default(true),
  user_id: z.string().uuid().optional(),
});

// Creación de Cliente
export const createClientSchema = z.object({
  first_name: z.string().min(1, "El nombre es obligatorio"),
  last_name: z.string().min(1, "El apellido es obligatorio"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Formato de teléfono inválido"),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  whatsapp_opt_in: z.boolean().default(true),
});
