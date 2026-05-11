import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tuData } = await supabase
    .from('tenant_users')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!tuData) {
    return NextResponse.json({ error: 'No tenant assigned' }, { status: 403 });
  }

  // Only admin and secretary can reactivate the bot
  if (!['tenant_admin', 'secretary'].includes(tuData.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await req.json();
  const { phone } = body;

  if (!phone) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 });
  }

  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id, notes')
      .eq('tenant_id', tuData.tenant_id)
      .eq('phone', phone)
      .maybeSingle();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    let notes: any = {};
    try {
      notes = client.notes ? JSON.parse(client.notes) : {};
    } catch (_) {
      // Corrupt notes: reset to safe state
      notes = { step: 'INITIAL' };
    }

    const wasPaused = notes.manual_takeover === true;
    notes.manual_takeover = false;
    notes.last_interaction = Date.now();

    await supabase
      .from('clients')
      .update({ notes: JSON.stringify(notes) })
      .eq('id', client.id);

    return NextResponse.json({ success: true, wasPaused });
  } catch (err: any) {
    console.error('[WhatsApp Reactivate Bot] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to reactivate bot' }, { status: 500 });
  }
}
