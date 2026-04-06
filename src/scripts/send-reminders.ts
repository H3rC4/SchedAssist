import { createClient } from '@supabase/supabase-js';
import { WhapiAdapter } from '../services/adapters/whapi.adapter';
import { TelegramAdapter } from '../services/adapters/telegram.adapter';
import { addHours, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import dotenv from 'dotenv';
import path from 'path';
import { translations, dateLocales } from '../lib/i18n';

// Load env vars from .env file (standalone script, not Next.js runtime)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// One adapter instance per channel — zero coupling to provider internals
const telegramAdapter = process.env.TELEGRAM_BOT_TOKEN_GASTRO
  ? new TelegramAdapter(process.env.TELEGRAM_BOT_TOKEN_GASTRO, 'telegram_gastro')
  : null;

// WhatsApp adapters are instantiated per-tenant (each has its own access_token)
// Cache them to avoid redundant DB queries within the same run
const whapiAdapterCache = new Map<string, WhapiAdapter>();

async function getWhapiAdapter(tenantId: string): Promise<WhapiAdapter | null> {
  if (whapiAdapterCache.has(tenantId)) return whapiAdapterCache.get(tenantId)!;

  const { data } = await supabase
    .from('whatsapp_accounts')
    .select('access_token')
    .eq('tenant_id', tenantId)
    .single();

  if (!data?.access_token) return null;

  const adapter = new WhapiAdapter(data.access_token);
  whapiAdapterCache.set(tenantId, adapter);
  return adapter;
}

async function sendReminders() {
  console.log('--- BUSCANDO CITAS PARA RECORDATORIOS (24hs) ---');

  const now = new Date();
  const rangeStart = addHours(now, 23).toISOString();
  const rangeEnd = addHours(now, 26).toISOString();

  console.log(`Buscando citas entre: ${rangeStart} y ${rangeEnd}`);

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      status,
      start_at,
      tenant_id,
      tenants (id, name),
      clients (id, first_name, phone, notes),
      services (name)
    `)
    .eq('status', 'confirmed')
    .gte('start_at', rangeStart)
    .lte('start_at', rangeEnd);

  if (error) { console.error('Error al consultar citas:', error); return; }
  if (!appointments || appointments.length === 0) {
    console.log('No se encontraron citas confirmadas en este rango.');
    return;
  }

  console.log(`Se encontraron ${appointments.length} citas.`);

  // Group by client to send a single consolidated message per person
  const groupedApps = new Map<string, typeof appointments>();
  for (const app of appointments) {
    const cId = (app.clients as any).id;
    if (!groupedApps.has(cId)) groupedApps.set(cId, []);
    groupedApps.get(cId)!.push(app);
  }

  console.log(`Enviando ${groupedApps.size} mensajes consolidados...`);

  for (const [clientId, apps] of Array.from(groupedApps.entries())) {
    try {
      const client = apps[0].clients as any;
      const tenant = apps[0].tenants as any;
      const tenantId = apps[0].tenant_id;
      const lang = (tenant.settings?.language as 'en'|'es'|'it') || 'es';
      const t = translations[lang] || translations['en'];
      const dateLocale = dateLocales[lang] || dateLocales['en'];

      // ── Determine channel ─────────────────────────────────────────────────
      let tgChatId: number | null = null;
      if (client.phone.startsWith('tg_')) {
        tgChatId = parseInt(client.phone.replace('tg_', ''));
      } else if (client.notes) {
        try {
          const parsed = JSON.parse(client.notes);
          if (parsed.telegram_chat_id) tgChatId = parseInt(parsed.telegram_chat_id);
        } catch (_) {}
      }

      // ── Build message text ────────────────────────────────────────────────
      let waText = '';

      if (apps.length === 1) {
        const dateStr = format(parseISO(apps[0].start_at), "EEEE d 'HH:mm'", { locale: dateLocale });
        const svc = (apps[0].services as any).name;
        waText = `${t.bot_reminder_title}\n\n${t.bot_reminder_single(client.first_name, svc, dateStr, tenant.name)}`;
      } else {
        waText = `${t.bot_reminder_title}\n\n${t.bot_reminder_multi(client.first_name, apps.length, tenant.name)}`;
        apps.forEach((app: any, i: number) => {
          const dateStr = format(parseISO(app.start_at), "EEEE d 'HH:mm'", { locale: dateLocale });
          const svc = (app.services as any).name;
          waText += `${i + 1}. *${svc}* - *${dateStr}*\n`;
        });
        waText += t.bot_reminder_confirm_all;
      }
      
      const tgText = waText.replace(/\*/g, '<b>').replace(/_/g, '<i>').replace(/<\/i>/g, '</i>').replace(/<\/b>/g, '</b>');

      // ── Send via the correct adapter ──────────────────────────────────────
      if (tgChatId && telegramAdapter) {
        await telegramAdapter.send({
          to: String(tgChatId),
          text: tgText,
          buttons: ['✅', '❌'],
        });
        console.log(`✅ Recordatorio TELEGRAM (x${apps.length}) enviado a ${client.first_name}`);
      } else if (!tgChatId) {
        const adapter = await getWhapiAdapter(tenantId);
        if (adapter) {
          await adapter.send({ to: client.phone.replace('+', ''), text: waText });
          console.log(`✅ Recordatorio WHATSAPP (x${apps.length}) enviado a ${client.first_name}`);
        } else {
          console.warn(`⚠️ Sin credenciales WhatsApp para tenant ${tenant.name}. Se omite ${client.first_name}.`);
          continue;
        }
      }

      // ── Update status to awaiting_confirmation ────────────────────────────
      for (const app of apps) {
        await supabase
          .from('appointments')
          .update({ status: 'awaiting_confirmation' })
          .eq('id', app.id);
      }

    } catch (err) {
      console.error(`Error procesando recordatorio para cliente ${clientId}:`, err);
    }
  }

  console.log('--- PROCESO DE RECORDATORIOS FINALIZADO ---');
}

sendReminders();
