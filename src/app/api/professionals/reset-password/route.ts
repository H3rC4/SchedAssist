import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { professional_id, tenant_id } = await req.json()
    
    if (!professional_id || !tenant_id) {
      return NextResponse.json({ error: 'professional_id and tenant_id are required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validar permisos: el que llama debe ser owner o admin del tenant
    const { data: callerData } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!callerData || (callerData.role !== 'owner' && callerData.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden. Solo administradores pueden restablecer contraseñas.' }, { status: 403 })
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener el user_id del profesional
    const { data: profData, error: profError } = await adminSupabase
      .from('professionals')
      .select('user_id, full_name')
      .eq('id', professional_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (profError || !profData?.user_id) {
      return NextResponse.json({ error: 'No se encontró el usuario del profesional' }, { status: 404 })
    }

    // Generar nueva contraseña temporal: 8 caracteres random + X! para cumplir complejidad
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const newPassword = `${randomSuffix}X!`

    // Forzar cambio en Supabase Auth
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      profData.user_id,
      { password: newPassword }
    )

    if (authError) {
      return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 500 })
    }

    // Actualizar auth_password_hint en tabla professionals
    const { error: dbError } = await adminSupabase
      .from('professionals')
      .update({ auth_password_hint: newPassword })
      .eq('id', professional_id)
      .eq('tenant_id', tenant_id)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, new_password: newPassword })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
