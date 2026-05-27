import { createClient } from '@/lib/supabase/server';

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number;
  error?: string;
}

export async function checkPlanLimit(
  tenantId: string,
  resource: 'professionals' | 'locations' | 'appointments' | 'patients' | 'services'
): Promise<LimitCheckResult> {
  const supabase = createClient();

  // Map resource to column name
  const columnMap: Record<typeof resource, string> = {
    professionals: 'max_professionals',
    locations: 'max_locations',
    appointments: 'max_appointments_per_month',
    patients: 'max_patients',
    services: 'max_services',
  };
  const column = columnMap[resource];

  // 1. Get tenant limits
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select(column)
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenant) {
    return {
      allowed: false,
      current: 0,
      max: 0,
      error: 'Unable to verify plan limits. Please try again.',
    };
  }

  const maxLimit = (tenant as any)[column] ?? -1;

  // -1 means unlimited
  if (maxLimit === -1) {
    return { allowed: true, current: 0, max: -1 };
  }

  // 2. Count current records
  let countQuery = supabase
    .from(resource)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  // For appointments, count only current month
  if (resource === 'appointments') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    countQuery = countQuery.gte('start_at', startOfMonth).lte('start_at', endOfMonth);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    return {
      allowed: false,
      current: 0,
      max: maxLimit,
      error: 'Unable to verify current usage. Please try again.',
    };
  }

  const current = count ?? 0;

  // 3. Check limit
  if (current >= maxLimit) {
    const resourceLabels: Record<typeof resource, string> = {
      professionals: 'professionals',
      locations: 'locations',
      appointments: 'appointments per month',
      patients: 'patients',
      services: 'services',
    };

    return {
      allowed: false,
      current,
      max: maxLimit,
      error: `Plan limit reached: You have reached the maximum of ${maxLimit} ${resourceLabels[resource]} allowed on your current plan.`,
    };
  }

  return { allowed: true, current, max: maxLimit };
}

/**
 * Get all tenant limits in one query
 */
export async function getTenantLimits(tenantId: string) {
  const supabase = createClient();

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select(`
      max_professionals,
      max_services,
      max_locations,
      max_appointments_per_month,
      max_patients,
      plan_tier
    `)
    .eq('id', tenantId)
    .single();

  if (error || !tenant) {
    return null;
  }

  return {
    max_professionals: tenant.max_professionals ?? 5,
    max_services: tenant.max_services ?? -1,
    max_locations: tenant.max_locations ?? 2,
    max_appointments_per_month: tenant.max_appointments_per_month ?? -1,
    max_patients: tenant.max_patients ?? -1,
    plan_tier: tenant.plan_tier ?? 'starter',
  };
}
