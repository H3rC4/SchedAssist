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

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
    
    if (!origin || !origin.startsWith('http')) {
      console.error('Invalid origin for Stripe checkout:', origin);
      return NextResponse.json({ error: 'Configuración de URL del sitio inválida' }, { status: 500 });
    }

    // Crear la sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || 'price_placeholder', 
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
