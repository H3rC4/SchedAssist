import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTenantAccess } from '@/lib/auth-utils';

/**
 * Mask sensitive token for display
 * Returns last 4 characters only: "***abc123"
 */
function maskToken(token: string): string {
  if (!token || token.length < 4) return '***';
  return `***${token.slice(-4)}`;
}

/**
 * GET /api/settings/whatsapp
 * Returns a list of Whapi accounts for the tenant.
 * Access tokens are masked for security.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const explicitTenantId = searchParams.get('tenant_id');

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const access = await verifyTenantAccess(supabase, user, explicitTenantId || '');
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const tenantId = access.tenantId;

  const { data: accounts, error } = await supabase
    .from('whatsapp_accounts')
    .select('id, phone_number_id, access_token, label')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mask access tokens before sending to client
  const maskedAccounts = (accounts || []).map((acc: any) => ({
    ...acc,
    access_token: acc.access_token ? maskToken(acc.access_token) : null,
  }));

  return NextResponse.json(maskedAccounts);
}

/**
 * POST /api/settings/whatsapp
 * Adds or updates a Whapi account.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone_number_id, access_token, label, tenant_id: explicitTenantId } = body;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, explicitTenantId || '', ['admin', 'owner', 'tenant_admin']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const tenantId = access.tenantId;

  // Use admin client for upsert if needed, but here we can try with authenticated client if RLS allows
  const supabaseAdmin = createAdminClient();

  const result = await supabaseAdmin
    .from('whatsapp_accounts')
    .upsert({
      tenant_id: tenantId,
      phone_number_id: phone_number_id?.trim(),
      access_token: access_token?.trim(),
      label: label?.trim() || 'Principal'
    }, { onConflict: 'phone_number_id' });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/settings/whatsapp
 * Deletes a Whapi account.
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const tenantId = searchParams.get('tenant_id');

  if (!id || !tenantId) return NextResponse.json({ error: 'Missing id or tenant_id' }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const access = await verifyTenantAccess(supabase, user, tenantId, ['admin', 'owner', 'tenant_admin']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { error } = await supabase
    .from('whatsapp_accounts')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
