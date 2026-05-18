import { NextRequest, NextResponse } from 'next/server';
import { PreApproval } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/billing/cancel-mp
 * Cancela una suscripción de Mercado Pago para el tenant autenticado.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener tenant del usuario
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const tenantId = tenantUser.tenant_id;

    // Obtener datos del tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('mp_subscription_id, payment_gateway')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    if (tenant.payment_gateway !== 'mercadopago') {
      return NextResponse.json(
        { error: 'El tenant no usa Mercado Pago como gateway de pago.' },
        { status: 400 }
      );
    }

    if (!tenant.mp_subscription_id) {
      return NextResponse.json(
        { error: 'No hay una suscripción de Mercado Pago activa para cancelar.' },
        { status: 400 }
      );
    }

    // Cancelar la suscripción en Mercado Pago
    const preApproval = new PreApproval(mpClient);
    await preApproval.update({
      id: tenant.mp_subscription_id,
      body: { status: 'cancelled' },
    });

    // Actualizar el tenant localmente
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ subscription_status: 'inactive' })
      .eq('id', tenantId);

    if (updateError) {
      console.error('Error updating tenant after MP cancellation:', updateError);
      return NextResponse.json(
        { error: 'La suscripción se canceló en Mercado Pago, pero hubo un error actualizando el estado local.' },
        { status: 500 }
      );
    }

    console.log(`MP subscription ${tenant.mp_subscription_id} cancelled for tenant ${tenantId}`);

    return NextResponse.json({ success: true, message: 'Suscripción cancelada correctamente.' });
  } catch (error: any) {
    console.error('Error in cancel-mp:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
