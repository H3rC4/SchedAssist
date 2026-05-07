import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { createClient } from '@supabase/supabase-js';

// Cliente con service role para saltar RLS y actualizar el tenant
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { orderID } = await req.json();

    if (!orderID) {
      return NextResponse.json({ error: 'Order ID es requerido' }, { status: 400 });
    }

    const captureData = await capturePayPalOrder(orderID);

    if (captureData.status === 'COMPLETED') {
      // Obtener el tenantId de los metadatos (custom_id)
      const tenantId = captureData.purchase_units[0].payments.captures[0].custom_id;

      if (tenantId) {
        // Actualizar el tenant en la base de datos
        const { error } = await supabaseAdmin
          .from('tenants')
          .update({
            subscription_status: 'active',
            // Podríamos guardar el orderID o algo similar para referencia
          })
          .eq('id', tenantId);

        if (error) {
          console.error('Error updating tenant after PayPal capture:', error);
        }
      }

      return NextResponse.json({ status: 'COMPLETED' });
    }

    return NextResponse.json({ error: 'El pago no se pudo completar' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in PayPal capture:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
