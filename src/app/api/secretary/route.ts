import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTenantAccess } from '@/lib/auth-utils'
import crypto from 'crypto'

// GET: List all secretaries for a tenant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')
  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const access = await verifyTenantAccess(supabase, user, tenantId, ['tenant_admin'])
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status })

  const { data, error } = await supabase
    .from('tenant_users')
    .select('user_id, role, created_at, users:user_id(email)')
    .eq('tenant_id', tenantId)
    .eq('role', 'secretary')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST: Create a new secretary account and link it to the tenant
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tenant_id, full_name, email, phone } = body

  if (!tenant_id || !full_name || !email || !phone) {
    return NextResponse.json({ error: 'tenant_id, full_name, email and phone required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const access = await verifyTenantAccess(supabase, user, tenant_id, ['tenant_admin'])
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status })

  // Use admin client for auth user creation
  const supabaseAdmin = createAdminClient()

  // Generate credentials
  const randomSuffix = crypto.randomBytes(3).toString('hex')
  const normalizedName = full_name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const auth_email = email || `sec.${normalizedName}@schedassist.com`
  const auth_password = randomSuffix + 'Sec!'

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: auth_password,
    email_confirm: true,
    user_metadata: { 
      full_name, 
      role: 'secretary',
      phone: phone
    }
  })

  if (authError) {
    return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 500 })
  }

  const newUserId = authData.user.id

  // Check for existing tenant_users entry (avoid duplicate)
  const { data: existing } = await supabaseAdmin
    .from('tenant_users')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('user_id', newUserId)
    .single()

  if (!existing) {
    const { error: tuError } = await supabaseAdmin.from('tenant_users').insert({
      tenant_id,
      user_id: newUserId,
      role: 'secretary'
    })

    if (tuError) {
      // Cleanup: delete the auth user since tenant_users insert failed
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: `DB Error (tenant_users): ${tuError.message}` }, { status: 500 })
    }

    // Also insert into professionals table so they appear in the staff list
    const { error: profError } = await supabaseAdmin.from('professionals').insert({
      tenant_id,
      user_id: newUserId,
      full_name,
      phone,
      active: true,
      specialty: 'Secretary',
      auth_email: email,
      auth_password_hint: auth_password
    })

    if (profError) {
      // Cleanup
      await supabaseAdmin.from('tenant_users').delete().eq('user_id', newUserId).eq('tenant_id', tenant_id)
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: `DB Error (professionals): ${profError.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: true,
    auth_email,
    auth_password,
    user_id: newUserId
  })
}

// DELETE: Remove a secretary from the tenant (does NOT delete auth user)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')
  const secretaryUserId = searchParams.get('user_id')

  if (!tenantId || !secretaryUserId) {
    return NextResponse.json({ error: 'tenant_id and user_id required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const access = await verifyTenantAccess(supabase, user, tenantId, ['tenant_admin'])
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: access.status })

  // 1. Get professional ID first to cleanup rules
  const { data: prof } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', secretaryUserId)
    .eq('tenant_id', tenantId)
    .single()
  
  if (prof) {
    // Delete availability rules
    await supabase.from('availability_rules').delete().eq('professional_id', prof.id)
  }

  // 2. Delete from professionals table
  await supabase
    .from('professionals')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('user_id', secretaryUserId)

  // 3. Delete from tenant_users
  const { error } = await supabase
    .from('tenant_users')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('user_id', secretaryUserId)
    .eq('role', 'secretary')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
