import { NextRequest, NextResponse } from 'next/server';
import { getPayPalAccessToken } from '@/lib/paypal';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headers = req.headers;

    // Verify webhook signature (calling PayPal API)
    const accessToken = await getPayPalAccessToken();
    const verificationResponse = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: headers.get('paypal-transmission-id'),
        transmission_time: headers.get('paypal-transmission-time'),
        cert_url: headers.get('paypal-cert-url'),
        auth_algo: headers.get('paypal-auth-algo'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: body,
      }),
    });

    const verificationData = await verificationResponse.json();

    if (verificationData.verification_status !== 'SUCCESS') {
      console.error('PayPal Webhook verification failed');
      // En entorno de desarrollo podríamos querer procesar igual si no tenemos el WEBHOOK_ID
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const eventType = body.event_type;

    if (eventType === 'CHECKOUT.ORDER.COMPLETED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = body.resource;
      const tenantId = resource.custom_id || (resource.purchase_units && resource.purchase_units[0].custom_id);

      if (tenantId) {
        await supabaseAdmin
          .from('tenants')
          .update({ subscription_status: 'active' })
          .eq('id', tenantId);
        
        console.log(`✅ PayPal Webhook: Tenant ${tenantId} activated.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error in PayPal webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
