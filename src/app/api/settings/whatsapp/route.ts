import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAccess } from '@/lib/auth-utils';

/**
 * GET /api/settings/whatsapp
 * Returns a list of Whapi accounts for the tenant.
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

  return NextResponse.json(accounts || []);
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
  
  const access = await verifyTenantAccess(supabase, user, explicitTenantId || '', ['admin', 'owner']);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const tenantId = access.tenantId;

  // Use admin client for upsert if needed, but here we can try with authenticated client if RLS allows
  const { createClient: createAdminClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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
  
  const access = await verifyTenantAccess(supabase, user, tenantId, ['admin', 'owner']);
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
