import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAccess } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const access = await verifyTenantAccess(supabase, user, tenantId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tenant_id, name, address, city, active } = body

  if (!tenant_id || !name) {
    return NextResponse.json({ error: 'tenant_id and name required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const access = await verifyTenantAccess(supabase, user, tenant_id, ['admin', 'owner', 'tenant_admin']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await supabase
    .from('locations')
    .insert([{ 
      tenant_id, 
      name, 
      address, 
      city, 
      active: active ?? true 
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, tenant_id, name, address, city, active } = body

  if (!id || !tenant_id) {
    return NextResponse.json({ error: 'id and tenant_id required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const access = await verifyTenantAccess(supabase, user, tenant_id, ['admin', 'owner', 'tenant_admin']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await supabase
    .from('locations')
    .update({ name, address, city, active })
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const tenantId = searchParams.get('tenant_id')

  if (!id || !tenantId) return NextResponse.json({ error: 'id and tenant_id required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const access = await verifyTenantAccess(supabase, user, tenantId, ['admin', 'owner', 'tenant_admin']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
