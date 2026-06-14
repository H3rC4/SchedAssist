import { NextRequest, NextResponse } from 'next/server';
import { Payment, PreApproval } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/services/notification.service';
import { translations, Language } from '@/lib/i18n';
import crypto from 'crypto';

// Cliente con service role para saltar RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify Mercado Pago webhook signature
 * MP sends x-signature header with ts=<timestamp>,v1=<hmac_sha256>
 */
function verifyMercadoPagoSignature(req: NextRequest, body: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  
  if (!secret) {
    console.warn('⚠️ MP_WEBHOOK_SECRET not configured - skipping verification');
    return true; // Allow in development
  }
  
  const signature = req.headers.get('x-signature');
  if (!signature) {
    return false;
  }
  
  // Parse signature: ts=<timestamp>,v1=<hash>
  const parts = signature.split(',');
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
  const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];
  
  if (!ts || !v1) {
    return false;
  }
  
  // Create expected signature: ts:<timestamp>:body:<secret>
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${ts}:${body}`)
    .digest('hex');
  
  // Constant-time comparison
  return v1 === expectedSignature;
}

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Verify signature before processing
    if (!verifyMercadoPagoSignature(req, rawBody)) {
      console.error('❌ Mercado Pago webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const body = JSON.parse(rawBody);
    console.log('--- WEBHOOK MERCADO PAGO RECIBIDO ---', { type: body.type, data: body.data });

    // Mercado Pago envía: { type: 'payment', data: { id: '123' } }
    if (body.type === 'payment' || body.topic === 'payment') {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        console.error('No payment ID in webhook');
        return NextResponse.json({ received: true });
      }

      // Obtener detalles del pago
      const paymentClient = new Payment(mpClient);
      const payment = await paymentClient.get({ id: paymentId });

      console.log('Payment details:', {
        id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
        external_reference: payment.external_reference,
      });

      if (payment.status === 'approved') {
        const tenantId = payment.external_reference;
        
        if (!tenantId) {
          console.error('No external_reference (tenant_id) in payment');
          return NextResponse.json({ received: true });
        }

        // Obtener tenant para saber el plan actual
        const { data: tenant } = await supabase
          .from('tenants')
          .select('plan_tier, billing_cycle')
          .eq('id', tenantId)
          .single();

        if (!tenant) {
          console.error('Tenant not found:', tenantId);
          return NextResponse.json({ received: true });
        }

        // Obtener config del plan
        const { data: planConfig } = await supabase
          .from('plan_configs')
          .select('*')
          .eq('tier', tenant.plan_tier)
          .single();

        // Activar tenant
        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            subscription_status: 'active',
            mp_customer_id: String(payment.payer?.id || ''),
            max_professionals: planConfig?.max_professionals,
            max_services: planConfig?.max_services,
            max_locations: planConfig?.max_locations,
            max_appointments_per_month: planConfig?.max_appointments_per_month,
            max_patients: planConfig?.max_patients,
            custom_domain_enabled: planConfig?.custom_domain_enabled,
            white_label_enabled: planConfig?.white_label_enabled,
            api_access_enabled: planConfig?.api_access_enabled,
            analytics_tier: planConfig?.analytics_tier,
            whatsapp_numbers_limit: planConfig?.whatsapp_numbers_limit,
          })
          .eq('id', tenantId);

        if (updateError) {
          console.error('Error updating tenant:', updateError);
        } else {
          console.log(`Tenant ${tenantId} activated with plan ${tenant.plan_tier}`);

          // Enviar notificación in-app de activación de plan
          try {
            const { data: tenantCfg } = await supabase
              .from('tenants')
              .select('settings')
              .eq('id', tenantId)
              .single();

            const lang: Language = (tenantCfg?.settings?.language as Language) || 'es';
            const t = translations[lang] || translations['es'];

            await NotificationService.createNotification(supabase, {
              tenant_id: tenantId,
              type: 'plan_activated',
              title: t.notification_plan_activated,
              body: t.notify_body_plan_activated(tenant.plan_tier || 'pro', tenant.billing_cycle || 'monthly'),
              metadata: {
                plan_tier: tenant.plan_tier,
                billing_cycle: tenant.billing_cycle,
                mp_payment_id: paymentId,
                mp_payer_id: payment.payer?.id,
              },
            });
          } catch (notifErr: any) {
            console.error('Error enviando notificación de plan activado (MP):', notifErr);
          }
        }

        // Registrar pago
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            tenant_id: tenantId,
            gateway: 'mercadopago',
            gateway_payment_id: String(paymentId),
            amount: payment.transaction_amount || 0,
            currency: (payment.currency_id || 'ARS').toUpperCase(),
            status: 'approved',
            plan_tier: tenant.plan_tier || 'pro',
            billing_cycle: tenant.billing_cycle || 'monthly',
            receipt_url: payment.transaction_details?.external_resource_url,
            metadata: {
              mp_payment_id: paymentId,
              mp_payer_id: payment.payer?.id,
            },
          });

        if (paymentError) {
          console.error('Error recording payment:', paymentError);
        } else {
          console.log(`Payment recorded: $${payment.transaction_amount} ARS`);
        }
      }
    }

    // Manejar cancelaciones de suscripción (preapproval)
    if (body.type === 'preapproval' || body.topic === 'preapproval') {
      const preapprovalId = body.data?.id;

      if (!preapprovalId) {
        console.error('No preapproval ID in webhook');
        return NextResponse.json({ received: true });
      }

      try {
        const preApprovalClient = new PreApproval(mpClient);
        const preapproval = await preApprovalClient.get({ id: preapprovalId });

        console.log('PreApproval details:', {
          id: preapproval.id,
          status: preapproval.status,
          external_reference: preapproval.external_reference,
        });

        if (preapproval.status === 'cancelled') {
          const tenantId = preapproval.external_reference;

          if (!tenantId) {
            console.error('No external_reference (tenant_id) in preapproval');
            return NextResponse.json({ received: true });
          }

          const { error: updateError } = await supabase
            .from('tenants')
            .update({ subscription_status: 'inactive' })
            .eq('id', tenantId);

          if (updateError) {
            console.error('Error updating tenant on MP cancellation:', updateError);
          } else {
            console.log(`Tenant ${tenantId} subscription deactivated (MP cancellation)`);
          }
        }
      } catch (preapprovalErr: any) {
        console.error('Error fetching preapproval details:', preapprovalErr);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error in MP webhook:', error);
    return NextResponse.json({ received: true });
  }
}
