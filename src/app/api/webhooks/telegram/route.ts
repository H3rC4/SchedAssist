import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppointmentService } from '@/services/appointment.service';
import { MessageService } from '@/services/message.service';
import { updateClientState, showMainMenu } from '@/lib/bot/utils';
import { executeStateMachine } from '@/lib/bot/engine';

// The channel identifier for this bot instance.
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

  // ── Resolve Tenant by Telegram token stored in settings ─────────────────────
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, settings')
    .contains('settings', { telegram_token: token })
    .single();

  if (!tenant) {
    console.error('[TELEGRAM BOT] Tenant not found. Verifique el token en la BD y las variables de entorno.');
    return NextResponse.json({ ok: true });
  }

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
  const msgLower = text.toLowerCase().trim();

  // ── Special case: contact shared during onboarding ──────────────────────────
  if (message.contact && step === 'WAIT_PHONE') {
    const realPhone = message.contact.phone_number;
    await supabase.from('clients').update({ phone: realPhone }).eq('id', client.id);
    await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, CHANNEL);
    return NextResponse.json({ ok: true });
  }

  const isProfileIncomplete = isNewClient || client.first_name === 'Usuario' || !client.first_name || !client.last_name || client.last_name === 'Telegram';

  // ── /start and greeting commands ─────────────────────────────────────────────
  if (msgLower === '/start' || msgLower === 'hola' || msgLower === 'reset' || step === 'STARTING') {
    if (isProfileIncomplete) {
      await updateClientState(supabase, client.id, { step: 'WAIT_FIRST_NAME' });
      await MessageService.sendMessage({
        channel: CHANNEL,
        chat_id: chatId,
        tenant_id: tenant.id,
        text: `🏥 ¡Bienvenido a <b>${tenant.name}</b>!\nSoy tu asistente virtual para agendar consultas y estudios.\n\nPara comenzar, necesito registrar tus datos. ¿Cuál es tu <b>Nombre</b>?`,
        removeKeyboard: true,
      });
    } else {
      await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, CHANNEL);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Redirect to onboarding if profile is still incomplete ───────────────────
  const isOnboardingStep = step === 'WAIT_FIRST_NAME' || step === 'WAIT_LAST_NAME' || step === 'WAIT_PHONE';
  if (isProfileIncomplete && !isOnboardingStep) {
    await updateClientState(supabase, client.id, { step: 'WAIT_FIRST_NAME' });
    await MessageService.sendMessage({
      channel: CHANNEL,
      chat_id: chatId,
      tenant_id: tenant.id,
      text: `Hola! Antes de continuar necesito registrar tus datos.\n\n¿Cuál es tu <b>Nombre</b>?`,
      removeKeyboard: true,
    });
    return NextResponse.json({ ok: true });
  }

  // ── Appointment reminder: confirm attendance ─────────────────────────────────
  if (msgLower === '✅ confirmar asistencia') {
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
        text: `✅ ¡Gracias! Tu cita de <b>${(appToConfirm.services as any)?.name}</b> ha sido re-confirmada con éxito.`,
        removeKeyboard: true,
      });
      await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, CHANNEL);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Appointment reminder: cancel ─────────────────────────────────────────────
  if (msgLower === '❌ no podré asistir') {
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
      await updateClientState(supabase, client.id, { step: 'WAIT_CANCEL_SELECTION' });
      try {
        await AppointmentService.cancelAppointment(supabase, {
          appointment_id: appToCancel.id,
          tenant_id: tenant.id,
          reason: 'Cancelado por usuario vía Recordatorio 24h',
        });
        await MessageService.sendMessage({
          channel: CHANNEL,
          chat_id: chatId,
          tenant_id: tenant.id,
          text: `✅ Entendido. Hemos liberado tu turno de <b>${(appToCancel.services as any)?.name}</b>. Esperamos verte pronto.`,
          removeKeyboard: true,
        });
      } catch (err: any) {
        await MessageService.sendMessage({
          channel: CHANNEL,
          chat_id: chatId,
          tenant_id: tenant.id,
          text: `❌ <b>Error:</b> ${err.message}`,
        });
      }
      await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, CHANNEL);
    }
    return NextResponse.json({ ok: true });
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
