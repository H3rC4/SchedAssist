import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MessageService } from '@/services/message.service';
import { normalizePhone, inferCountryCode } from '@/lib/phone-utils';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const rawPhone = searchParams.get('phone');

  if (!rawPhone) {
    return NextResponse.json({ error: 'phone parameter required' }, { status: 400 });
  }

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

  const tenantId = tuData.tenant_id;

  // Fetch tenant settings for country code normalization
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single();
  const countryCode = inferCountryCode(tenantData?.settings);
  const phone = normalizePhone(rawPhone, countryCode);

  // Fetch messages for this conversation
  const { data: messages, error } = await supabase
    .from('whatsapp_messages')
    .select(`
      id, content, direction, sender_type, status, created_at,
      clients(id, first_name, last_name)
    `)
    .eq('tenant_id', tenantId)
    .eq('phone_number', phone)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[WhatsApp Messages GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark inbound messages as read (fire-and-forget)
  void supabase
    .from('whatsapp_messages')
    .update({ status: 'read' })
    .eq('tenant_id', tenantId)
    .eq('phone_number', phone)
    .eq('direction', 'inbound')
    .neq('status', 'read');

  return NextResponse.json({ messages });
}

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

  const tenantId = tuData.tenant_id;

  // Only admin and secretary can send manual messages
  if (!['tenant_admin', 'secretary'].includes(tuData.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await req.json();
  const { phone: rawPhone, text } = body;

  if (!rawPhone || !text?.trim()) {
    return NextResponse.json({ error: 'phone and text are required' }, { status: 400 });
  }

  // Fetch tenant settings for country code normalization
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single();
  const countryCode = inferCountryCode(tenantData?.settings);
  const phone = normalizePhone(rawPhone, countryCode);

  try {
    // Get sender_phone_id for this tenant
    const { data: waAccount } = await supabase
      .from('whatsapp_accounts')
      .select('phone_number_id')
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle();

    // Send message via WhatsApp
    await MessageService.sendManualMessage({
      tenant_id: tenantId,
      sender_phone_id: waAccount?.phone_number_id || undefined,
      chat_id: phone,
      text: text.trim(),
    });

    // Pause bot for this client (manual takeover)
    const { data: client } = await supabase
      .from('clients')
      .select('id, notes')
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
      .maybeSingle();

    if (client) {
      let notes: any = {};
      try { notes = client.notes ? JSON.parse(client.notes) : {}; } catch (_) {}
      notes.manual_takeover = true;
      notes.last_interaction = Date.now();
      await supabase.from('clients').update({ notes: JSON.stringify(notes) }).eq('id', client.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[WhatsApp Messages POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send message' }, { status: 500 });
  }
}
