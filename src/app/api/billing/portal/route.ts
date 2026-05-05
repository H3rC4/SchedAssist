import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el stripe_customer_id del tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenants(stripe_customer_id)')
      .eq('user_id', user.id)
      .single();

    const customerId = (tenantUser?.tenants as any)?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json({ error: 'No se encontró suscripción activa para este cliente.' }, { status: 404 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
    
    // Crear la sesión del portal de Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error in portal session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
