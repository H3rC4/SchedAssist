import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to allow superadmin to configure any tenant
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/settings/whatsapp
 * Returns a list of Whapi accounts for the tenant.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const explicitTenantId = searchParams.get('tenant_id');

  let tenantId: string | null = explicitTenantId;

  if (!tenantId) {
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const serverSupabase = createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: tenantUser } = await serverSupabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    tenantId = tenantUser.tenant_id;
  }

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
  const { id, phone_number_id, access_token, label, tenant_id: explicitTenantId } = body;

  let tenantId: string | null = explicitTenantId || null;

  if (!tenantId) {
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const serverSupabase = createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: tenantUser } = await serverSupabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    tenantId = tenantUser.tenant_id;
  }

  // Realizamos un Upsert basado en el "phone_number_id" para que el número pueda reasignarse
  // a una clínica diferente sin entrar en conflicto de unicidad.
  const result = await supabase
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

  const { error } = await supabase
    .from('whatsapp_accounts')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
