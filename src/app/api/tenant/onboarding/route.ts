import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAccess } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tenant_id, language } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Verificar acceso del usuario al tenant
    const access = await verifyTenantAccess(supabase, user, tenant_id);
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Obtener configuración actual
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenant_id)
      .single();

    const currentSettings = tenant?.settings || {};

    // Actualizar el valor en la base de datos, incluyendo el idioma si se proporcionó
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        settings: {
          ...currentSettings,
          onboarding_completed: true,
          lang: language || currentSettings.lang || 'es'
        }
      })
      .eq('id', tenant_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Onboarding API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
