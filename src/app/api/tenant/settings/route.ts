import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  try {
    const { tenant_id, settings } = await req.json()
    if (!tenant_id) return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify tenant ownership
    const { data: tuData } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!tuData || (tuData.role !== 'admin' && tuData.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
