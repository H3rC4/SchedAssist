import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AppointmentService } from '@/services/appointment.service'
import { MessageService } from '@/services/message.service'
import { verifyTenantAccess } from '@/lib/auth-utils'
import { checkPlanLimit } from '@/lib/plan-limits'
import { format, parseISO } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { translations, dateLocales } from '@/lib/i18n'
import { updateAppointmentNotesSchema } from '@/validation/schemas'

// GET: Fetch appointments with pagination, filtering by date range
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const tenantId = searchParams.get('tenant_id')
  const clientId = searchParams.get('client_id')
  const locationId = searchParams.get('location_id')
  const upcoming = searchParams.get('upcoming') === 'true'
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')
  const supabase = createClient()

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const { data: { user } } = await supabase.auth.getUser();

  // Enforce tenant access for all authenticated reads
  const access = await verifyTenantAccess(supabase, user, tenantId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let callerProfId = null;
  let isProfessional = false;

  if (access.role === 'professional') {
    isProfessional = true;
    const { data: profData } = await supabase.from('professionals').select('id').eq('user_id', user!.id).single();
    if (profData) callerProfId = profData.id;
  }

  // Primero obtener el total (sin paginación)
  let countQuery = supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  // Query con datos
  let query = supabase
    .from('appointments')
    .select(`*, clients(id, first_name, last_name, phone), services(name), professionals(id, full_name)`)
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')
    .order('start_at', { ascending: true })

  if (isProfessional && callerProfId) {
    query = query.eq('professional_id', callerProfId);
    countQuery = countQuery.eq('professional_id', callerProfId);
  }

  if (clientId) {
    query = query.eq('client_id', clientId);
    countQuery = countQuery.eq('client_id', clientId);
  }

  if (locationId) {
    query = query.eq('location_id', locationId);
    countQuery = countQuery.eq('location_id', locationId);
  }

  if (date) {
    // Convert local date boundaries to UTC using tenant timezone
    const { data: tenant } = await supabase.from('tenants').select('timezone').eq('id', tenantId).single();
    const tz = tenant?.timezone || 'UTC';
    const startUtc = fromZonedTime(`${date}T00:00:00`, tz);
    const endUtc = fromZonedTime(`${date}T23:59:59`, tz);
    query = query
      .gte('start_at', startUtc.toISOString())
      .lte('start_at', endUtc.toISOString())
    countQuery = countQuery
      .gte('start_at', startUtc.toISOString())
      .lte('start_at', endUtc.toISOString())
  }

  if (from) {
    query = query.gte('start_at', from)
    countQuery = countQuery.gte('start_at', from)
  }

  if (to) {
    query = query.lte('start_at', to)
    countQuery = countQuery.lte('start_at', to)
  }

  if (upcoming) {
    query = query.gte('start_at', new Date().toISOString());
    countQuery = countQuery.gte('start_at', new Date().toISOString());
  }

  const [{ count: total }, { data, error }] = await Promise.all([
    countQuery,
    query.range(offset, offset + limit - 1)
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: total || 0, page: Math.floor(offset / limit) + 1, limit })
}

