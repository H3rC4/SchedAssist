import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTenantAccess } from '@/lib/auth-utils';
import { checkPlanLimit } from '@/lib/plan-limits';
import crypto from 'crypto';

// Note: For POST/DELETE where auth admin access is needed, 
// the admin client will be created inside the method after verification.

// GET: List professionals (optionally with their availability rules)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const access = await verifyTenantAccess(supabase, user, tenantId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let query = supabase
    .from('professionals')
    .select(`*, availability_rules(*)`)
    .eq('tenant_id', tenantId)

  if (access.role === 'professional') {
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
  const { tenant_id, full_name, specialty, email, phone, active, location_id } = body

  if (!tenant_id || !full_name || !email) {
    return NextResponse.json({ error: 'tenant_id, full_name and email required' }, { status: 400 })
  }

  const supabase = createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const access = await verifyTenantAccess(supabase, currentUser, tenant_id, ['admin', 'owner', 'tenant_admin']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Check plan limit for professionals
  const limitCheck = await checkPlanLimit(tenant_id, 'professionals');
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.error, code: 'PLAN_LIMIT_REACHED' },
      { status: 403 }
    );
  }

  // Use Service Role client for Auth manipulation
  const supabaseAdmin = createAdminClient();

  // 1. Check if professional record already exists for this tenant and email
  const { data: existingProf } = await supabaseAdmin
    .from('professionals')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('auth_email', email)
    .single();

  if (existingProf) {
    return NextResponse.json(existingProf, { status: 200 });
  }

  let userId;
  let auth_password_hint: string | null = null;

  // 2. Try to create user in Supabase Auth
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  const tempPassword = randomSuffix + 'X!';

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name,
      phone,
      role: 'professional'
    }
  });

  if (authError) {
    // If user already exists, we find their ID
    if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already exists')) {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) return NextResponse.json({ error: `List Users Error: ${listError.message}` }, { status: 500 });
      
      const existingUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existingUser) {
        return NextResponse.json({ error: 'User conflict detected but user could not be retrieved.' }, { status: 500 });
      }
      userId = existingUser.id;
    } else {
      return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 500 });
    }
  } else {
    userId = authData.user.id;
    auth_password_hint = tempPassword;
  }

  // 3. Insert into tenant_users (if not already there)
  const { data: existingTU } = await supabaseAdmin
    .from('tenant_users')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('user_id', userId)
    .single();

  if (!existingTU) {
    const { error: tuError } = await supabaseAdmin.from('tenant_users').insert({
      tenant_id,
      user_id: userId,
      role: 'professional'
    });

    if (tuError) {
      // If we created the user just now, maybe we should cleanup? 
      // But if they existed, we definitely shouldn't.
      return NextResponse.json({ error: `Tenant User Error: ${tuError.message}` }, { status: 500 });
    }
  }

  // 4. Finally insert into professionals record
  const { data: newProf, error: profError } = await supabaseAdmin
    .from('professionals')
    .insert([{ 
      tenant_id, 
      full_name, 
      specialty, 
      phone,
      location_id,
      active: active ?? true,
      user_id: userId,
      auth_email: email,
      auth_password_hint
    }])
    .select()
    .single()

  if (profError) {
    return NextResponse.json({ error: profError.message }, { status: 500 })
  }

  return NextResponse.json(newProf, { status: 201 })
}


// PATCH: Update professional info or availability rules
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, professional_id, tenant_id, rules, ...generalInfo } = body
  const targetId = id || professional_id

  if (!targetId || !tenant_id) {
    return NextResponse.json({ error: 'id and tenant_id required' }, { status: 400 })
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenant_id);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Use admin client for rules operations to bypass RLS
  const supabaseAdmin = createAdminClient();

  // If professional, can only edit own data
  if (access.role === 'professional') {
    const { data: profData } = await supabase.from('professionals').select('id').eq('user_id', user!.id).single();
    if (!profData || profData.id !== targetId) {
      return NextResponse.json({ error: 'Unauthorized: Can only edit your own data' }, { status: 403 });
    }
  }

  // 1. Update general info if present
  if (Object.keys(generalInfo).length > 0) {
    const { error: genError } = await supabaseAdmin
      .from('professionals')
      .update(generalInfo)
      .eq('id', targetId)
      .eq('tenant_id', tenant_id)
    
    if (genError) return NextResponse.json({ error: genError.message }, { status: 500 })
  }

  // 2. Update rules if present
  if (rules) {
    // Delete old rules
    await supabaseAdmin
      .from('availability_rules')
      .delete()
      .eq('professional_id', targetId)
      .eq('tenant_id', tenant_id)

    const { data: rulesData, error: rulesError } = await supabaseAdmin
      .from('availability_rules')
      .insert(rules.map((r: any) => ({
          tenant_id,
          professional_id: targetId,
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
          active: r.active,
          lunch_break_start: r.lunch_break_start || null,
          lunch_break_end: r.lunch_break_end || null,
      })))
      .select()
    
    if (rulesError) return NextResponse.json({ error: rulesError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE: Remove a professional
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const tenantId = searchParams.get('tenant_id')

  if (!id || !tenantId) return NextResponse.json({ error: 'id and tenant_id required' }, { status: 400 })

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenantId, ['admin', 'owner', 'tenant_admin']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Use admin client for deep cleanup
  const supabaseAdmin = createAdminClient();

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
