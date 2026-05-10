import { Appointment, AppointmentStatus, AppointmentSource } from '@/types'
import { AuditService } from './audit.service'
import { MessageService } from './message.service'
import { NotificationService } from './notification.service'
import { differenceInHours, parseISO, format } from 'date-fns'
import { translations, Language } from '@/lib/i18n'

export class AppointmentService {
  /**
   * Check if a professional is available in a given time range,
   * respecting weekly rules, lunch breaks, and date-specific overrides.
   */
  static async isProfessionalAvailable(supabase: any, params: {
    tenant_id: string;
    professional_id: string;
    start_at: string;
    end_at: string;
  }) {
    const startLocalStr = params.start_at.replace('Z', '');
    const endLocalStr = params.end_at.replace('Z', '');
    
    const startDate = parseISO(startLocalStr);
    const endDate = parseISO(endLocalStr);
    const dateStr = format(startDate, 'yyyy-MM-dd');
    const dayOfWeek = startDate.getDay();
    
    const startTimeStr = format(startDate, 'HH:mm:ss');
    const endTimeStr = format(endDate, 'HH:mm:ss');

    // 1. Check for date-specific overrides
    const { data: allOverrides } = await supabase
      .from('professional_availability_overrides')
      .select('*')
      .eq('tenant_id', params.tenant_id)
      .eq('professional_id', params.professional_id)
      .eq('override_date', dateStr);

    // If any override is a full-day block, or if the requested time falls within an hourly block
    if (allOverrides && allOverrides.length > 0) {
      for (const ov of allOverrides as any[]) {
        if (ov.override_type === 'block') {
          // If no times specified, it blocks the entire day
          if (!ov.start_time || !ov.end_time) return false;
          
          // Overlap if: appointmentStart < blockEnd AND appointmentEnd > blockStart
          // We use string comparison for HH:mm:ss format which is safe
          const overlapBlock = startTimeStr < ov.end_time && endTimeStr > ov.start_time;
          if (overlapBlock) return false;
        }
      }
    }

    let effectiveRules: any[] = [];
    const openOverride = allOverrides?.find((ov: any) => ov.override_type === 'open');

    if (openOverride) {
      // Use the override's custom hours for this specific date
      effectiveRules = [{ 
        start_time: openOverride.start_time, 
        end_time: openOverride.end_time,
        lunch_break_start: null,
        lunch_break_end: null
      }];
    } else {
      // Fall back to normal weekly availability rules
      const { data: rules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('tenant_id', params.tenant_id)
        .eq('professional_id', params.professional_id)
        .eq('day_of_week', dayOfWeek)
        .eq('active', true);

      if (!rules || rules.length === 0) return false;
      effectiveRules = rules;
    }

    // 2. Validate against rules (usually only 1 rule per day, but we handle multiple for robustness)
    const fitsInRule = effectiveRules.some(rule => {
      // Check if it fits within working hours
      const withinWorkingHours = rule.start_time <= startTimeStr && rule.end_time >= endTimeStr;
      if (!withinWorkingHours) return false;

      // Check if it overlaps with lunch break
      if (rule.lunch_break_start && rule.lunch_break_end) {
        // Overlap if: appointmentStart < lunchEnd AND appointmentEnd > lunchStart
        const overlapLunch = startTimeStr < rule.lunch_break_end && endTimeStr > rule.lunch_break_start;
        if (overlapLunch) return false;
      }

      return true;
    });

    return fitsInRule;
  }

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
    rescheduled_from_appointment_id?: string | null;
    location_id?: string | null;
  }) {
    // 1. Availability Check (Rules + Overrides + Lunch Breaks)
    const isAvailable = await this.isProfessionalAvailable(supabase, {
      tenant_id: params.tenant_id,
      professional_id: params.professional_id,
      start_at: params.start_at,
      end_at: params.end_at
    });

    if (!isAvailable) {
      throw new Error('El profesional no atiende en el horario seleccionado o tiene este día bloqueado.');
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
        location_id: params.location_id || null,
        start_at: params.start_at,
        end_at: params.end_at,
        source: params.source,
        notes: params.notes,
        created_by_user_id: params.created_by_user_id,
        rescheduled_from_appointment_id: params.rescheduled_from_appointment_id,
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

    // 5. Notification
    try {
      const [{ data: tenantCfg }, { data: clientData }, { data: profData }] = await Promise.all([
        supabase.from('tenants').select('settings').eq('id', params.tenant_id).single(),
        supabase.from('clients').select('first_name, last_name').eq('id', params.client_id).single(),
        supabase.from('professionals').select('full_name').eq('id', params.professional_id).single(),
      ])
      const lang: Language = tenantCfg?.settings?.language || 'es'
      const t = translations[lang] || translations['es']
      const patientName = clientData ? `${clientData.first_name} ${clientData.last_name}` : '—'
      const profName = profData?.full_name || '—'
      const startDate = parseISO(params.start_at)
      const dateStr = format(startDate, lang === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy')
      const timeStr = format(startDate, 'HH:mm')

      await NotificationService.createNotification(supabase, {
        tenant_id: params.tenant_id,
        type: 'appointment_created',
        title: t.notification_new_appointment,
        body: t.notify_body_created(patientName, profName, dateStr, timeStr),
        metadata: { appointment_id: data.id, client_id: params.client_id, professional_id: params.professional_id },
      })
    } catch (notifErr) {
      console.error('[AppointmentService] Failed to create notification:', notifErr)
    }

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
        cancellation_notified: false,
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

    // 5. Notification
    try {
      const [{ data: tenantCfg }, { data: clientData }, { data: profData }] = await Promise.all([
        supabase.from('tenants').select('settings').eq('id', params.tenant_id).single(),
        supabase.from('clients').select('first_name, last_name').eq('id', appointment.client_id).single(),
        supabase.from('professionals').select('full_name').eq('id', appointment.professional_id).single(),
      ])
      const lang: Language = tenantCfg?.settings?.language || 'es'
      const t = translations[lang] || translations['es']
      const patientName = clientData ? `${clientData.first_name} ${clientData.last_name}` : '—'
      const profName = profData?.full_name || '—'
      const startDate = parseISO(appointment.start_at)
      const dateStr = format(startDate, lang === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy')
      const isProfessionalCancellation = params.reason === 'professional_cancellation'

      const notifType = isProfessionalCancellation
        ? 'professional_blocked' as const
        : 'appointment_cancelled' as const

      let body: string
      if (isProfessionalCancellation) {
        body = t.notify_body_blocked(profName, dateStr, 1)
      } else {
        body = t.notify_body_cancelled(patientName, profName, dateStr)
      }

      await NotificationService.createNotification(supabase, {
        tenant_id: params.tenant_id,
        type: notifType,
        title: isProfessionalCancellation ? t.notification_professional_blocked : t.notification_appointment_cancelled,
        body,
        metadata: { appointment_id: appointment.id, client_id: appointment.client_id, professional_id: appointment.professional_id },
      })
    } catch (notifErr) {
      console.error('[AppointmentService] Failed to create notification:', notifErr)
    }

    // 6. Notify waitlisted patients if auto-notify is enabled for this tenant
    try {
      const { data: tenantCfg } = await supabase
        .from('tenants').select('settings').eq('id', params.tenant_id).single()
      const autoNotify = tenantCfg?.settings?.waitlist_auto_notify !== false // default true
      if (autoNotify) {
        await AppointmentService._notifyWaitlist(supabase, {
          tenant_id: params.tenant_id,
          professional_id: appointment.professional_id,
          freed_slot_date: appointment.start_at,
          freed_start_at: appointment.start_at,
        })
      }
    } catch (wlErr) {
      // Non-blocking: log but don't fail the cancellation
      console.error('[Waitlist] Failed to notify waitlisted patients:', wlErr)
    }

    return data
  }
  /**
   * Notifies the FIRST patient in the waitlist for a freed slot.
   * If the offer expires without response, the cron job picks up the next in line.
   */
  private static async _notifyWaitlist(supabase: any, params: {
    tenant_id: string;
    professional_id: string;
    freed_slot_date: string; // ISO timestamp
    freed_start_at: string;
  }) {
    const cancelledDate = parseISO(params.freed_slot_date)
    const dateStr = format(cancelledDate, 'yyyy-MM-dd')
    const timeStr = format(cancelledDate, 'HH:mm')

    // Fetch tenant language, offer timeout config, and professional name
    const [{ data: tenantData }, { data: profData }] = await Promise.all([
      supabase.from('tenants').select('settings').eq('id', params.tenant_id).single(),
      supabase.from('professionals').select('full_name').eq('id', params.professional_id).single(),
    ])

    const lang = (tenantData?.settings?.language as 'en' | 'es' | 'it') || 'es'
    const profName = profData?.full_name || ''

    // RULE: Only offer if slot is at least 24 hours in the future
    const hoursUntilSlot = (new Date(params.freed_start_at).getTime() - new Date().getTime()) / 3600000
    if (hoursUntilSlot < 24) {
      console.log(`[Waitlist] Slot ${params.freed_start_at} is too soon (<24h), skipping notification.`)
      return
    }

    // Find ONLY THE FIRST pending entry (FIFO order) that matches professional + date
    const { data: waitlisted } = await supabase
      .from('waitlists')
      .select('*, clients(id, first_name, last_name, phone)')
      .eq('tenant_id', params.tenant_id)
      .eq('professional_id', params.professional_id)
      .eq('status', 'pending')
      .or(`preferred_date.eq.${dateStr},and(start_date.lte.${dateStr},end_date.gte.${dateStr})`)
      .order('created_at', { ascending: true })
      .limit(1)

    if (!waitlisted || waitlisted.length === 0) return

    const entry = waitlisted[0]
    const client = entry.clients
    if (!client?.phone) return

    // Compute offer expiry (24 hours for daily cron compatibility)
    const offerExpiresAt = new Date(Date.now() + 1440 * 60 * 1000).toISOString()

    const buildMsg = (firstName: string) => {
      const dateFormatted = format(cancelledDate, lang === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy')
      if (lang === 'es') return `¡Hola ${firstName}! 🗓️ Se liberó un turno con *${profName}* para el *${dateFormatted} a las ${timeStr}*.\n\n¡Tenés *24 horas* para tomarlo! Responde *SÍ* para confirmar o *NO* si no podés.\n\nSi no respondés, le ofreceremos el turno al siguiente paciente en espera.`
      if (lang === 'it') return `Ciao ${firstName}! 🗓️ Si è liberato un appuntamento con *${profName}* per il *${dateFormatted} alle ${timeStr}*.\n\nHai *24 ore* per prenderlo! Rispondi *SÌ* per confermare o *NO* se non puoi.\n\nSe non rispondi, offriremo il turno al paziente successivo in lista.`
      return `Hi ${firstName}! 🗓️ A slot with *${profName}* opened up for *${dateFormatted} at ${timeStr}*.\n\nYou have *24 hours* to claim it! Reply *YES* to confirm or *NO* if you can't make it.\n\nIf you don't respond, we'll offer the slot to the next patient on the waitlist.`
    }

    const isTelegram = client.phone.startsWith('tg_')
    const channel = isTelegram ? 'telegram_gastro' : 'whatsapp'
    const chatId = isTelegram ? parseInt(client.phone.replace('tg_', '')) : client.phone

    try {
      await MessageService.sendMessage({
        channel,
        chat_id: chatId,
        tenant_id: params.tenant_id,
        text: buildMsg(client.first_name),
        buttons: lang === 'es' ? ['✅ SÍ', '❌ NO'] : (lang === 'it' ? ['✅ SÌ', '❌ NO'] : ['✅ YES', '❌ NO']),
      })

      // Mark as notified with offer details
      await supabase
        .from('waitlists')
        .update({
          status: 'notified',
          notified_at: new Date().toISOString(),
          offer_expires_at: offerExpiresAt,
          offered_slot_start_at: params.freed_start_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.id)

    } catch (msgErr) {
      console.error(`[Waitlist] Failed to notify client ${client.id}:`, msgErr)
    }
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

    // 6. Notification for reschedule
    try {
      const [{ data: tenantCfg }, { data: clientData }, { data: profData }] = await Promise.all([
        supabase.from('tenants').select('settings').eq('id', params.tenant_id).single(),
        supabase.from('clients').select('first_name, last_name').eq('id', oldAppointment.client_id).single(),
        supabase.from('professionals').select('full_name').eq('id', oldAppointment.professional_id).single(),
      ])
      const lang: Language = tenantCfg?.settings?.language || 'es'
      const t = translations[lang] || translations['es']
      const patientName = clientData ? `${clientData.first_name} ${clientData.last_name}` : '—'
      const profName = profData?.full_name || '—'
      const oldDate = parseISO(oldAppointment.start_at)
      const newDate = parseISO(params.new_start_at)
      const dateFmt = (d: Date) => format(d, lang === 'en' ? 'MM/dd/yyyy HH:mm' : 'dd/MM/yyyy HH:mm')

      await NotificationService.createNotification(supabase, {
        tenant_id: params.tenant_id,
        type: 'appointment_rescheduled',
        title: t.notification_appointment_rescheduled,
        body: t.notify_body_rescheduled(patientName, dateFmt(oldDate), dateFmt(newDate), profName),
        metadata: {
          appointment_id: newAppointment.id,
          old_appointment_id: params.appointment_id,
          client_id: oldAppointment.client_id,
          professional_id: oldAppointment.professional_id,
        },
      })
    } catch (notifErr) {
      console.error('[AppointmentService] Failed to create notification:', notifErr)
    }

    return newAppointment
  }

  /**
   * Confirm an appointment (patient responded YES to reminder).
   * Updates status to 'confirmed' and creates a notification.
   */
  static async confirmAppointment(supabase: any, params: {
    appointment_id: string;
    tenant_id: string;
  }) {
    const { data: appointment, error: fetchErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', params.appointment_id)
      .eq('tenant_id', params.tenant_id)
      .single()

    if (fetchErr || !appointment) throw new Error('Cita no encontrada.')

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', params.appointment_id)
      .select('*')
      .single()

    if (error) throw error

    try {
      const [{ data: tenantCfg }, { data: clientData }, { data: profData }] = await Promise.all([
        supabase.from('tenants').select('settings').eq('id', params.tenant_id).single(),
        supabase.from('clients').select('first_name, last_name').eq('id', appointment.client_id).single(),
        supabase.from('professionals').select('full_name').eq('id', appointment.professional_id).single(),
      ])
      const lang: Language = tenantCfg?.settings?.language || 'es'
      const t = translations[lang] || translations['es']
      const patientName = clientData ? `${clientData.first_name} ${clientData.last_name}` : '—'
      const profName = profData?.full_name || '—'
      const startDate = parseISO(appointment.start_at)
      const dateStr = format(startDate, lang === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy')
      const timeStr = format(startDate, 'HH:mm')

      await NotificationService.createNotification(supabase, {
        tenant_id: params.tenant_id,
        type: 'appointment_confirmed',
        title: t.notification_appointment_confirmed,
        body: t.notify_body_confirmed(patientName, profName, dateStr, timeStr),
        metadata: { appointment_id: appointment.id, client_id: appointment.client_id, professional_id: appointment.professional_id },
      })
    } catch (notifErr) {
      console.error('[AppointmentService] Failed to create notification:', notifErr)
    }

    return data
  }

  /**
   * Get available time slots for a professional on a specific date,
   * respecting the duration of the selected service.
   */
  static async getAvailabilityDetails(supabase: any, params: {
    tenant_id: string;
    professional_id: string;
    date: string; // YYYY-MM-DD
    service_id?: string;
  }): Promise<{ slots: string[]; isBlocked: boolean; blockReason: string | null }> {
    const dayOfWeek = parseISO(params.date).getDay()

    // 0. Check for date-specific overrides
    const { data: allOverrides } = await supabase
      .from('professional_availability_overrides')
      .select('*')
      .eq('tenant_id', params.tenant_id)
      .eq('professional_id', params.professional_id)
      .eq('override_date', params.date);

    // Check for full-day block first
    const fullDayBlock = allOverrides?.find((ov: any) => ov.override_type === 'block' && (!ov.start_time || !ov.end_time));
    if (fullDayBlock) {
      return { slots: [], isBlocked: true, blockReason: fullDayBlock.reason || null };
    }

    // Build the effective rules: either from an 'open' override or from weekly config
    let effectiveRules: any[] = []
    const openOverride = allOverrides?.find((ov: any) => ov.override_type === 'open');

    if (openOverride) {
      // Use the override's custom hours for this specific date
      effectiveRules = [{ 
        start_time: openOverride.start_time, 
        end_time: openOverride.end_time,
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

      if (!rules || rules.length === 0) return { slots: [], isBlocked: false, blockReason: null }
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
      
      // Hourly block overrides for this date
      const hourlyBlocks = allOverrides?.filter((ov: any) => ov.override_type === 'block' && ov.start_time && ov.end_time) || [];

      while (current < endRule) {
        const slotStart = current;
        const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
        
        const startTimeStr = format(slotStart, 'HH:mm:ss');
        const endTimeStr = format(slotEnd, 'HH:mm:ss');
        
        // Check 1: Fits within working hours
        if (slotEnd > endRule) break;

        // Check 2: Not in the past
        if (slotStart < now) {
            current = new Date(current.getTime() + 30 * 60000);
            continue;
        }

        // Check 3: Not during lunch break
        if (rule.lunch_break_start && rule.lunch_break_end) {
          const lStart = rule.lunch_break_start;
          const lEnd = rule.lunch_break_end;
          const overlapLunch = startTimeStr < lEnd && endTimeStr > lStart;
          if (overlapLunch) {
            current = new Date(current.getTime() + 30 * 60000);
            continue;
          }
        }

        // Check 3.5: Not during any specific block override
        const isBlockedByOverride = hourlyBlocks.some((block: any) => {
          return startTimeStr < block.end_time && endTimeStr > block.start_time;
        });

        if (isBlockedByOverride) {
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
          const timeLabel = format(slotStart, 'HH:mm')
          slotSet.add(timeLabel)
        }

        current = new Date(current.getTime() + 30 * 60000);
      }
    }

    const slots = Array.from(slotSet).sort()
    
    // Determine if blocked (either full day or all slots occupied/blocked)
    const hasBlocks = allOverrides?.some((ov: any) => ov.override_type === 'block');
    const firstBlock = allOverrides?.find((ov: any) => ov.override_type === 'block');
    const isBlocked = (slots.length === 0 && hasBlocks);

    return { 
      slots, 
      isBlocked, 
      blockReason: isBlocked ? (firstBlock?.reason || 'Horario bloqueado') : null 
    }
  }

  /**
   * Backward-compatible wrapper: returns only the array of available slot strings.
   * Used by the WhatsApp Bot engine.
   */
  static async getAvailableSlots(supabase: any, params: {
    tenant_id: string;
    professional_id: string;
    date: string; // YYYY-MM-DD
    service_id?: string;
  }) {
    const { slots } = await AppointmentService.getAvailabilityDetails(supabase, params)
    return slots
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
