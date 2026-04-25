import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyTenantAccess } from '@/lib/auth-utils'

const getAdmin = () => {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET: List waitlist entries for a tenant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')
  const status = searchParams.get('status') // optional filter

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const access = await verifyTenantAccess(supabase, user, tenantId)
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status })

  let query = getAdmin()
    .from('waitlists')
    .select(`
      *,
      clients(id, first_name, last_name, phone),
      professionals(id, full_name, specialty),
      services(id, name, duration_minutes)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  } else {
    // By default, show non-cancelled/non-resolved entries
    query = query.in('status', ['pending', 'notified'])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: Add a patient to the waitlist
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    tenant_id,
    client_id,
    professional_id,
    service_id,
    preferred_date,  // specific day (optional)
    start_date,      // range start (optional)
    end_date,        // range end (optional)
    notes,
    // Support creating client on-the-fly if no client_id (from bot)
    first_name,
    last_name,
    phone,
  } = body

  if (!tenant_id || !professional_id) {
    return NextResponse.json({ error: 'tenant_id and professional_id required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const access = await verifyTenantAccess(supabase, user, tenant_id)
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status })

  const supabaseAdmin = getAdmin()

  let resolvedClientId = client_id
  // If called from bot, the client might not exist yet
  if (!resolvedClientId && phone) {
    let { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('phone', phone)
      .maybeSingle()

    if (!existingClient) {
      const { data: newClient, error: clientErr } = await supabaseAdmin
        .from('clients')
        .insert([{ tenant_id, first_name, last_name, phone, whatsapp_opt_in: true }])
        .select()
        .single()
      if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 })
      existingClient = newClient
    }
    resolvedClientId = existingClient.id
  }

  if (!resolvedClientId) {
    return NextResponse.json({ error: 'client_id or phone required' }, { status: 400 })
  }

  // Check for existing active entry for the same professional
  const { data: existingEntry } = await supabaseAdmin
    .from('waitlists')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('client_id', resolvedClientId)
    .eq('professional_id', professional_id)
    .in('status', ['pending', 'notified'])
    .maybeSingle()

  if (existingEntry) {
    return NextResponse.json({ error: 'El paciente ya está en la lista de espera para este profesional.', duplicate: true }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('waitlists')
    .insert([{
      tenant_id,
      client_id: resolvedClientId,
      professional_id,
      service_id: service_id || null,
      preferred_date: preferred_date || null,
      start_date: start_date || null,
      end_date: end_date || null,
      notes: notes || null,
      status: 'pending'
    }])
    .select(`
      *,
      clients(id, first_name, last_name, phone),
      professionals(id, full_name),
      services(id, name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Update status of a waitlist entry
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, tenant_id, status } = body

  if (!id || !tenant_id || !status) {
    return NextResponse.json({ error: 'id, tenant_id and status required' }, { status: 400 })
  }

  const validStatuses = ['pending', 'notified', 'resolved', 'cancelled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const access = await verifyTenantAccess(supabase, user, tenant_id)
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status })

  const { data, error } = await getAdmin()
    .from('waitlists')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Remove a waitlist entry
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const tenantId = searchParams.get('tenant_id')

  if (!id || !tenantId) return NextResponse.json({ error: 'id and tenant_id required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const access = await verifyTenantAccess(supabase, user, tenantId)
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status })

  const { error } = await getAdmin()
    .from('waitlists')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
