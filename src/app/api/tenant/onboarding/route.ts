import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tenant_id } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Verificar que el usuario pertenece al tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role, tenants(settings)')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: 'Unauthorized for this tenant' }, { status: 403 });
    }

    const currentSettings = (tenantUser.tenants as any)?.settings || {};

    // Actualizar el valor en la base de datos
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        settings: {
          ...currentSettings,
          onboarding_completed: true
        }
      })
      .eq('id', tenant_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
