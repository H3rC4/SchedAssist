import { SupabaseClient } from '@supabase/supabase-js';
import { SUPERADMIN_EMAILS } from './constants';

export async function verifyTenantAccess(
  supabase: SupabaseClient, 
  user: any, 
  tenantId: string, 
  requiredRoles: string[] = []
) {
  if (!user) return { authorized: false, error: 'Unauthorized', status: 401 };

  // Superadmin Bypass
  if (SUPERADMIN_EMAILS.includes(user.email || '')) {
    return { authorized: true, isSuperAdmin: true, role: 'superadmin', tenantId };
  }

  // Normal User Check
  const { data: tuData } = await supabase
    .from('tenant_users')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single();

  if (!tuData) {
    return { authorized: false, error: 'Forbidden: No tenant access', status: 403 };
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(tuData.role)) {
    return { authorized: false, error: 'Forbidden: Insufficient permissions', status: 403 };
  }

  return { authorized: true, isSuperAdmin: false, role: tuData.role, tenantId: tuData.tenant_id };
}
