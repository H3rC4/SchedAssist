import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: List services for a tenant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: Add a new service
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tenant_id, name, duration_minutes, price, active } = body

  if (!tenant_id || !name || !duration_minutes) {
    return NextResponse.json({ error: 'tenant_id, name and duration_minutes required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('services')
    .insert([{ 
      tenant_id, 
      name, 
      duration_minutes: parseInt(duration_minutes), 
      price, 
      active: active ?? true 
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: Update an existing service
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, tenant_id, name, duration_minutes, price } = body

  if (!id || !tenant_id) {
    return NextResponse.json({ error: 'id and tenant_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('services')
    .update({ name, duration_minutes: parseInt(duration_minutes), price })
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: Remove a service
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const tenantId = searchParams.get('tenant_id')

  if (!id || !tenantId) return NextResponse.json({ error: 'id and tenant_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
