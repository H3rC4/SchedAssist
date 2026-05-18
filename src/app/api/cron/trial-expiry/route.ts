import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Cron Job: Trial Expiry Downgrade
 * Runs daily at 06:00 UTC.
 * Finds tenants where trial_ends_at < NOW() and subscription_status = 'trialing'.
 * Downgrades them to 'inactive' and resets limits to basic plan.
 */
export async function GET(req: NextRequest) {
  // ─── 0. Security Check ─────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('--- [CRON] TRIAL EXPIRY CHECK STARTED ---');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  // 1. Find expired trials
  const { data: expiredTenants, error: fetchError } = await supabase
    .from('tenants')
    .select('id, name, settings, plan_tier')
    .lt('trial_ends_at', now)
    .eq('subscription_status', 'trialing');

  if (fetchError) {
    console.error('[Trial Cron] Error fetching expired trials:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!expiredTenants || expiredTenants.length === 0) {
    console.log('[Trial Cron] No expired trials found.');
    return NextResponse.json({ ok: true, processed: 0 });
  }

  console.log(`[Trial Cron] Found ${expiredTenants.length} expired trial(s).`);

  // 2. Get basic plan config for downgrade
  const { data: basicPlan } = await supabase
    .from('plan_configs')
    .select('*')
    .eq('tier', 'basic')
    .single();

  if (!basicPlan) {
    console.error('[Trial Cron] Basic plan config not found. Aborting.');
    return NextResponse.json({ error: 'Basic plan config missing' }, { status: 500 });
  }

  let processed = 0;

  for (const tenant of expiredTenants) {
    try {
      // Downgrade tenant to inactive + basic limits
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          subscription_status: 'inactive',
          plan_tier: 'basic',
          billing_cycle: 'monthly',
          payment_gateway: null,
          max_professionals: basicPlan.max_professionals,
          max_services: basicPlan.max_services,
          max_locations: basicPlan.max_locations,
          max_appointments_per_month: basicPlan.max_appointments_per_month,
          max_patients: basicPlan.max_patients,
          custom_domain_enabled: basicPlan.custom_domain_enabled,
          white_label_enabled: basicPlan.white_label_enabled,
          api_access_enabled: basicPlan.api_access_enabled,
          analytics_tier: basicPlan.analytics_tier,
          whatsapp_numbers_limit: basicPlan.whatsapp_numbers_limit,
        })
        .eq('id', tenant.id);

      if (updateError) {
        console.error(`[Trial Cron] Error downgrading tenant ${tenant.id}:`, updateError);
        continue;
      }

      processed++;
      console.log(`[Trial Cron] Tenant ${tenant.name} (${tenant.id}) downgraded to basic (trial expired).`);

      // TODO: Send in-app notification + WhatsApp (optional, implemented in Step 3/3)

    } catch (err) {
      console.error(`[Trial Cron] Error processing tenant ${tenant.id}:`, err);
    }
  }

  console.log(`--- [CRON] TRIAL EXPIRY CHECK FINISHED. Processed: ${processed}/${expiredTenants.length} ---`);
  return NextResponse.json({ ok: true, processed, total: expiredTenants.length });
}
