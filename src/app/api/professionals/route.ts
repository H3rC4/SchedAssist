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

  // GET THE CALLER TO RESTRICT IF PROFESSIONAL
  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const authClient = createServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  let isProfessional = false;
  let callerProfId = null;

  if (user) {
    const { data: tuData } = await authClient.from('tenant_users').select('role').eq('user_id', user.id).single();
    if (tuData?.role === 'professional') {
      isProfessional = true;
      const { data: profData } = await authClient.from('professionals').select('id').eq('user_id', user.id).single();
      if (profData) callerProfId = profData.id;
    }
  }

  let query = supabase
    .from('professionals')
    .select(`*, availability_rules(*)`)
    .eq('tenant_id', tenantId)

  if (isProfessional && callerProfId) {
    query = query.eq('id', callerProfId);
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

  // Generate auth credentials
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const normalizedName = full_name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const auth_email = `dr.${normalizedName}.${randomSuffix}@schedassist.com`;
  // Generate an 8 char alphanumeric password with a symbol to meet complexity
  const auth_password_hint = Math.random().toString(36).substring(2, 8) + 'X!';

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: auth_email,
    password: auth_password_hint,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 500 })
  }

  const userId = authData.user.id;

  // Insert into tenant_users
  const { error: tuError } = await supabase.from('tenant_users').insert({
    tenant_id,
    user_id: userId,
    role: 'professional'
  });

  if (tuError) {
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: `Tenant User Error: ${tuError.message}` }, { status: 500 })
  }

  const { data, error } = await supabase
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
    await supabase.auth.admin.deleteUser(userId); // rollback
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

  // Auth Check
  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const authClient = createServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (user) {
    const { data: tuData } = await authClient.from('tenant_users').select('role').eq('user_id', user.id).single();
    if (tuData?.role === 'professional') {
      const { data: profData } = await authClient.from('professionals').select('id').eq('user_id', user.id).single();
      if (!profData || profData.id !== professional_id) {
        return NextResponse.json({ error: 'Unauthorized: Can only edit your own rules' }, { status: 403 });
      }
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
