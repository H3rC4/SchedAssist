import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyTenantAccess } from '@/lib/auth-utils'

export async function PATCH(req: Request) {
  try {
    const { tenant_id, settings } = await req.json()
    if (!tenant_id) return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const access = await verifyTenantAccess(supabase, user, tenant_id, ['admin', 'owner']);
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    
    // Get existing settings
    const { data: tenant, error: fetchError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenant_id)
      .single()

    if (fetchError) throw fetchError

    const updatedSettings = {
      ...(tenant.settings || {}),
      ...settings
    }

    const { error: updateError } = await supabase
      .from('tenants')
      .update({ settings: updatedSettings })
      .eq('id', tenant_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, settings: updatedSettings })
  } catch (error: any) {
    console.error('Error updating tenant settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
