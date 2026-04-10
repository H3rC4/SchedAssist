import { Appointment, AppointmentStatus, AppointmentSource } from '@/types'
import { AuditService } from './audit.service'
import { differenceInHours, parseISO, format } from 'date-fns'

export class AppointmentService {
  /**
   * Create a new appointment with conflict check.
   */
  static async createAppointment(supabase: any, params: {
    tenant_id: string;
    client_id: string;
    professional_id: string;
    service_id: string;
    start_at: string;
    end_at: string;
    source: AppointmentSource;
    notes?: string;
    created_by_user_id?: string;
  }) {
    // 1. Check if professional is working at that time (Availability Check)
    // Remove Z if present so parseISO treats it as wall-clock local time, avoiding server shifts
    const startLocalStr = params.start_at.replace('Z', '');
    const endLocalStr = params.end_at.replace('Z', '');
    
    const startDate = parseISO(startLocalStr);
    const dayOfWeek = startDate.getDay();
    const startTimeStr = format(startDate, 'HH:mm:ss');
    const endTimeStr = format(parseISO(endLocalStr), 'HH:mm:ss');

    const { data: rules } = await supabase
      .from('availability_rules')
      .select('id')
      .eq('tenant_id', params.tenant_id)
      .eq('professional_id', params.professional_id)
      .eq('day_of_week', dayOfWeek)
      .eq('active', true)
      .lte('start_time', startTimeStr)
      .gte('end_time', endTimeStr)
      .limit(1);

    if (!rules || rules.length === 0) {
      throw new Error('El profesional no atiende en el horario seleccionado.');
    }

    // 2. Prevent double-booking (Overlap check)
    const { data: overlapping } = await supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', params.tenant_id)
      .eq('professional_id', params.professional_id)
      .neq('status', 'cancelled')
      .or(`and(start_at.lte."${params.start_at}",end_at.gt."${params.start_at}"),and(start_at.lt."${params.end_at}",end_at.gte."${params.end_at}")`)
      .limit(1);

    if (overlapping && overlapping.length > 0) {
      throw new Error('El profesional ya tiene una cita reservada para este horario.');
    }

    // 3. Insert appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        tenant_id: params.tenant_id,
        client_id: params.client_id,
        professional_id: params.professional_id,
        service_id: params.service_id,
        start_at: params.start_at,
        end_at: params.end_at,
        source: params.source,
        notes: params.notes,
        created_by_user_id: params.created_by_user_id,
        status: 'pending'
      }])
      .select('*')
      .single();

    if (error) throw error;

    // 4. Audit log
    await AuditService.logAction({
      tenant_id: params.tenant_id,
      user_id: params.created_by_user_id,
      action: 'create_appointment',
      entity_type: 'appointment',
      entity_id: data.id,
      new_value: data
    });

    return data;
  }

  /**
   * Cancel an appointment with 24-hour rule enforcement.
   */
  static async cancelAppointment(supabase: any, params: {
    appointment_id: string;
    tenant_id: string;
    reason: string;
    user_id?: string;
    is_admin_override?: boolean;
  }) {
    // 1. Fetch current appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', params.appointment_id)
      .eq('tenant_id', params.tenant_id)
      .single()

    if (fetchError || !appointment) throw new Error('Cita no encontrada.')

    // 2. 24-hour rule check
    const hoursToStart = differenceInHours(parseISO(appointment.start_at), new Date())
    if (hoursToStart < 24 && !params.is_admin_override) {
      throw new Error('Las cancelaciones deben realizarse con al menos 24 horas de antelación.')
    }

    // 3. Update status
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: params.reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.appointment_id)
      .select('*')
      .single()

    if (error) throw error

    // 4. Audit log
    await AuditService.logAction({
      tenant_id: params.tenant_id,
      user_id: params.user_id,
      action: 'cancel_appointment',
      entity_type: 'appointment',
      entity_id: params.appointment_id,
      old_value: appointment,
      new_value: data
    })

    return data
  }

  /**
   * Reschedule an appointment by cancelling the old one and creating a new one (linked).
   */
  static async rescheduleAppointment(supabase: any, params: {
    appointment_id: string;
    tenant_id: string;
    new_start_at: string;
    new_end_at: string;
    user_id?: string;
    is_admin_override?: boolean;
  }) {
    // 1. Fetch old appointment
    const { data: oldAppointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', params.appointment_id)
      .single()

    if (!oldAppointment) throw new Error('Cita original no encontrada.')

    // 2. Cancellation rule for the old slot
    const hoursToStart = differenceInHours(parseISO(oldAppointment.start_at), new Date())
    if (hoursToStart < 24 && !params.is_admin_override) {
      throw new Error('La reprogramación debe iniciarse al menos 24 horas antes de la cita.')
    }

    // 3. Mark old as rescheduled
    await supabase
      .from('appointments')
      .update({ status: 'rescheduled' })
      .eq('id', params.appointment_id)

    const newAppointment = await this.createAppointment(supabase, {
      tenant_id: params.tenant_id,
      client_id: oldAppointment.client_id,
      professional_id: oldAppointment.professional_id,
      service_id: oldAppointment.service_id,
      start_at: params.new_start_at,
      end_at: params.new_end_at,
      source: oldAppointment.source,
      notes: `Reprogramado desde ${params.appointment_id}. Notas originales: ${oldAppointment.notes || ''}`,
      created_by_user_id: params.user_id
    })

    // 5. Link them
    await supabase
      .from('appointments')
      .update({ rescheduled_from_appointment_id: params.appointment_id })
      .eq('id', newAppointment.id)

    return newAppointment
  }

  /**
   * Get available time slots for a professional on a specific date,
   * respecting the duration of the selected service.
   */
  static async getAvailableSlots(supabase: any, params: {
    tenant_id: string;
    professional_id: string;
    date: string; // YYYY-MM-DD
    service_id?: string;
  }) {
    const dayOfWeek = parseISO(params.date).getDay()

    // 0. Check for a date-specific override FIRST
    const { data: override } = await supabase
      .from('professional_availability_overrides')
      .select('*')
      .eq('tenant_id', params.tenant_id)
      .eq('professional_id', params.professional_id)
      .eq('override_date', params.date)
      .maybeSingle()

    // If explicitly blocked → no slots
    if (override?.override_type === 'block') return []

    // Build the effective rules: either from override or from weekly config
    let effectiveRules: any[] = []

    if (override?.override_type === 'open') {
      // Use the override's custom hours for this specific date
      effectiveRules = [{ 
        start_time: override.start_time, 
        end_time: override.end_time,
        lunch_break_start: null,
        lunch_break_end: null
      }]
    } else {
      // Fall back to normal weekly availability rules
      const { data: rules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('tenant_id', params.tenant_id)
        .eq('professional_id', params.professional_id)
        .eq('day_of_week', dayOfWeek)
        .eq('active', true)

      if (!rules || rules.length === 0) return []
      effectiveRules = rules
    }

    // 1. Get service duration
    let durationMinutes = 30; // Default fallback
    if (params.service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', params.service_id)
        .single();
      if (service) durationMinutes = service.duration_minutes;
    }

    // 2. Get existing (non-cancelled) appointments for this day
    const startOfDay = `${params.date}T00:00:00Z`
    const endOfDay = `${params.date}T23:59:59Z`

    const { data: appointments } = await supabase
      .from('appointments')
      .select('start_at, end_at')
      .eq('tenant_id', params.tenant_id)
      .eq('professional_id', params.professional_id)
      .neq('status', 'cancelled')
      .gte('start_at', startOfDay)
      .lte('start_at', endOfDay)

    // 3. Generate slots from effective rules
    const slotSet = new Set<string>()
    const now = new Date()

    for (const rule of effectiveRules) {
      let current = parseISO(`${params.date}T${rule.start_time}`)
      const endRule = parseISO(`${params.date}T${rule.end_time}`)
      const lunchStart = rule.lunch_break_start ? parseISO(`${params.date}T${rule.lunch_break_start}`) : null
      const lunchEnd = rule.lunch_break_end ? parseISO(`${params.date}T${rule.lunch_break_end}`) : null

      while (current < endRule) {
        const slotStart = current;
        const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
        
        // Check 1: Fits within working hours
        if (slotEnd > endRule) break;

        // Check 2: Not in the past
        if (slotStart < now) {
            current = new Date(current.getTime() + 30 * 60000);
            continue;
        }

        // Check 3: Not during lunch break
        if (lunchStart && lunchEnd && slotStart < lunchEnd && slotEnd > lunchStart) {
          current = new Date(current.getTime() + 30 * 60000);
          continue;
        }

        // Check 4: Does not overlap with existing appointments
        const isOccupied = appointments?.some((app: any) => {
            const appStart = parseISO(app.start_at);
            const appEnd = parseISO(app.end_at);
            return (appStart < slotEnd && appEnd > slotStart);
        });

        if (!isOccupied) {
          const timeLabel = slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          slotSet.add(timeLabel)
        }

        current = new Date(current.getTime() + 30 * 60000);
      }
    }

    return Array.from(slotSet).sort()
  }


  /**
   * Get upcoming appointments for a client.
   */
  static async getClientAppointments(supabase: any, params: {
    tenant_id: string;
    client_id: string;
  }) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        professionals(full_name),
        services(name)
      `)
      .eq('tenant_id', params.tenant_id)
      .eq('client_id', params.client_id)
      .in('status', ['pending', 'confirmed', 'awaiting_confirmation'])
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })

    if (error) throw error
    return data
  }
}
