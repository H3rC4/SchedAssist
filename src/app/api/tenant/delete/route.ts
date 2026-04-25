import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { verifyTenantAccess } from '@/lib/auth-utils';

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Only tenant admins/owners can delete the account
  const access = await verifyTenantAccess(supabase, user, tenantId, ['admin', 'owner', 'tenant_admin']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    // Use admin client for auth user deletions and data cascade
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get tenant Stripe info BEFORE deleting anything
    const { data: tenant } = await adminClient
      .from('tenants')
      .select('stripe_subscription_id, stripe_customer_id, name')
      .eq('id', tenantId)
      .single();

    // 2. Cancel Stripe subscription (so Stripe stops charging)
    if (tenant?.stripe_subscription_id) {
      try {
        const { stripe } = await import('@/lib/stripe');
        await stripe.subscriptions.cancel(tenant.stripe_subscription_id);
        console.log(`✅ Stripe subscription ${tenant.stripe_subscription_id} cancelled for tenant "${tenant.name}"`);
      } catch (stripeErr: any) {
        // resource_missing = already cancelled/deleted in Stripe → not an error for us
        if (stripeErr?.code !== 'resource_missing') {
          console.error('⚠️ Stripe cancellation error:', stripeErr.message);
          // Non-fatal: we still proceed with local data deletion
        }
      }
    } else if (tenant?.stripe_customer_id) {
      // Fallback: no subscription ID saved yet → look up active subs by customer
      try {
        const { stripe } = await import('@/lib/stripe');
        const subscriptions = await stripe.subscriptions.list({
          customer: tenant.stripe_customer_id,
          status: 'active',
          limit: 10,
        });
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
          console.log(`✅ Cancelled subscription ${sub.id} for Stripe customer ${tenant.stripe_customer_id}`);
        }
      } catch (stripeErr: any) {
        console.error('⚠️ Stripe customer lookup error:', stripeErr.message);
      }
    }

    // 3. Get all professionals with linked auth accounts
    const { data: professionals } = await adminClient
      .from('professionals')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .not('user_id', 'is', null);

    // 4. Delete professional auth users
    if (professionals && professionals.length > 0) {
      for (const prof of professionals) {
        if (prof.user_id) {
          await adminClient.auth.admin.deleteUser(prof.user_id);
        }
      }
    }

    // 5. Delete all tenant data in order (children before parents)
    await adminClient.from('clinical_records').delete().eq('tenant_id', tenantId);
    await adminClient.from('appointments').delete().eq('tenant_id', tenantId);
    await adminClient.from('clients').delete().eq('tenant_id', tenantId);
    await adminClient.from('professionals').delete().eq('tenant_id', tenantId);
    await adminClient.from('services').delete().eq('tenant_id', tenantId);
    await adminClient.from('locations').delete().eq('tenant_id', tenantId);
    await adminClient.from('whatsapp_accounts').delete().eq('tenant_id', tenantId);
    await adminClient.from('tenant_users').delete().eq('tenant_id', tenantId);

    // 6. Delete the tenant itself
    const { error: tenantError } = await adminClient
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (tenantError) throw tenantError;

    // 7. Delete the owner's auth account last
    await adminClient.auth.admin.deleteUser(user!.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
}
