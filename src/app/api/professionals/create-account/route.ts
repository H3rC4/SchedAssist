import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { professional_id, tenant_id } = await req.json()

    if (!professional_id || !tenant_id) {
      return NextResponse.json({ error: 'professional_id and tenant_id required' }, { status: 400 })
    }

    // 1. Get professional data
    const { data: prof, error: profError } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', professional_id)
      .single()

    if (profError || !prof) return NextResponse.json({ error: 'Professional not found' }, { status: 404 })
    if (prof.user_id) return NextResponse.json({ error: 'Professional already has an account' }, { status: 400 })

    // 2. Generate credentials
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const normalizedName = prof.full_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const auth_email = `dr.${normalizedName}.${randomSuffix}@schedassist.com`;
    const auth_password_hint = Math.random().toString(36).substring(2, 8) + 'X!';

    // 3. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: auth_email,
      password: auth_password_hint,
      email_confirm: true,
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    const userId = authData.user.id;

    // 4. Add to tenant_users
    await supabase.from('tenant_users').insert({
      tenant_id,
      user_id: userId,
      role: 'professional'
    });

    // 5. Update professional record
    const { error: updateError } = await supabase
      .from('professionals')
      .update({
        user_id: userId,
        auth_email,
        auth_password_hint
      })
      .eq('id', professional_id)

    if (updateError) {
        await supabase.auth.admin.deleteUser(userId); // cleanup
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
        success: true, 
        auth_email, 
        auth_password_hint 
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
