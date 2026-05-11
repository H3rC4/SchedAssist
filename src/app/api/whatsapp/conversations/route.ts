import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isBotPaused } from '@/lib/whatsapp-bot-state';

export async function GET(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve tenant and role
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

  // Fetch all messages for tenant, ordered by date desc
  const { data: messages, error } = await supabase
    .from('whatsapp_messages')
    .select(`
      id, phone_number, content, direction, sender_type, status, created_at,
      clients(id, first_name, last_name)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[WhatsApp Conversations] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by phone_number (first occurrence = most recent due to ordering)
  const conversationsMap = new Map<string, any>();

  for (const msg of messages || []) {
    const phone = msg.phone_number;
    if (!conversationsMap.has(phone)) {
      const client = (msg as any).clients;
      conversationsMap.set(phone, {
        phone_number: phone,
        client_id: client?.id || null,
        client_name: client
          ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
          : phone,
        last_message: msg.content,
        last_message_at: msg.created_at,
        last_direction: msg.direction,
        last_sender_type: msg.sender_type,
        unread_count: 0,
        bot_paused: false, // will be filled after
      });
    }
    if (msg.direction === 'inbound' && msg.status !== 'read') {
      const conv = conversationsMap.get(phone);
      conv.unread_count++;
    }
  }

  // Check bot paused state for each unique phone (in parallel)
  const phones = Array.from(conversationsMap.keys());
  const pausedStates = await Promise.all(
    phones.map(phone => isBotPaused(supabase as any, tenantId, phone))
  );
  phones.forEach((phone, idx) => {
    const conv = conversationsMap.get(phone);
    if (conv) conv.bot_paused = pausedStates[idx];
  });

  const conversations = Array.from(conversationsMap.values()).sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );

  return NextResponse.json({ conversations });
}
