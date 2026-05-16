import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { PlanTier, BillingCycle } from '@/types';

// Cliente con service role para saltar RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log('--- WEBHOOK STRIPE RECIBIDO ---');
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
    console.error(`Error en Webhook Stripe: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const tenantId = session.metadata?.tenant_id;
      const planTier = session.metadata?.plan_tier as PlanTier;
      const billingCycle = session.metadata?.billing_cycle as BillingCycle;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      console.log('Checkout session completed:', {
        sessionId: session.id,
        tenantId,
        planTier,
        billingCycle,
        customer: customerId,
        subscription: subscriptionId,
      });

      if (!tenantId) {
        console.error('Error: No se encontró tenant_id en los metadatos de la sesión.');
        break;
      }

      if (!planTier || !billingCycle) {
        console.error('Error: No se encontró plan_tier o billing_cycle en metadata.');
        break;
      }

      // Obtener config del plan desde plan_configs
      const { data: planConfig, error: planError } = await supabase
        .from('plan_configs')
        .select('*')
        .eq('tier', planTier)
        .single();

      if (planError || !planConfig) {
        console.error(`Error obteniendo config del plan ${planTier}:`, planError);
        break;
      }

      // Actualizar tenant con plan y límites
      const { data: updatedTenant, error: updateError } = await supabase
        .from('tenants')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          plan_tier: planTier,
          billing_cycle: billingCycle,
          payment_gateway: 'stripe',
          max_professionals: planConfig.max_professionals,
          max_services: planConfig.max_services,
          max_locations: planConfig.max_locations,
          max_appointments_per_month: planConfig.max_appointments_per_month,
          max_patients: planConfig.max_patients,
          custom_domain_enabled: planConfig.custom_domain_enabled,
          white_label_enabled: planConfig.white_label_enabled,
          api_access_enabled: planConfig.api_access_enabled,
          analytics_tier: planConfig.analytics_tier,
          whatsapp_numbers_limit: planConfig.whatsapp_numbers_limit,
        })
        .eq('id', tenantId)
        .select();

      if (updateError) {
        console.error(`Error actualizando tenant ${tenantId}:`, updateError);
      } else if (updatedTenant && updatedTenant.length > 0) {
        console.log(`Tenant ${updatedTenant[0].name} (ID: ${tenantId}) activado con plan ${planTier}.`);
      } else {
        console.error(`No se encontró tenant con ID ${tenantId}.`);
      }

      // Registrar pago en tabla payments
      const amount = session.amount_total ? session.amount_total / 100 : 0;
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: tenantId,
          gateway: 'stripe',
          gateway_payment_id: session.payment_intent || session.id,
          amount: amount,
          currency: (session.currency || 'usd').toUpperCase(),
          status: 'approved',
          plan_tier: planTier,
          billing_cycle: billingCycle,
          receipt_url: session.invoice,
          metadata: {
            stripe_session_id: session.id,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
          },
        });

      if (paymentError) {
        console.error(`Error registrando pago:`, paymentError);
      } else {
        console.log(`Pago registrado: $${amount} ${session.currency?.toUpperCase()}`);
      }

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;

      const { error } = await supabase
        .from('tenants')
        .update({ subscription_status: 'inactive' })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error(`Error desactivando suscripción para cliente ${customerId}:`, error);
      } else {
        console.log(`Suscripción cancelada para cliente ${customerId}.`);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;

      // Buscar tenant por subscription_id
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, plan_tier, billing_cycle')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (tenant) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            tenant_id: tenant.id,
            gateway: 'stripe',
            gateway_payment_id: invoice.payment_intent || invoice.id,
            amount: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
            currency: (invoice.currency || 'usd').toUpperCase(),
            status: 'approved',
            plan_tier: tenant.plan_tier || 'pro',
            billing_cycle: tenant.billing_cycle || 'monthly',
            billing_period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            billing_period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            receipt_url: invoice.hosted_invoice_url,
            metadata: {
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: subscriptionId,
            },
          });

        if (paymentError) {
          console.error(`Error registrando pago recurrente:`, paymentError);
        } else {
          console.log(`Pago recurrente registrado para tenant ${tenant.id}`);
        }
      }
      break;
    }

    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
