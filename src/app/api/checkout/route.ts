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

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId || priceId === 'price_placeholder') {
      console.error('Missing STRIPE_PRICE_ID env variable');
      return NextResponse.json({ error: 'Precio de suscripción no configurado. Contacta soporte.' }, { status: 500 });
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
      success_url: `${origin}/dashboard/whatsapp?success=true`,
      cancel_url: `${origin}/dashboard/whatsapp?canceled=true`,
      metadata: {
        tenant_id: tenantId,
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
