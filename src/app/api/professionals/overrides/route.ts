import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: list overrides for a professional in a date range
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const professional_id = searchParams.get('professional_id')
  const tenant_id = searchParams.get('tenant_id')
  const from = searchParams.get('from') // YYYY-MM-DD
  const to = searchParams.get('to')     // YYYY-MM-DD

  if (!professional_id || !tenant_id) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  let query = supabase
    .from('professional_availability_overrides')
    .select('*')
    .eq('professional_id', professional_id)
    .eq('tenant_id', tenant_id)
    .order('override_date', { ascending: true })

  if (from) query = query.gte('override_date', from)
  if (to)   query = query.lte('override_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: create an override (optionally detecting conflicting appointments)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { tenant_id, professional_id, override_date, override_type, start_time, end_time, note } = body

  if (!tenant_id || !professional_id || !override_date || !override_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Detect conflicting appointments on this date
  const startOfDay = `${override_date}T00:00:00`
  const endOfDay   = `${override_date}T23:59:59`

  const { data: conflicts } = await supabase
    .from('appointments')
    .select('id, start_at, clients(first_name, last_name)')
    .eq('tenant_id', tenant_id)
    .eq('professional_id', professional_id)
    .neq('status', 'cancelled')
    .neq('status', 'rescheduled')
    .gte('start_at', startOfDay)
    .lte('start_at', endOfDay)

  // Upsert the override (replace if already exists for that date)
  const { data, error } = await supabase
    .from('professional_availability_overrides')
    .upsert({
      tenant_id,
      professional_id,
      override_date,
      override_type,
      start_time: override_type === 'open' ? start_time : null,
      end_time:   override_type === 'open' ? end_time   : null,
      note: note || null,
    }, { onConflict: 'professional_id,override_date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If blocked and there were appointments, mark them needs_rescheduling
  if (override_type === 'block' && conflicts && conflicts.length > 0) {
    const conflictIds = conflicts.map((c: any) => c.id)
    await supabase
      .from('appointments')
      .update({ status: 'needs_rescheduling' })
      .in('id', conflictIds)
  }

  return NextResponse.json({
    override: data,
    conflicts_found: conflicts?.length ?? 0,
    conflicts,
  })
}

// DELETE: remove an override by id
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const tenant_id = searchParams.get('tenant_id')

  if (!id || !tenant_id) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const { error } = await supabase
    .from('professional_availability_overrides')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
