import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAccess } from '@/lib/auth-utils';

// Note: For POST/DELETE where auth admin access is needed, 
// the admin client will be created inside the method after verification.

// GET: List professionals (optionally with their availability rules)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenantId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let query = supabase
    .from('professionals')
    .select(`*, availability_rules(*)`)
    .eq('tenant_id', tenantId)

  if (tuData.role === 'professional') {
    const { data: profData } = await supabase.from('professionals').select('id').eq('user_id', user.id).single();
    if (profData) {
      query = query.eq('id', profData.id);
    }
  }

  const { data, error } = await query.order('full_name')

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

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenant_id, ['admin', 'owner']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Use Service Role client for Auth manipulation
  const { createClient: createAdminClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Generate auth credentials
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const normalizedName = full_name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const auth_email = `dr.${normalizedName}.${randomSuffix}@schedassist.com`;
  const auth_password_hint = Math.random().toString(36).substring(2, 8) + 'X!';

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: auth_email,
    password: auth_password_hint,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 500 })
  }

  const userId = authData.user.id;

  // Insert into tenant_users
  const { error: tuError } = await supabaseAdmin.from('tenant_users').insert({
    tenant_id,
    user_id: userId,
    role: 'professional'
  });

  if (tuError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: `Tenant User Error: ${tuError.message}` }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('professionals')
    .insert([{ 
      tenant_id, 
      full_name, 
      specialty, 
      active: active ?? true,
      user_id: userId,
      auth_email,
      auth_password_hint
    }])
    .select()
    .single()

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(userId); // rollback
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// PATCH: Update availability rules for a professional
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { professional_id, tenant_id, rules } = body

  if (!professional_id || !tenant_id || !rules) {
    return NextResponse.json({ error: 'professional_id, tenant_id, and rules required' }, { status: 400 })
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenant_id);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // If professional, can only edit own rules
  if (access.role === 'professional') {
    const { data: profData } = await supabase.from('professionals').select('id').eq('user_id', user!.id).single();
    if (!profData || profData.id !== professional_id) {
      return NextResponse.json({ error: 'Unauthorized: Can only edit your own rules' }, { status: 403 });
    }
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

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenantId, ['admin', 'owner']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Use admin client for deep cleanup
  const { createClient: createAdminClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // 1. Obtener la data del profesional a eliminar
  const { data: profData } = await supabaseAdmin
    .from('professionals')
    .select('user_id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  // 2. Eliminar reglas de disponibilidad
  await supabaseAdmin.from('availability_rules').delete().eq('professional_id', id).eq('tenant_id', tenantId)
  
  // 3. Eliminar el registro en professionals
  const { data, error } = await supabaseAdmin
    .from('professionals')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 4. Si el profesional tenía una cuenta de usuario, la limpiamos completamente
  if (profData?.user_id) {
    // Eliminar de tenant_users
    await supabaseAdmin.from('tenant_users').delete().eq('user_id', profData.user_id).eq('tenant_id', tenantId)
    // Eliminar en Auth
    await supabaseAdmin.auth.admin.deleteUser(profData.user_id)
  }

  return NextResponse.json(data)
}
