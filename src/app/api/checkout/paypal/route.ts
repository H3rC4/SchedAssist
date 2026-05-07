import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';
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
    const amount = '70.00'; // Precio del plan Pro

    const order = await createPayPalOrder(amount, tenantId);

    if (!order.id) {
      return NextResponse.json({ error: 'Error al crear la orden de PayPal' }, { status: 500 });
    }

    return NextResponse.json({ id: order.id });
  } catch (error: any) {
    console.error('Error in PayPal checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
