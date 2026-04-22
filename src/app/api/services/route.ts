import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server';

// Removed global admin client for security. Clients are created per request.

// GET: List services for a tenant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify tenant ownership
  const { data: tuData } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).eq('tenant_id', tenantId).single()
  if (!tuData) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify tenant ownership and role (only admin/owner can add services)
  const { data: tuData } = await supabase.from('tenant_users').select('tenant_id, role').eq('user_id', user.id).eq('tenant_id', tenant_id).single()
  if (!tuData || (tuData.role !== 'admin' && tuData.role !== 'owner')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
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

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify tenant ownership and role
  const { data: tuData } = await supabase.from('tenant_users').select('tenant_id, role').eq('user_id', user.id).eq('tenant_id', tenant_id).single()
  if (!tuData || (tuData.role !== 'admin' && tuData.role !== 'owner')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify tenant ownership and role
  const { data: tuData } = await supabase.from('tenant_users').select('tenant_id, role').eq('user_id', user.id).eq('tenant_id', tenantId).single()
  if (!tuData || (tuData.role !== 'admin' && tuData.role !== 'owner')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
