import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppointmentService } from '@/services/appointment.service';
import { MessageService } from '@/services/message.service';
import { updateClientState, showMainMenu } from '@/lib/bot/utils';
import { executeStateMachine } from '@/lib/bot/engine';
import { t, Language } from '@/lib/bot/translations';

const CHANNEL = 'telegram';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const message = body.message;
  if (!message) return NextResponse.json({ ok: true });
  if (!message.text && !message.contact) return NextResponse.json({ ok: true });

  const chatId: number = message.chat.id;
  const text: string = message.text || '';
  const phone = `tg_${message.from.id}`;
  const msgLower = text.toLowerCase().trim();

  // ── Resolve Tenant by Telegram token stored in settings ─────────────────────
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, settings')
    .contains('settings', { telegram_token: token })
    .single();

  if (!tenant) {
    console.error('[TELEGRAM BOT] Tenant not found for token');
    return NextResponse.json({ ok: true });
  }

  const lang = (tenant.settings?.language || 'es') as Language;

  // ── Resolve or Create Client ─────────────────────────────────────────────────
  let { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', tenant.id)
    .or(`phone.eq.${phone},notes.ilike.%"telegram_chat_id":${chatId}%`)
    .order('created_at', { ascending: false });

  let client = clients?.[0];
  if (clients && clients.length > 1) {
    const realClient = clients.find((c: any) => !c.phone.startsWith('tg_'));
    if (realClient) client = realClient;
  }

  let isNewClient = false;
  if (!client) {
    isNewClient = true;
    const { data: newClient } = await supabase
      .from('clients')
      .insert([{
        tenant_id: tenant.id,
        phone,
        first_name: 'Usuario',
        last_name: 'Telegram',
        whatsapp_opt_in: true,
        notes: JSON.stringify({ step: 'STARTING', telegram_chat_id: chatId }),
      }])
      .select()
      .single();
    client = newClient;
  }

  let botState: any = { step: 'INITIAL' };
  try { botState = client.notes ? JSON.parse(client.notes) : { step: 'INITIAL' }; } catch (_) {}

  const step = botState.step;

  // ── Special case: contact shared during onboarding ──────────────────────────
  if (message.contact && step === 'WAIT_PHONE') {
    const realPhone = message.contact.phone_number;
    await supabase.from('clients').update({ phone: realPhone }).eq('id', client.id);
    await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, CHANNEL);
    return NextResponse.json({ ok: true });
  }

  const isProfileIncomplete = isNewClient || client.first_name === 'Usuario' || !client.first_name || !client.last_name || client.last_name === 'Telegram';

  const greetWords = [t('greetWords', lang)].flat();
  const isGreeting = msgLower === '/start' || greetWords.includes(msgLower);

  if (isGreeting || step === 'STARTING') {
    if (isProfileIncomplete) {
      await updateClientState(supabase, client.id, { step: 'WAIT_FIRST_NAME' });
      await MessageService.sendMessage({
        channel: CHANNEL,
        chat_id: chatId,
        tenant_id: tenant.id,
        text: t('askPatientName', lang),
        removeKeyboard: true,
      });
    } else {
      await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, CHANNEL);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Redirect to onboarding if profile is still incomplete ───────────────────
  if (isProfileIncomplete && step === 'INITIAL') {
    await updateClientState(supabase, client.id, { step: 'WAIT_FIRST_NAME' });
    await MessageService.sendMessage({
      channel: CHANNEL,
      chat_id: chatId,
      tenant_id: tenant.id,
      text: t('askPatientName', lang),
      removeKeyboard: true,
    });
    return NextResponse.json({ ok: true });
  }

  const keywordsYes = [t('keywordsYes', lang)].flat();
  const keywordsNo = [t('keywordsNo', lang)].flat();

  // ── Appointment reminder: confirm attendance ─────────────────────────────────
  if (keywordsYes.includes(msgLower)) {
    const { data: appToConfirm } = await supabase
      .from('appointments')
      .select('id, start_at, services(name)')
      .eq('tenant_id', tenant.id)
      .eq('client_id', client.id)
      .eq('status', 'awaiting_confirmation')
      .order('start_at', { ascending: true })
      .limit(1)
      .single();

    if (appToConfirm) {
      await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', appToConfirm.id);
      await MessageService.sendMessage({
        channel: CHANNEL,
        chat_id: chatId,
        tenant_id: tenant.id,
        text: t('confirmationSuccess', lang),
        removeKeyboard: true,
      });
      await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, CHANNEL);
      return NextResponse.json({ ok: true });
    }
  }

  // ── Appointment reminder: cancel ─────────────────────────────────────────────
  if (keywordsNo.includes(msgLower)) {
    const { data: appToCancel } = await supabase
      .from('appointments')
      .select('id, start_at, services(name)')
      .eq('tenant_id', tenant.id)
      .eq('client_id', client.id)
      .in('status', ['confirmed', 'awaiting_confirmation'])
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(1)
      .single();

    if (appToCancel) {
      try {
        await AppointmentService.cancelAppointment(supabase, {
          appointment_id: appToCancel.id,
          tenant_id: tenant.id,
          reason: 'Cancelado por usuario vía Telegram',
        });
        await MessageService.sendMessage({
          channel: CHANNEL,
          chat_id: chatId,
          tenant_id: tenant.id,
          text: t('cancellationSuccess', lang),
          removeKeyboard: true,
        });
      } catch (err: any) {
        await MessageService.sendMessage({
          channel: CHANNEL,
          chat_id: chatId,
          tenant_id: tenant.id,
          text: `❌ Error: ${err.message}`,
        });
      }
      await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, CHANNEL);
      return NextResponse.json({ ok: true });
    }
  }

  // ── Main state machine (shared with all tenants and channels) ────────────────
  await executeStateMachine({
    supabase,
    tenant,
    client,
    chatId,
    text,
    msgLower,
    botState,
    channel: CHANNEL,
    message,
  });

  return NextResponse.json({ ok: true });
}
