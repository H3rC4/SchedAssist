import { NextRequest, NextResponse } from 'next/server';
import { Payment } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { createClient } from '@supabase/supabase-js';

// Cliente con service role para saltar RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
        }

        // Registrar pago
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            tenant_id: tenantId,
            gateway: 'mercadopago',
            gateway_payment_id: String(paymentId),
            amount: payment.transaction_amount || 0,
            currency: 'ARS',
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

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error in MP webhook:', error);
    return NextResponse.json({ received: true });
  }
}
