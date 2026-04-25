import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Cliente con service role para saltar RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log('--- 🔔 WEBHOOK RECIBIDO ---');
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`❌ Error en Webhook: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Manejar el evento
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const tenantId = session.metadata?.tenant_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription; // <-- guardamos el subscription ID
      
      console.log('📦 DATOS DE SESIÓN:', {
        sessionId: session.id,
        tenantId: tenantId,
        customer: customerId,
        subscription: subscriptionId,
        metadata: session.metadata
      });

      if (!tenantId) {
        console.error('❌ Error: No se encontró tenant_id en los metadatos de la sesión.');
        break;
      }

      // Actualizar tenant en la DB
      const { data, error } = await supabase
        .from('tenants')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
        })
        .eq('id', tenantId)
        .select();

      if (error) {
        console.error(`❌ Error actualizando tenant ${tenantId}:`, error);
      } else if (data && data.length > 0) {
        console.log(`✅ ¡ÉXITO! Tenant ${data[0].name} (ID: ${tenantId}) activado correctamente.`);
      } else {
        console.error(`⚠️ No se encontró ningún tenant con ID ${tenantId} para actualizar.`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;

      // Buscar tenant por customer_id
      const { error } = await supabase
        .from('tenants')
        .update({ subscription_status: 'inactive' })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error(`❌ Error desactivando suscripción para cliente ${customerId}:`, error);
      } else {
        console.log(`📉 Suscripción cancelada para cliente ${customerId}.`);
      }
      break;
    }

    default:
      console.log(`ℹ️ Evento no manejado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
