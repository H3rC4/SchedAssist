import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addDays, format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { translations, dateLocales } from '@/lib/i18n';
import { MessageService } from '@/services/message.service';

/**
 * Vercel Cron Job: Envía recordatorios de citas próximas.
 * Se ejecuta para cada clínica a las 9:00 AM de su zona horaria local.
 */
export async function GET(req: NextRequest) {
  // ─── 0. Verificación de Seguridad para Vercel Cron ──────────────────────────
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('--- [CRON] INICIANDO ESCANEO DE RECORDATORIOS ---');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Obtener todos los tenants para verificar sus horarios locales
  const { data: tenants, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, name, timezone, settings');

  if (tenantErr || !tenants) {
    console.error('Error al obtener tenants:', tenantErr);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }

  let totalSent = 0;

  for (const tenant of tenants) {
    try {
      // ─── Lógica de Zona Horaria ─────────────────────────────────────────────
      const tz = tenant.timezone || 'UTC';
      const now = new Date();
      
      // Obtener la hora actual en la zona horaria del tenant
      const localHourStr = now.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: tz });
      const localHour = parseInt(localHourStr);

      // SOLO procesamos si son las 9 AM en la clínica (o si estamos forzando vía query param para test)
      const forceAll = req.nextUrl.searchParams.get('force') === 'true';
      if (localHour !== 9 && !forceAll) {
        continue;
      }

      console.log(`[CRON] Procesando Tenant: ${tenant.name} (${tz}) - Hora local: ${localHour}:00`);

      // ─── Verificación de Configuración ──────────────────────────────────────
      const isReminderEnabled = tenant.settings?.reminder_enabled !== false; // Default true
      if (!isReminderEnabled && !forceAll) {
        console.log(`[CRON] Recordatorios desactivados para ${tenant.name}. Saltando...`);
        continue;
      }

      // Definir "Mañana" relativo a la zona horaria del tenant
      // Nota: Usamos la fecha actual +/- el desfase si quisiéramos ser exactos, 
      // pero para simplificar, "mañana" es el día calendario siguiente al día actual en esa zona.
      const localDateStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
      const todayLocal = parseISO(localDateStr);
      const tomorrowLocal = addDays(todayLocal, 1);
      
      const rangeStart = startOfDay(tomorrowLocal).toISOString();
      const rangeEnd = endOfDay(tomorrowLocal).toISOString();

      // 2. Buscar citas PENDIENTES para mañana en esta clínica
      const { data: appointments, error: appErr } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          start_at,
          clients (id, first_name, phone, notes),
          services (name)
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'pending')
        .gte('start_at', rangeStart)
        .lte('start_at', rangeEnd);

      if (appErr || !appointments || appointments.length === 0) {
        continue;
      }

      // Group by client
      const groupedApps = new Map<string, any[]>();
      for (const app of appointments) {
        const client: any = app.clients;
        if (!client) continue;
        if (!groupedApps.has(client.id)) groupedApps.set(client.id, []);
        groupedApps.get(client.id)!.push(app);
      }

      const lang = (tenant.settings?.language as 'en'|'es'|'it') || 'es';
      const t = translations[lang] || translations['en'];
      const dateLocale = dateLocales[lang] || dateLocales['en'];

      for (const [_, clientApps] of Array.from(groupedApps.entries())) {
        const client = clientApps[0].clients;
        
        let msgText = '';
        if (clientApps.length === 1) {
          const dateStr = format(parseISO(clientApps[0].start_at), "EEEE d 'HH:mm'", { locale: dateLocale });
          const svc = clientApps[0].services.name;
          msgText = `${t.bot_reminder_title}\n\n${t.bot_reminder_single(client.first_name, svc, dateStr, tenant.name)}`;
        } else {
          msgText = `${t.bot_reminder_title}\n\n${t.bot_reminder_multi(client.first_name, clientApps.length, tenant.name)}`;
          clientApps.forEach((app: any, i: number) => {
            const dateStr = format(parseISO(app.start_at), "EEEE d 'HH:mm'", { locale: dateLocale });
            msgText += `${i + 1}. *${app.services.name}* - *${dateStr}*\n`;
          });
        }
        
        // Añadir instrucción de confirmación
        msgText += `\n${t.reminder_immediate || 'Por favor, confirma respondiendo *SÍ* o cancela con *NO*.'}`;

        // Determinar canal
        const channel = client.phone.startsWith('tg_') ? 'telegram_gastro' : 'whatsapp';
        const chatId = client.phone.replace('tg_', '');

        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          chat_id: chatId,
          text: msgText,
          buttons: ['✅ SI', '❌ NO'],
        });

        // Actualizar a awaiting_confirmation
        await supabase
          .from('appointments')
          .update({ status: 'awaiting_confirmation' })
          .in('id', clientApps.map(a => a.id));

        totalSent++;
      }

    } catch (err) {
      console.error(`❌ Error procesando tenant ${tenant.id}:`, err);
    }
  }

  console.log(`--- [CRON] FINALIZADO. Mensajes enviados: ${totalSent} ---`);
  return NextResponse.json({ ok: true, sent: totalSent });
}
