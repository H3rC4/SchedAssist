import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: List professionals (optionally with their availability rules)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('professionals')
    .select(`*, availability_rules(*)`)
    .eq('tenant_id', tenantId)
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: Add a new professional
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tenant_id, full_name, specialty, active } = body

  if (!tenant_id || !full_name) {
    return NextResponse.json({ error: 'tenant_id and full_name required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('professionals')
    .insert([{ tenant_id, full_name, specialty, active: active ?? true }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Update availability rules for a professional
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { professional_id, tenant_id, rules } = body

  if (!professional_id || !tenant_id || !rules) {
    return NextResponse.json({ error: 'professional_id, tenant_id, and rules required' }, { status: 400 })
  }

  // Delete old rules
  await supabase
    .from('availability_rules')
    .delete()
    .eq('professional_id', professional_id)
    .eq('tenant_id', tenant_id)

  const { data, error } = await supabase
    .from('availability_rules')
    .insert(rules.map((r: any) => ({
        tenant_id,
        professional_id,
        day_of_week: r.day_of_week,
        start_time: r.start_time,
        end_time: r.end_time,
        active: r.active,
        lunch_break_start: r.lunch_break_start || null,
        lunch_break_end: r.lunch_break_end || null,
    })))
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Remove a professional
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const tenantId = searchParams.get('tenant_id')

  if (!id || !tenantId) return NextResponse.json({ error: 'id and tenant_id required' }, { status: 400 })

  // Note: Availability rules and appointments should ideally be handled via DB CASCADE.
  // But manual deletion for safety here:
  await supabase.from('availability_rules').delete().eq('professional_id', id).eq('tenant_id', tenantId)
  
  const { data, error } = await supabase
    .from('professionals')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
