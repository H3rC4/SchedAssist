import { NextRequest, NextResponse } from 'next/server';
import { PreApproval } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { createClient } from '@/lib/supabase/server';
import { PlanTier, BillingCycle } from '@/types';

// Mapeo de plan + ciclo a Mercado Pago Plan ID
const MP_PLAN_MAP: Record<PlanTier, Record<BillingCycle, string | undefined>> = {
  basic: {
    monthly: process.env.MP_PLAN_BASIC_MONTHLY,
    yearly: process.env.MP_PLAN_BASIC_YEARLY,
  },
  pro: {
    monthly: process.env.MP_PLAN_PRO_MONTHLY,
    yearly: process.env.MP_PLAN_PRO_YEARLY,
  },
  premium: {
    monthly: process.env.MP_PLAN_PREMIUM_MONTHLY,
    yearly: process.env.MP_PLAN_PREMIUM_YEARLY,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, billing_cycle, payer_email } = body as { 
      plan: PlanTier; 
      billing_cycle: BillingCycle;
      payer_email: string;
    };

    // Validar plan
    const planId = MP_PLAN_MAP[plan]?.[billing_cycle];
    if (!planId || planId.includes('placeholder')) {
      console.error('Missing or invalid Mercado Pago Plan ID for plan:', plan, billing_cycle);
      return NextResponse.json({ error: 'Plan no configurado correctamente. Contacta soporte.' }, { status: 500 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el tenant_id del usuario
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const tenantId = tenantUser.tenant_id;

    // Validar que el tenant sea de Argentina / español
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    const tenantSettings = tenant?.settings || {};
    const isArgentina = tenantSettings.default_country_code === '+54';
    const isSpanish = tenantSettings.language === 'es';

    if (!isArgentina && !isSpanish) {
      return NextResponse.json(
        { error: 'Mercado Pago solo está disponible para usuarios de Argentina.' },
        { status: 400 }
      );
    }

    // Build origin
    let origin = req.headers.get('origin') || '';
    if (!origin) {
      const host = req.headers.get('host') || '';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      origin = host ? `${protocol}://${host}` : '';
    }
    if (!origin && process.env.NEXT_PUBLIC_SITE_URL) {
      origin = process.env.NEXT_PUBLIC_SITE_URL;
    }

    if (!origin || !origin.startsWith('http')) {
      return NextResponse.json({ error: 'Configuración de URL inválida.' }, { status: 500 });
    }

    // Crear preapproval (suscripción) en Mercado Pago
    const preApproval = new PreApproval(mpClient);
    
    const subscription = await preApproval.create({
      body: {
        preapproval_plan_id: planId,
        payer_email: payer_email || user.email,
        external_reference: tenantId,
        back_url: `${origin}/dashboard/settings/billing?mp_success=true`,
        status: 'pending',
      }
    });

    if (!subscription.init_point) {
      return NextResponse.json({ error: 'Error al crear suscripción de Mercado Pago' }, { status: 500 });
    }

    // Guardar mp_subscription_id temporalmente
    await supabase
      .from('tenants')
      .update({
        mp_subscription_id: subscription.id,
        mp_plan_id: planId,
        plan_tier: plan,
        billing_cycle,
        payment_gateway: 'mercadopago',
        subscription_status: 'pending',
      })
      .eq('id', tenantId);

    return NextResponse.json({ 
      url: subscription.init_point,
      subscription_id: subscription.id 
    });

  } catch (error: any) {
    console.error('Error in MP checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
