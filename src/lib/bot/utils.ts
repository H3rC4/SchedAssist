import { MessageService } from '@/services/message.service';
import { t, Language } from './translations';

export async function updateClientState(supabase: any, clientId: string, state: any) {
  const { data: c } = await supabase.from('clients').select('notes').eq('id', clientId).single();
  if (c && c.notes) {
    try {
      const parsed = JSON.parse(c.notes);
      if (parsed.telegram_chat_id && !state.telegram_chat_id) {
        state.telegram_chat_id = parsed.telegram_chat_id;
      }
      if (parsed.whatsapp_chat_id && !state.whatsapp_chat_id) {
        state.whatsapp_chat_id = parsed.whatsapp_chat_id;
      }
    } catch(e) {}
  }
  state.last_interaction = new Date().getTime();
  await supabase.from('clients').update({ notes: JSON.stringify(state) }).eq('id', clientId);
}

export async function showBookingSummary(
  supabase: any,
  tenant: any,
  client: any,
  chatId: number | string,
  state: any,
  channel: string,
  senderPhoneId?: string, // <--- New parameter
) {
  const lang = (tenant.settings?.language || 'es') as Language;

  const summary =
    `${t('summaryTitle', lang)}\n\n` +
    `${t('summaryPatient', lang)} ${state.patientName} ${state.patientLastName}\n` +
    `${t('summaryPhone', lang)} ${state.patientPhone}\n` +
    `${t('summaryService', lang)} ${state.serviceName}\n` +
    `${t('summaryProf', lang)} ${state.professionalName}\n` +
    `${t('summaryDate', lang)} ${state.displayDate}\n` +
    `${t('summaryTime', lang)} ${state.time}\n` +
    (state.comment ? `${t('summaryComment', lang)} ${state.comment}\n` : '') +
    `\n${t('correctInfo', lang)}`;

  await MessageService.sendMessage({
    channel,
    chat_id: chatId,
    tenant_id: tenant?.id,
    sender_phone_id: senderPhoneId, // <--- Passed through
    text: summary,
    buttons: [t('confirmYes', lang), t('confirmNo', lang), t('confirmBack', lang)],
  });
}

export async function showMainMenu(
  supabase: any,
  tenant: any,
  clientId: string,
  chatId: number | string,
  firstName: string,
  channel: string,
  senderPhoneId?: string // <--- New parameter
) {
  const lang = (tenant.settings?.language || 'es') as Language;
  await updateClientState(supabase, clientId, { step: 'INITIAL' });

  await MessageService.sendMessage({
    channel,
    chat_id: chatId,
    tenant_id: tenant?.id,
    sender_phone_id: senderPhoneId, // <--- Passed through
    text: t('mainMenu', lang, { name: firstName?.trim() ? `, ${firstName.trim()}` : '', tenant: tenant.name }),
    buttons: [
      `📅 ${t('bookAppointment', lang)}`,
      `❌ ${t('cancelAppointment', lang)}`,
    ],
  });
}
