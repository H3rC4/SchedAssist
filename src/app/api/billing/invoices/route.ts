import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el stripe_customer_id del tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenants(stripe_customer_id, stripe_subscription_id)')
      .eq('user_id', user.id)
      .single();

    const customerId = (tenantUser?.tenants as any)?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json({ invoices: [] });
    }

    // Listar facturas de Stripe
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
    });

    // Formatear las facturas para el frontend
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.number || invoice.id,
      date: new Date(invoice.created * 1000).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      amount: `$${(invoice.total / 100).toFixed(2)}`,
      status: invoice.status,
      pdfUrl: invoice.invoice_pdf,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