// POST: Create a new appointment manually (Refactored to use Service)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tenant_id, first_name, last_name, phone, service_id, professional_id, start_at, end_at, notes, location_id } = body
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser();

  const access = await verifyTenantAccess(supabase, user, tenant_id);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Extra check for professionals (they can only create for themselves)
  if (access.role === 'professional') {
    const { data: profData } = await supabase.from('professionals').select('id').eq('user_id', user!.id).single();
    if (!profData || profData.id !== professional_id) {
      return NextResponse.json({ error: 'Unauthorized: Can only create appointments for yourself' }, { status: 403 });
    }
  }

  // Check plan limit for appointments (counts current month)
  const limitCheck = await checkPlanLimit(tenant_id, 'appointments');
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.error, code: 'PLAN_LIMIT_REACHED' },
      { status: 403 }
    );
  }

  // Create admin client to bypass RLS for now (ensuring we strictly checked tenant_id above)
  const supabaseAdmin = createAdminClient()

  // Normalize names
  const capitalize = (s: string) => (s || '').trim().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  const cleanName = capitalize(first_name)
  const cleanLastName = capitalize(last_name)

  // Note: professional check moved up to access logic
  try {
    // 1. Find or create client
    let { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, phone')
      .eq('tenant_id', tenant_id)
      .eq('phone', phone)
      .maybeSingle()

    if (!client) {
      const { data: newClient, error: clientErr } = await supabaseAdmin
        .from('clients')
        .insert([{ tenant_id, first_name: cleanName, last_name: cleanLastName, phone, whatsapp_opt_in: true }])
        .select()
        .single()
      if (clientErr) throw clientErr
      client = newClient
    }

  // 2. Use service for creation (Includes availability and overlap checks)
    const data = await AppointmentService.createAppointment(supabaseAdmin, {
      tenant_id,
      client_id: client!.id,
      professional_id,
      service_id,
      start_at,
      end_at,
      source: 'dashboard',
      notes: notes || null,
      location_id: location_id || null,
      rescheduled_from_appointment_id: body.rescheduled_from_appointment_id || null
    })

    // If it's a reschedule, mark the original as notified/handled
    if (body.rescheduled_from_appointment_id) {
      await supabaseAdmin
        .from('appointments')
        .update({ 
          cancellation_notified: true,
          cancellation_notified_notes: `Re-agendada automáticamente (Nueva cita: ${data.id})`
        })
        .eq('id', body.rescheduled_from_appointment_id)
    }

    // Fetch tenant settings for language
    const { data: tData } = await supabaseAdmin.from('tenants').select('settings').eq('id', tenant_id).single();
    const lang = (tData?.settings?.language as 'en'|'es'|'it') || 'es';
    const t = translations[lang] || translations['en'];
    const dateLocale = dateLocales[lang] || dateLocales['en'];

    // Determine channel and send confirmation message
    const channel = client!.phone?.startsWith('tg_') ? 'telegram_gastro' : 'whatsapp';
    let chatId: string | number = client!.phone;
    if (client!.phone?.startsWith('tg_')) {
      chatId = parseInt(client!.phone.replace('tg_', ''));
    }
    
    const { data: prof } = await supabase.from('professionals').select('full_name').eq('id', professional_id).single()
    const { data: serv } = await supabase.from('services').select('name').eq('id', service_id).single()
    const dateStr = format(parseISO(start_at), "EEEE d 'HH:mm'", { locale: dateLocale })

    const htmlText = `${t.bot_new_title}\n\n${t.bot_new_desc(cleanName, serv?.name || '', prof?.full_name || '', dateStr)}`;
    const waText = htmlText.replace(/<b>/g, '*').replace(/<\/b>/g, '*');

    await MessageService.sendMessage({
      channel,
      chat_id: chatId,
      tenant_id,
      text: channel === 'whatsapp' ? waText : htmlText,
    });

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: error.message }, { status: error.status || 400 })
  }
}

// DELETE: Cancel an appointment (Refactored to use Service)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const tenantId = searchParams.get('tenant_id') // Should ideally come from auth context
  
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const access = await verifyTenantAccess(supabase, user, tenantId || '');
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (access.role === 'professional') {
      const { data: profData } = await supabase.from('professionals').select('id').eq('user_id', user!.id).single();
      const { data: targetApt } = await supabase.from('appointments').select('professional_id').eq('id', id).single();
      if (!profData || !targetApt || profData.id !== targetApt.professional_id) {
        return NextResponse.json({ error: 'Unauthorized: Can only cancel your own appointments' }, { status: 403 });
      }
    }

    const reason = searchParams.get('reason') || 'Cancelado desde Dashboard'
    const isAdminOverride = searchParams.get('admin_override') === 'true'

    const data = await AppointmentService.cancelAppointment(supabase, {
      appointment_id: id,
      tenant_id: access.tenantId!,
      reason,
      is_admin_override: isAdminOverride
    })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
// PATCH: Update appointment notes (Medical Record Observations)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateAppointmentNotesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { id, tenant_id, notes } = parsed.data;

    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: tuData } = await supabase.from('tenant_users').select('role').eq('user_id', user.id).single();
      if (tuData?.role === 'professional') {
        const { data: profData } = await supabase.from('professionals').select('id').eq('user_id', user.id).single();
        const { data: targetApt } = await supabase.from('appointments').select('professional_id').eq('id', id).single();
        if (!profData || !targetApt || profData.id !== targetApt.professional_id) {
          return NextResponse.json({ error: 'Unauthorized: Can only update your own appointments' }, { status: 403 });
        }
      }
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ notes: notes || null })
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error('Error updating appointment notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
