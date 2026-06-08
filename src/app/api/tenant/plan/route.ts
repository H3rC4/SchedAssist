import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el tenant del usuario con datos del plan
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select(`
        tenant_id,
        tenants(
          id, name, slug, plan_tier, payment_gateway, billing_cycle,
          subscription_status, stripe_customer_id, stripe_subscription_id,
          mp_customer_id, mp_subscription_id,
          max_professionals, max_services, max_locations,
          max_appointments_per_month, max_patients,
          custom_domain_enabled, white_label_enabled, api_access_enabled,
          analytics_tier, whatsapp_numbers_count, whatsapp_numbers_limit,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || !tenantUser.tenants) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const tenant = tenantUser.tenants as any;

    // Obtener config del plan actual
    const { data: planConfig } = await supabase
      .from('plan_configs')
      .select('*')
      .eq('tier', tenant.plan_tier || 'pro')
      .single();

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan_tier: tenant.plan_tier || 'basic',
        payment_gateway: tenant.payment_gateway || 'stripe',
        billing_cycle: tenant.billing_cycle || 'monthly',
        subscription_status: tenant.subscription_status || 'trialing',
      },
      limits: {
        max_professionals: tenant.max_professionals ?? planConfig?.max_professionals ?? 5,
        max_services: tenant.max_services ?? planConfig?.max_services ?? -1,
        max_locations: tenant.max_locations ?? planConfig?.max_locations ?? 2,
        max_appointments_per_month: tenant.max_appointments_per_month ?? planConfig?.max_appointments_per_month ?? -1,
        max_patients: tenant.max_patients ?? planConfig?.max_patients ?? -1,
      },
      features: {
        custom_domain: tenant.custom_domain_enabled ?? planConfig?.custom_domain_enabled ?? false,
        white_label: tenant.white_label_enabled ?? planConfig?.white_label_enabled ?? false,
        api_access: tenant.api_access_enabled ?? planConfig?.api_access_enabled ?? true,
        analytics_tier: tenant.analytics_tier ?? planConfig?.analytics_tier ?? 'advanced',
      },
      whatsapp: {
        count: tenant.whatsapp_numbers_count ?? 1,
        limit: tenant.whatsapp_numbers_limit ?? 1,
      },
    });

  } catch (error: any) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
