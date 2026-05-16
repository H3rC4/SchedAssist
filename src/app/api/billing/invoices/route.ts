import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el tenant del usuario
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ invoices: [] });
    }

    const tenantId = tenantUser.tenant_id;

    // Obtener pagos de la tabla payments (universal, ambos gateways)
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    // Formatear las facturas para el frontend
    const formattedInvoices = (payments || []).map((payment: any) => ({
      id: payment.id.substring(0, 8),
      gateway: payment.gateway,
      date: new Date(payment.created_at).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      amount: payment.currency === 'ARS' 
        ? `$${payment.amount.toLocaleString('es-AR')}`
        : `$${payment.amount.toFixed(2)}`,
      currency: payment.currency,
      status: payment.status,
      plan: payment.plan_tier,
      cycle: payment.billing_cycle,
      receiptUrl: payment.receipt_url,
      periodStart: payment.billing_period_start 
        ? new Date(payment.billing_period_start).toLocaleDateString('it-IT') 
        : null,
      periodEnd: payment.billing_period_end 
        ? new Date(payment.billing_period_end).toLocaleDateString('it-IT') 
        : null,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
