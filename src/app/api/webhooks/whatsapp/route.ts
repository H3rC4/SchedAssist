import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executeStateMachine } from '@/lib/bot/engine';
import { normalizePhone, inferCountryCode } from '@/lib/phone-utils';
import crypto from 'crypto';

const GREET_WORDS = ['hola', 'hello', 'ciao', 'buenos', 'buenas', 'reset', 'inicio', 'menu', 'menú', 'empezar', 'start', 'turno', 'cita', 'agendar'];
const TAKEOVER_TIMEOUT_MINUTES = 30;

export async function GET(_req: NextRequest) {
  return new NextResponse('OK', { status: 200 });
}

/**
 * Verify WhatsApp webhook signature (HMAC-SHA256)
 * WhatsApp sends x-hub-signature-256 header with: sha256=<hex_digest>
 */
function verifyWhatsAppSignature(payload: string, signature: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.warn('⚠️ WHATSAPP_APP_SECRET not configured - skipping signature verification');
    return true; // Allow in development, block in production
  }
  
  if (!signature) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  
  const expected = `sha256=${expectedSignature}`;
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export async function POST(req: NextRequest) {
  // Get raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  
  // Verify signature before processing
  if (!verifyWhatsAppSignature(rawBody, signature)) {
    console.error('❌ WhatsApp webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const body = JSON.parse(rawBody);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const message = body.messages?.[0];
  const channelId = body.channel_id;

  // Ignore outbound messages or empty payloads
  if (!message || message.from_me) return NextResponse.json({ ok: true });

  const rawFrom: string = message.from;
  const text: string = message.text?.body;

  if (!text) return NextResponse.json({ ok: true });

  // ── Resolve Tenant from the incoming channel_id ──────────────────────────────
  let { data: waAccount } = await supabase
    .from('whatsapp_accounts')
    .select('tenant_id')
    .eq('phone_number_id', channelId)
    .maybeSingle();

  if (!waAccount) {
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

  // Normalize incoming phone using tenant's inferred country code
  const countryCode = inferCountryCode(tenant.settings);
  const from = normalizePhone(rawFrom, countryCode);

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

  // ── Save inbound message to history ──────────────────────────────────────────
  await supabase.from('whatsapp_messages').insert({
    tenant_id: waAccount.tenant_id,
    client_id: client?.id || null,
    phone_number: from,
    content: text,
    direction: 'inbound',
    sender_type: null,
  });

  // ── Check manual takeover (bot paused by secretary/admin) ────────────────────
  const now = Date.now();
  const lastInteraction = botState.last_interaction || 0;
  const minutesSinceInteraction = (now - lastInteraction) / 60000;
  const isPaused = botState.manual_takeover === true;

  if (isPaused && minutesSinceInteraction < TAKEOVER_TIMEOUT_MINUTES) {
    const msgLower = text.toLowerCase().trim();
    if (!GREET_WORDS.some(w => msgLower.includes(w))) {
      // Bot is paused and message is not a greeting. Update last_interaction and stop.
      botState.last_interaction = now;
      await supabase.from('clients').update({ notes: JSON.stringify(botState) }).eq('id', client.id);
      console.log(`🤖 Bot paused for ${from} (${tenant.name}). Message saved, no auto-response.`);
      return NextResponse.json({ ok: true });
    }
    // Greeting word received while paused -> unpause bot
    botState.manual_takeover = false;
  } else if (isPaused && minutesSinceInteraction >= TAKEOVER_TIMEOUT_MINUTES) {
    // Auto-resume bot after inactivity timeout
    botState.manual_takeover = false;
    console.log(`🤖 Auto-resuming bot for ${from} after ${TAKEOVER_TIMEOUT_MINUTES}min inactivity.`);
  }

  // Update last_interaction before state machine execution
  botState.last_interaction = now;
  await supabase.from('clients').update({ notes: JSON.stringify(botState) }).eq('id', client.id);

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
      message: { text: { body: text }, from: rawFrom },
    });
    console.log(`✅ WhatsApp message processed for ${from} (${tenant.name})`);
  } catch (error) {
    console.error('❌ Error executing bot engine:', error);
  }

  return NextResponse.json({ ok: true });
}
