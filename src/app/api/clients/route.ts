import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: NextRequest) {
  try {
    const { id, tenant_id, data } = await req.json();

    if (!id || !tenant_id || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Since we use Service Role Key, we MUST enforce the tenant_id explicitly
      const updatePayload: any = {}
      if (data.first_name !== undefined) updatePayload.first_name = data.first_name
      if (data.last_name !== undefined) updatePayload.last_name = data.last_name
      if (data.phone !== undefined) updatePayload.phone = data.phone
      if (data.notes !== undefined) updatePayload.notes = data.notes

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
