import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAccess } from '@/lib/auth-utils';
import { normalizePhone, inferCountryCode } from '@/lib/phone-utils';
import { checkPlanLimit } from '@/lib/plan-limits';
import { createClientSchema } from '@/validation/schemas';

export async function PATCH(req: NextRequest) {
  try {
    const { id, tenant_id, data } = await req.json();

    if (!id || !tenant_id || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const access = await verifyTenantAccess(supabase, user, tenant_id);
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Fetch tenant settings to get country code for phone normalization
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenant_id)
      .single();
    const countryCode = inferCountryCode(tenantData?.settings);

    // Since we use the authenticated client, RLS should apply, but we explicitly enforce tenant_id for extra safety
    const updatePayload: any = {}
    if (data.first_name !== undefined) updatePayload.first_name = data.first_name
    if (data.last_name !== undefined) updatePayload.last_name = data.last_name
    if (data.phone !== undefined) updatePayload.phone = normalizePhone(data.phone, countryCode)
    if (data.email !== undefined) updatePayload.email = data.email
    if (data.notes !== undefined) updatePayload.notes = data.notes
    if (data.allergies !== undefined) updatePayload.allergies = data.allergies
    if (data.address !== undefined) updatePayload.address = data.address
    if (data.dni !== undefined) updatePayload.dni = data.dni
    if (data.birth_date !== undefined) updatePayload.birth_date = data.birth_date
    if (data.gender !== undefined) updatePayload.gender = data.gender
    if (data.occupation !== undefined) updatePayload.occupation = data.occupation

    const result = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, client: result.data });
  } catch (err: any) {
    console.error('[API Clients PATCH] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const {
      tenant_id, first_name, last_name, phone, email, notes, allergies,
      address, dni, birth_date, gender, occupation
    } = parsed.data;

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const access = await verifyTenantAccess(supabase, user, tenant_id);
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Check plan limit for patients
    const limitCheck = await checkPlanLimit(tenant_id, 'patients');
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.error, code: 'PLAN_LIMIT_REACHED' },
        { status: 403 }
      );
    }

    // Fetch tenant settings to get country code for phone normalization
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenant_id)
      .single();
    const countryCode = inferCountryCode(tenantData?.settings);

    const result = await supabase
      .from('clients')
      .insert({
        tenant_id,
        first_name,
        last_name,
        phone: normalizePhone(phone, countryCode),
        email,
        notes,
        allergies,
        address,
        dni,
        birth_date,
        gender,
        occupation
      })
      .select()
      .single();

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, client: result.data });
  } catch (err: any) {
    console.error('[API Clients POST] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
