import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addHours, format, parseISO } from 'date-fns';
import { translations, dateLocales } from '@/lib/i18n';
import { MessageService } from '@/services/message.service';

/**
 * Vercel Cron Job: Envía recordatorios de citas próximas (24hs antes).
 * Se ejecuta diariamente según la configuración de vercel.json.
 */
export async function GET(req: NextRequest) {
  // ─── 0. Verificación de Seguridad para Vercel Cron ──────────────────────────
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('--- [CRON] BUSCANDO CITAS PARA RECORDATORIOS (24hs) ---');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const rangeStart = addHours(now, 23).toISOString();
  const rangeEnd = addHours(now, 26).toISOString();

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      status,
      start_at,
      tenant_id,
      tenants (id, name, settings),
      clients (id, first_name, phone, notes),
      services (name)
    `)
    .eq('status', 'confirmed')
    .gte('start_at', rangeStart)
    .lte('start_at', rangeEnd);

  if (error) {
    console.error('Error al consultar citas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!appointments || appointments.length === 0) {
    console.log('No se encontraron citas confirmadas en este rango.');
    return NextResponse.json({ ok: true, count: 0 });
  }

  console.log(`Se encontraron ${appointments.length} citas.`);

  // Group by client to send a single consolidated message per person
  const groupedApps = new Map<string, typeof appointments>();
  for (const app of appointments) {
    const client: any = app.clients;
    if (!client) continue;
    
    const key = `${app.tenant_id}_${client.id}`;
    if (!groupedApps.has(key)) groupedApps.set(key, []);
    groupedApps.get(key)!.push(app);
  }

  let sentCount = 0;

  for (const [_, apps] of Array.from(groupedApps.entries())) {
    try {
      const client: any = apps[0].clients;
      const tenant: any = apps[0].tenants;
      const tenantId = apps[0].tenant_id;
      const lang = (tenant.settings?.language as 'en'|'es'|'it') || 'es';
      const t = translations[lang] || translations['en'];
      const dateLocale = dateLocales[lang] || dateLocales['en'];

      // ── Determine channel ─────────────────────────────────────────────────
      let channel = 'whatsapp';
      let chatId: string | number = client.phone; 

      if (client.phone.startsWith('tg_')) {
        channel = 'telegram_gastro'; // TODO: dinamizar si hay más tenants de TG
        chatId = client.phone.replace('tg_', '');
      } else if (client.notes) {
        try {
          const parsed = JSON.parse(client.notes);
          if (parsed.telegram_chat_id) {
            channel = 'telegram_gastro';
            chatId = parsed.telegram_chat_id;
          }
        } catch (_) {}
      }

      // ── Build message text ────────────────────────────────────────────────
      let msgText = '';

      if (apps.length === 1) {
        const dateStr = format(parseISO(apps[0].start_at), "EEEE d 'HH:mm'", { locale: dateLocale });
        const svc = (apps[0].services as any).name;
        msgText = `${t.bot_reminder_title}\n\n${t.bot_reminder_single(client.first_name, svc, dateStr, tenant.name)}`;
      } else {
        msgText = `${t.bot_reminder_title}\n\n${t.bot_reminder_multi(client.first_name, apps.length, tenant.name)}`;
        apps.forEach((app: any, i: number) => {
          const dateStr = format(parseISO(app.start_at), "EEEE d 'HH:mm'", { locale: dateLocale });
          const svc = (app.services as any).name;
          msgText += `${i + 1}. *${svc}* - *${dateStr}*\n`;
        });
        msgText += t.bot_reminder_confirm_all;
      }

      // Cleanup formatting for Telegram if needed (Telegram uses <b> instead of *)
      if (channel.startsWith('telegram')) {
        msgText = msgText.replace(/\*/g, '<b>').replace(/_/g, '<i>');
      }

      // ── Send via MessageService ───────────────────────────────────────────
      await MessageService.sendMessage({
        channel,
        tenant_id: tenantId,
        chat_id: chatId,
        text: msgText,
        buttons: ['✅', '❌'], // Optional: bot can handle confirmations with buttons
      });

      // ── Update status to awaiting_confirmation ────────────────────────────
      for (const app of apps) {
        await supabase
          .from('appointments')
          .update({ status: 'awaiting_confirmation' })
          .eq('id', app.id);
      }

      sentCount++;
      console.log(`✅ [CRON] Recordatorio (${channel}) enviado a ${client.first_name}`);

    } catch (err) {
      console.error(`❌ Error procesando recordatorio:`, err);
    }
  }

  console.log(`--- [CRON] FINALIZADO. Mensajes enviados: ${sentCount} ---`);
  return NextResponse.json({ ok: true, sent: sentCount });
}
