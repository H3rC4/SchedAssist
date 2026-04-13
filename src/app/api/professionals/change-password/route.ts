import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Actualizamos la contraseña del usuario en Supabase Auth
    // Nota: supabase.auth.updateUser funciona porque el usuario está autenticado
    const { error: updateError } = await supabase.auth.updateUser({ password })
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Ahora borramos el auth_password_hint para marcar que ya no usa contraseña temporal.
    // Lo hacemos con el admin client porque el RLS de professionals podría impedir editar su propio hint
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { error: dbError } = await adminSupabase
      .from('professionals')
      .update({ auth_password_hint: null })
      .eq('user_id', user.id)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
