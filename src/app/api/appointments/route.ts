import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AppointmentService } from '@/services/appointment.service'
import { MessageService } from '@/services/message.service'
import { verifyTenantAccess } from '@/lib/auth-utils'
import { format, parseISO } from 'date-fns'
import { translations, dateLocales } from '@/lib/i18n'

// GET: Fetch appointments for a specific date & tenant (Keep direct for listing)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const tenantId = searchParams.get('tenant_id')
  const supabase = createClient()

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const { data: { user } } = await supabase.auth.getUser();
  let callerProfId = null;
  let isProfessional = false;

  if (user) {
    const { data: tuData } = await supabase.from('tenant_users').select('role').eq('user_id', user.id).single();
    if (tuData?.role === 'professional') {
      isProfessional = true;
      const { data: profData } = await supabase.from('professionals').select('id').eq('user_id', user.id).single();
      if (profData) callerProfId = profData.id;
    }
  }

  let query = supabase
    .from('appointments')
    .select(`*, clients(id, first_name, last_name, phone), services(name), professionals(id, full_name)`)
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')
    .order('start_at', { ascending: true })

  if (isProfessional && callerProfId) {
    query = query.eq('professional_id', callerProfId);
  }

  if (date) {
    query = query
      .gte('start_at', `${date}T00:00:00Z`)
      .lte('start_at', `${date}T23:59:59Z`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: Create a new appointment manually (Refactored to use Service)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tenant_id, first_name, last_name, phone, service_id, professional_id, start_at, end_at, notes } = body
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

  // Create admin client to bypass RLS for now (ensuring we strictly checked tenant_id above)
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Normalize names
  const capitalize = (s: string) => (s || '').trim().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  const cleanName = capitalize(first_name)
  const cleanLastName = capitalize(last_name)

  // Note: professional check moved up to access logic
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
      notes: notes || null
    })

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

    const data = await AppointmentService.cancelAppointment(supabase, {
      appointment_id: id,
      tenant_id: access.tenantId!,
      reason: 'Cancelado desde Dashboard',
      is_admin_override: true 
    })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
// PATCH: Update appointment notes (Medical Record Observations)
export async function PATCH(req: NextRequest) {
  try {
    const { id, tenant_id, notes } = await req.json();

    if (!id || !tenant_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
