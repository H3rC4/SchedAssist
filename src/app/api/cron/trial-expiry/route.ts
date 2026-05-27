import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Cron Job: Trial Expiry + Data Cleanup
 * Runs daily at 06:00 UTC.
 * 
 * Flow:
 * 1. Trial expires → grace period of 3 days (tenant still active but banner shows)
 * 2. Grace period ends → subscription_status = 'inactive' (blocked from dashboard)
 * 3. 30 days after inactivation → delete all tenant data and auth user
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

  const now = new Date();
  const nowISO = now.toISOString();

  // ─── 1. Grace Period Check ────────────────────────────────────────────────
  // Find tenants where trial_ends_at < NOW() but still 'trial' status (in grace period)
  const gracePeriodEnd = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: graceTenants, error: graceError } = await supabase
    .from('tenants')
    .select('id, name')
    .lt('trial_ends_at', nowISO)
    .eq('subscription_status', 'trial');

  if (graceError) {
    console.error('[Trial Cron] Error fetching grace period tenants:', graceError);
    return NextResponse.json({ error: graceError.message }, { status: 500 });
  }

  // Mark as inactive if grace period expired (trial_ends_at + 3 days < now)
  for (const tenant of graceTenants || []) {
    try {
      // Check if grace period truly expired
      const trialEndDate = new Date(tenant.trial_ends_at);
      const graceDeadline = new Date(trialEndDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      if (now >= graceDeadline) {
        // Get basic plan config for downgrade
        const { data: basicPlan } = await supabase
          .from('plan_configs')
          .select('*')
          .eq('tier', 'basic')
          .single();

        if (basicPlan) {
          await supabase
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

          console.log(`[Trial Cron] Tenant ${tenant.name} (${tenant.id}) grace period ended → inactive`);
        }
      }
    } catch (err) {
      console.error(`[Trial Cron] Error processing grace tenant ${tenant.id}:`, err);
    }
  }

  // ─── 2. Data Cleanup Check ────────────────────────────────────────────────
  // Find tenants that have been inactive for 30+ days and delete them
  const cleanupCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: cleanupTenants, error: cleanupError } = await supabase
    .from('tenants')
    .select('id, name, trial_ends_at')
    .eq('subscription_status', 'inactive')
    .lt('updated_at', cleanupCutoff);

  if (cleanupError) {
    console.error('[Trial Cron] Error fetching cleanup tenants:', cleanupError);
    return NextResponse.json({ error: cleanupError.message }, { status: 500 });
  }

  let cleanedUp = 0;

  for (const tenant of cleanupTenants || []) {
    try {
      console.log(`[Trial Cron] Cleaning up tenant ${tenant.name} (${tenant.id}) - inactive for 30+ days`);

      // Get all professionals for this tenant (to find auth user IDs)
      const { data: professionals } = await supabase
        .from('professionals')
        .select('user_id')
        .eq('tenant_id', tenant.id);

      const authUserIds = (professionals || [])
        .map(p => p.user_id)
        .filter(Boolean);

      // Delete in correct order (respecting foreign keys)
      await supabase.from('clinical_records').delete().eq('tenant_id', tenant.id);
      await supabase.from('appointments').delete().eq('tenant_id', tenant.id);
      await supabase.from('clients').delete().eq('tenant_id', tenant.id);
      await supabase.from('availability_overrides').delete().eq('tenant_id', tenant.id);
      await supabase.from('availability_rules').delete().eq('tenant_id', tenant.id);
      await supabase.from('professionals').delete().eq('tenant_id', tenant.id);
      await supabase.from('services').delete().eq('tenant_id', tenant.id);
      await supabase.from('locations').delete().eq('tenant_id', tenant.id);
      await supabase.from('whatsapp_accounts').delete().eq('tenant_id', tenant.id);
      await supabase.from('tenant_users').delete().eq('tenant_id', tenant.id);
      await supabase.from('tenants').delete().eq('id', tenant.id);

      // Delete auth users
      for (const userId of authUserIds) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (e) {
          console.log(`[Trial Cron] Could not delete auth user ${userId}:`, e);
        }
      }

      cleanedUp++;
      console.log(`[Trial Cron] Tenant ${tenant.name} fully cleaned up.`);
    } catch (err) {
      console.error(`[Trial Cron] Error cleaning up tenant ${tenant.id}:`, err);
    }
  }

  console.log(`--- [CRON] TRIAL EXPIRY CHECK FINISHED. Grace: ${graceTenants?.length || 0}, Cleaned up: ${cleanedUp} ---`);
  return NextResponse.json({ 
    ok: true, 
    gracePeriodProcessed: graceTenants?.length || 0, 
    cleanedUp 
  });
}