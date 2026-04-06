import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executeStateMachine } from '@/lib/bot/engine';

export async function GET(_req: NextRequest) {
  return new NextResponse('OK', { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const message = body.messages?.[0];
  const channelId = body.channel_id;

  // Ignore outbound messages or empty payloads
  if (!message || message.from_me) return NextResponse.json({ ok: true });

  const from: string = message.from;
  const text: string = message.text?.body;

  if (!text) return NextResponse.json({ ok: true });

  // ── Resolve Tenant from the incoming channel_id ──────────────────────────────
  let { data: waAccount } = await supabase
    .from('whatsapp_accounts')
    .select('tenant_id')
    .eq('phone_number_id', channelId)
    .maybeSingle();

  if (!waAccount) {
    // Fallback for dev/testing environments where channel_id may not match exactly
    const { data: fallback } = await supabase
      .from('whatsapp_accounts')
      .select('tenant_id')
      .limit(1)
      .maybeSingle();
    waAccount = fallback;
  }

  if (!waAccount) {
    console.error('❌ WhatsApp Webhook: No account found for channel', channelId);
    return NextResponse.json({ ok: true });
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, settings')
    .eq('id', waAccount.tenant_id)
    .single();

  if (!tenant) return NextResponse.json({ ok: true });

  // ── Resolve or Create Client ─────────────────────────────────────────────────
  let { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', waAccount.tenant_id)
    .eq('phone', from)
    .maybeSingle();

  if (!client) {
    const { data: newClient } = await supabase
      .from('clients')
      .insert([{
        tenant_id: waAccount.tenant_id,
        phone: from,
        first_name: 'Usuario',
        last_name: 'WhatsApp',
        whatsapp_opt_in: true,
      }])
      .select()
      .single();
    client = newClient;
  }

  let botState: any = { step: 'INITIAL' };
  try { botState = client.notes ? JSON.parse(client.notes) : { step: 'INITIAL' }; } catch (_) {}

  // ── Execute Bot Engine ───────────────────────────────────────────────────────
  try {
    await executeStateMachine({
      supabase,
      tenant,
      client,
      botState,
      chatId: from,
      text,
      msgLower: text.toLowerCase().trim(),
      sender_phone_id: channelId,
      channel: 'whatsapp',
      message: { text: { body: text }, from },
    });
    console.log(`✅ WhatsApp message processed for ${from} (${tenant.name})`);
  } catch (error) {
    console.error('❌ Error executing bot engine:', error);
  }

  return NextResponse.json({ ok: true });
}
