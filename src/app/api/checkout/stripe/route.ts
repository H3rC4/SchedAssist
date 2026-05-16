import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { PlanTier, BillingCycle } from '@/types';

// Mapeo de plan + ciclo a Stripe Price ID
const STRIPE_PRICE_MAP: Record<PlanTier, Record<BillingCycle, string | undefined>> = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, billing_cycle } = body as { plan: PlanTier; billing_cycle: BillingCycle };

    // Validar plan
    const priceId = STRIPE_PRICE_MAP[plan]?.[billing_cycle];
    if (!priceId || priceId === 'price_placeholder' || priceId.includes('placeholder')) {
      console.error('Missing or invalid Stripe Price ID for plan:', plan, billing_cycle);
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

    // Build origin robustly for Vercel previews and custom domains
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
      console.error('Invalid origin for Stripe checkout:', { origin, host: req.headers.get('host'), env: process.env.NEXT_PUBLIC_SITE_URL });
      return NextResponse.json({ error: 'Configuración de URL del sitio inválida. Contacta soporte.' }, { status: 500 });
    }

    // Crear la sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard/settings/billing?success=true`,
      cancel_url: `${origin}/dashboard/settings/billing?canceled=true`,
      metadata: {
        tenant_id: tenantId,
        plan_tier: plan,
        billing_cycle: billing_cycle,
        gateway: 'stripe',
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Error al crear la sesión de Stripe' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error in checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
