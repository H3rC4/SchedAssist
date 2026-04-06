import { format, parseISO, addDays } from 'date-fns';
import { MessageService } from '@/services/message.service';
import { AppointmentService } from '@/services/appointment.service';
import { BotContext } from './types';
import { updateClientState, showMainMenu, showBookingSummary } from './utils';
import { t, Language, translations } from './translations';

function resolveOption(text: string, options: string[]): string {
  if (!text) return '';
  const msgLower = text.toLowerCase().trim();
  const idx = parseInt(msgLower) - 1;
  
  if (!isNaN(idx) && idx >= 0 && idx < options.length && msgLower === (idx + 1).toString()) {
    return options[idx];
  }
  
  const matched = options.find(opt => {
    const cleanOpt = opt.toLowerCase().replace(/^[^\w\s]+/, '').trim();
    return cleanOpt === msgLower || (msgLower.length >= 4 && cleanOpt.includes(msgLower));
  });
  
  return matched || text.trim();
}

// Handlers for the main appointment state machine
export const StateHandlers: Record<string, (ctx: BotContext) => Promise<boolean>> = {

  WAIT_FIRST_NAME: async ({ supabase, tenant, client, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    await supabase.from('clients').update({ first_name: text }).eq('id', client.id);
    await updateClientState(supabase, client.id, { step: 'WAIT_LAST_NAME' });
    await MessageService.sendMessage({
      channel,
      tenant_id: tenant.id,
      sender_phone_id,
      chat_id: chatId,
      text: t('welcome', lang, { name: text }),
    });
    return true;
  },

  WAIT_LAST_NAME: async ({ supabase, tenant, client, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    await supabase.from('clients').update({ last_name: text }).eq('id', client.id);
    await updateClientState(supabase, client.id, { step: 'WAIT_PHONE' });
    await MessageService.sendMessage({
      channel,
      tenant_id: tenant.id,
      sender_phone_id,
      chat_id: chatId,
      text: t('askPhone', lang),
      requestContact: true,
      contactButtonLabel: t('shareContact', lang),
    });
    return true;
  },

  WAIT_PHONE: async ({ supabase, tenant, client, chatId, text, message, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const finalPhone = message?.contact ? message.contact.phone_number : text.replace(/[^0-9\+]/g, '');
    if (finalPhone.length < 8) {
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('wrongPhone', lang),
      });
      return true;
    }
    await supabase.from('clients').update({ phone: finalPhone }).eq('id', client.id);
    await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, channel, sender_phone_id);
    return true;
  },

  INITIAL: async ({ supabase, tenant, client, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const msgLower = text.toLowerCase().trim();

    const agendarWord = t('agendar', lang).toLowerCase();
    const cancelarWord = t('cancelar', lang).toLowerCase();

    if (msgLower === '1' || msgLower.includes(agendarWord) || msgLower.includes('agendar')) {
      await updateClientState(supabase, client.id, { step: 'ASK_WHO_IS_PATIENT' });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('whoIsPatient', lang, { name: client.first_name }),
        buttons: [t('forMe', lang), t('forOther', lang), t('backToMenu', lang)],
      });
      return true;
    }

    if (msgLower === '2' || msgLower.includes(cancelarWord) || msgLower.includes('cancelar')) {
      const appointments = await AppointmentService.getClientAppointments(supabase, { tenant_id: tenant.id, client_id: client.id });
      if (!appointments || appointments.length === 0) {
        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          sender_phone_id,
          chat_id: chatId,
          text: t('noAppointments', lang),
        });
        await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, channel, sender_phone_id);
        return true;
      }
      await updateClientState(supabase, client.id, { step: 'WAIT_CANCEL_SELECTION' });
      const options = appointments.map((a: any) => `${format(parseISO(a.start_at), 'dd/MM HH:mm')} - ${a.services?.name}`);
      options.push(t('backToMenu', lang));
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('selectCancel', lang),
        buttons: options,
      });
      return true;
    }

    // Default: show main menu
    await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, channel, sender_phone_id);
    return true;
  },

  ASK_WHO_IS_PATIENT: async ({ supabase, tenant, client, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const options = [t('forMe', lang), t('forOther', lang), t('backToMenu', lang)];
    const selected = resolveOption(text, options);

    if (selected === t('backToMenu', lang)) {
      await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, channel, sender_phone_id);
      return true;
    }

    if (selected === t('forMe', lang)) {
      const { data: services } = await supabase.from('services').select('id, name').eq('tenant_id', tenant.id).eq('active', true);
      const uniqueServiceNames = Array.from(new Set((services || []).map((s: any) => String(s.name))));
      await updateClientState(supabase, client.id, { step: 'WAIT_SERVICE', patientName: client.first_name, patientLastName: client.last_name, patientPhone: client.phone });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('selectService', lang, { name: client.first_name }),
        buttons: [...uniqueServiceNames, t('backToMenu', lang)],
      });
    } else if (selected === t('forOther', lang)) {
      await updateClientState(supabase, client.id, { step: 'WAIT_PATIENT_NAME' });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('askPatientName', lang),
        buttons: [t('backToMenu', lang)],
      });
    } else {
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('invalidOption', lang),
        buttons: options,
      });
    }
    return true;
  },

  WAIT_PATIENT_NAME: async ({ supabase, tenant, client, botState, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    
    // BACK button: return to "Who is patient?"
    const backWord = t('backToMenu', lang);
    const options = [backWord];
    const selected = resolveOption(text, options);

    if (selected === backWord) {
      await updateClientState(supabase, client.id, { step: 'ASK_WHO_IS_PATIENT' });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('whoIsPatient', lang, { name: client.first_name }),
        buttons: [t('forMe', lang), t('forOther', lang), t('backToMenu', lang)],
      });
      return true;
    }
    await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_PATIENT_LAST_NAME', patientName: text });
    await MessageService.sendMessage({
      channel,
      tenant_id: tenant.id,
      sender_phone_id,
      chat_id: chatId,
      text: t('askPatientLastName', lang, { name: text }),
      buttons: [backWord],
    });
    return true;
  },

  WAIT_PATIENT_LAST_NAME: async ({ supabase, tenant, client, botState, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const backWord = t('backToMenu', lang);
    const options = [backWord];
    const selected = resolveOption(text, options);

    if (selected === backWord) {
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_PATIENT_NAME' });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('askPatientName', lang),
        buttons: [backWord],
      });
      return true;
    }
    await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_PATIENT_PHONE', patientLastName: text });
    await MessageService.sendMessage({
      channel,
      tenant_id: tenant.id,
      sender_phone_id,
      chat_id: chatId,
      text: t('askPatientPhone', lang, { name: botState.patientName, lastName: text }),
      requestContact: true,
      contactButtonLabel: t('shareContact', lang),
      buttons: [backWord],
    });
    return true;
  },

  WAIT_PATIENT_PHONE: async ({ supabase, tenant, client, botState, chatId, text, message, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const backWord = t('backToMenu', lang);

    const msgLower = text.toLowerCase().trim();
    if (msgLower === '1' || msgLower === backWord.toLowerCase()) {
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_PATIENT_LAST_NAME' });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('askPatientLastName', lang, { name: botState.patientName }),
        buttons: [backWord],
      });
      return true;
    }

    let patientPhone = '';
    if (message?.contact) {
      patientPhone = message.contact.phone_number;
    } else {
      patientPhone = text.replace(/[^0-9\+]/g, '');
      if (patientPhone.length < 8) {
        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          sender_phone_id,
          chat_id: chatId,
          text: t('invalidPhone', lang),
          buttons: [backWord],
        });
        return true;
      }
    }
    const { data: services } = await supabase.from('services').select('id, name').eq('tenant_id', tenant.id).eq('active', true);
    const uniqueServiceNames = Array.from(new Set((services || []).map((s: any) => String(s.name))));
    await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_SERVICE', patientPhone });
    await MessageService.sendMessage({
      channel,
      tenant_id: tenant.id,
      sender_phone_id,
      chat_id: chatId,
      text: t('selectServiceForOther', lang),
      buttons: [...uniqueServiceNames, backWord],
    });
    return true;
  },

  WAIT_CANCEL_SELECTION: async ({ supabase, tenant, client, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const appointments = await AppointmentService.getClientAppointments(supabase, { tenant_id: tenant.id, client_id: client.id });
    const options = appointments.map((a: any) => `${format(parseISO(a.start_at), 'dd/MM HH:mm')} - ${a.services?.name}`);
    options.push(t('backToMenu', lang));

    const selected = resolveOption(text, options);

    if (selected === t('backToMenu', lang)) {
      await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, channel, sender_phone_id);
      return true;
    }

    const targetIdx = appointments.findIndex((a: any) => selected.includes(format(parseISO(a.start_at), 'dd/MM HH:mm')));
    if (targetIdx === -1) {
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        chat_id: chatId,
        text: t('invalidOption', lang),
      });
      return true;
    }

    try {
      await AppointmentService.cancelAppointment(supabase, {
        appointment_id: appointments[targetIdx].id,
        tenant_id: tenant.id,
        reason: 'Cancelado vía Bot',
      });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('cancelSuccess', lang),
        removeKeyboard: true,
      });
    } catch (err: any) {
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('cancelError', lang, { error: err.message }),
      });
    }
    await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, channel, sender_phone_id);
    return true;
  },

  WAIT_SERVICE: async ({ supabase, tenant, client, botState, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const backWord = t('backToMenu', lang);
    const { data: allServices } = await supabase.from('services').select('id, name').eq('tenant_id', tenant.id).eq('active', true);
    const uniqueServiceNames = Array.from(new Set((allServices || []).map((s: any) => String(s.name))));
    const options = [...uniqueServiceNames, backWord];

    const selected = resolveOption(text, options);
    const msgLower = selected.toLowerCase().trim();

    if (selected === backWord) {
      await updateClientState(supabase, client.id, { step: 'ASK_WHO_IS_PATIENT' });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('whoIsPatient', lang, { name: client.first_name }),
        buttons: [t('forMe', lang), t('forOther', lang), t('backToMenu', lang)],
      });
      return true;
    }

    if (selected === t('forOther', lang)) {
      await updateClientState(supabase, client.id, { ...botState, step: 'ASK_WHO_IS_PATIENT' });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('whoIsPatient', lang, { name: client.first_name }),
        buttons: [t('forMe', lang), t('forOther', lang), t('backToMenu', lang)],
      });
      return true;
    }

    const service = (allServices || []).find((s: any) => s.name.toLowerCase() === msgLower);
    if (service) {
      const { data: profs } = await supabase.from('professionals').select('id, full_name').eq('tenant_id', tenant.id).eq('active', true);

      // Auto-Skip: if only one professional, go straight to date selection
      if (profs && profs.length === 1) {
        const prof = profs[0];
        await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_DATE', serviceId: service.id, serviceName: service.name, professionalId: prof.id, professionalName: prof.full_name });

        const dateOptions: string[] = [];
        let checkDate = new Date();
        let dCounter = 0;
        while (dateOptions.length < 5 && dCounter < 14) {
          const dbDateStr = format(checkDate, 'yyyy-MM-dd');
          const slots = await AppointmentService.getAvailableSlots(supabase, { tenant_id: tenant.id, professional_id: prof.id, date: dbDateStr });
          if (slots.length > 0) dateOptions.push(format(checkDate, 'dd/MM/yyyy'));
          checkDate = addDays(checkDate, 1);
          dCounter++;
        }

        if (dateOptions.length === 0) {
          await MessageService.sendMessage({
            channel,
            tenant_id: tenant.id,
            sender_phone_id,
            chat_id: chatId,
            text: t('noSlots', lang, { name: prof.full_name }),
          });
          return true;
        }

        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          sender_phone_id,
          chat_id: chatId,
          text: t('selectProf', lang, { name: prof.full_name }),
          buttons: [...dateOptions, t('changeService', lang)],
        });
      } else {
        await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_PROFESSIONAL', serviceId: service.id, serviceName: service.name });
        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          sender_phone_id,
          chat_id: chatId,
          text: t('chosenService', lang, { service: service.name }),
          buttons: [
            t('closestAvailable', lang),
            ...(profs?.map((p: any) => p.full_name) || []),
            t('changeService', lang),
          ],
        });
      }
    } else {
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('invalidOption', lang),
      });
    }
    return true;
  },

  WAIT_PROFESSIONAL: async ({ supabase, tenant, client, botState, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const { data: allProfs } = await supabase.from('professionals').select('id, full_name').eq('tenant_id', tenant.id).eq('active', true);
    const options = [t('closestAvailable', lang), ...(allProfs?.map((p: any) => p.full_name) || []), t('changeService', lang)];

    const selected = resolveOption(text, options);
    const msgLower = selected.toLowerCase().trim();

    if (selected === t('changeService', lang)) {
      const { data: services } = await supabase.from('services').select('id, name').eq('tenant_id', tenant.id).eq('active', true);
      const uniqueServiceNames = Array.from(new Set((services || []).map((s: any) => String(s.name))));
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_SERVICE' });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('selectService', lang, { name: botState.patientName }),
        buttons: [...uniqueServiceNames, t('changeService', lang)],
      });
      return true;
    }

    if (selected === t('closestAvailable', lang)) {
      if (!allProfs || allProfs.length === 0) {
        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          chat_id: chatId,
          text: t('noProfs', lang),
        });
        return true;
      }
      let bestProf: any = null, bestDate = '', bestDisplayDate = '', bestSlot = '';
      for (const prof of allProfs) {
        let checkDate = new Date();
        let loops = 0;
        while (loops < 14) {
          const dbDateStr = format(checkDate, 'yyyy-MM-dd');
          const slots = await AppointmentService.getAvailableSlots(supabase, { tenant_id: tenant.id, professional_id: prof.id, date: dbDateStr });
          if (slots.length > 0) {
            const candidateDateTime = `${dbDateStr}T${slots[0]}`;
            const bestDateTime = bestDate ? `${bestDate}T${bestSlot}` : 'Z';
            if (!bestProf || candidateDateTime < bestDateTime) {
              bestProf = prof;
              bestDate = dbDateStr;
              bestDisplayDate = format(checkDate, 'dd/MM/yyyy');
              bestSlot = slots[0];
            }
            break;
          }
          checkDate = addDays(checkDate, 1);
          loops++;
        }
      }
      if (!bestProf) {
        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          chat_id: chatId,
          text: t('noProfsAvailable', lang),
        });
        return true;
      }
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_DATE', professionalId: bestProf.id, professionalName: bestProf.full_name });
      const dateOptions: string[] = [];
      let checkDate = new Date();
      let ds = 0;
      while (dateOptions.length < 5 && ds < 14) {
        const dStr = format(checkDate, 'yyyy-MM-dd');
        const slots = await AppointmentService.getAvailableSlots(supabase, { tenant_id: tenant.id, professional_id: bestProf.id, date: dStr });
        if (slots.length > 0) dateOptions.push(format(checkDate, 'dd/MM/yyyy'));
        checkDate = addDays(checkDate, 1);
        ds++;
      }
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('closestSlotFound', lang, { name: bestProf.full_name, date: bestDisplayDate, time: bestSlot }),
        buttons: [...dateOptions, t('changeProf', lang)],
      });
      return true;
    }

    const prof = (allProfs || []).find((p: any) => p.full_name.toLowerCase() === msgLower);
    if (prof) {
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_DATE', professionalId: prof.id, professionalName: prof.full_name });
      const dateOptions: string[] = [];
      let checkDate = new Date();
      let dCounter = 0;
      while (dateOptions.length < 5 && dCounter < 14) {
        const dbDateStr = format(checkDate, 'yyyy-MM-dd');
        const slots = await AppointmentService.getAvailableSlots(supabase, { tenant_id: tenant.id, professional_id: prof.id, date: dbDateStr });
        if (slots.length > 0) dateOptions.push(format(checkDate, 'dd/MM/yyyy'));
        checkDate = addDays(checkDate, 1);
        dCounter++;
      }
      if (dateOptions.length === 0) {
        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          sender_phone_id,
          chat_id: chatId,
          text: t('noProfsAvailable', lang),
        });
        return true;
      }
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('askDate', lang),
        buttons: [...dateOptions, t('changeProf', lang)],
      });
    } else {
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('unrecognizedProf', lang),
      });
    }
    return true;
  },

  WAIT_DATE: async ({ supabase, tenant, client, botState, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    let checkDate = new Date();
    let dateOptions: string[] = [];
    let counter = 0;
    while (dateOptions.length < 5 && counter < 14) {
      const dStr = format(checkDate, 'yyyy-MM-dd');
      const slots = await AppointmentService.getAvailableSlots(supabase, { tenant_id: tenant.id, professional_id: botState.professionalId, date: dStr });
      if (slots.length > 0) dateOptions.push(format(checkDate, 'dd/MM/yyyy'));
      checkDate = addDays(checkDate, 1);
      counter++;
    }
    const options = [...dateOptions, t('changeProf', lang)];

    const selected = resolveOption(text, options);

    if (selected === t('changeProf', lang)) {
      const { data: services } = await supabase.from('services').select('id, name').eq('tenant_id', tenant.id).eq('active', true);
      const service = (services || []).find((s: any) => s.id === botState.serviceId);
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_PROFESSIONAL' });
      const { data: profs } = await supabase.from('professionals').select('full_name').eq('tenant_id', tenant.id).eq('active', true);
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('chosenService', lang, { service: service?.name || '' }),
        buttons: [
          t('closestAvailable', lang),
          ...(profs?.map((p: any) => p.full_name) || []),
          t('changeService', lang),
        ],
      });
      return true;
    }

    const match = selected.trim().match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (!match) {
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('invalidDateFormat', lang),
      });
      return true;
    }

    const [_, day, month, year] = match;
    const dbDate = `${year}-${month}-${day}`;
    const slots = await AppointmentService.getAvailableSlots(supabase, { tenant_id: tenant.id, professional_id: botState.professionalId, date: dbDate });
    if (slots.length === 0) {
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('noSlotsForDate', lang),
      });
      return true;
    }
    await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_TIME', date: dbDate, displayDate: selected.trim() });
    await MessageService.sendMessage({
      channel,
      tenant_id: tenant.id,
      sender_phone_id,
      chat_id: chatId,
      text: t('askTime', lang),
      buttons: [...slots, t('changeDate', lang)],
    });
    return true;
  },

  WAIT_TIME: async ({ supabase, tenant, client, botState, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const slots = await AppointmentService.getAvailableSlots(supabase, { tenant_id: tenant.id, professional_id: botState.professionalId, date: botState.date });
    const options = [...slots, t('changeDate', lang)];

    const selected = resolveOption(text, options);

    if (selected === t('changeDate', lang)) {
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_DATE' });
      const dateOptions: string[] = [];
      let checkDate = new Date();
      let loops = 0;
      while (dateOptions.length < 5 && loops < 14) {
        const dbDateStr = format(checkDate, 'yyyy-MM-dd');
        const availableSlots = await AppointmentService.getAvailableSlots(supabase, { tenant_id: tenant.id, professional_id: botState.professionalId, date: dbDateStr });
        if (availableSlots.length > 0) dateOptions.push(format(checkDate, 'dd/MM/yyyy'));
        checkDate = addDays(checkDate, 1);
        loops++;
      }
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('askDate', lang),
        buttons: [...dateOptions, t('changeProf', lang)],
      });
      return true;
    }

    if (!slots.includes(selected.trim())) {
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('invalidTime', lang),
      });
      return true;
    }
    await updateClientState(supabase, client.id, { ...botState, step: 'ASK_COMMENT_DECISION', time: selected.trim() });
    await MessageService.sendMessage({
      channel,
      tenant_id: tenant.id,
      sender_phone_id,
      chat_id: chatId,
      text: t('askComment', lang),
      buttons: [t('yesComment', lang), t('noComment', lang)],
    });
    return true;
  },

  ASK_COMMENT_DECISION: async ({ supabase, tenant, client, botState, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const options = [t('yesComment', lang), t('noComment', lang)];
    const selected = resolveOption(text, options);

    if (selected === t('yesComment', lang)) {
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_COMMENT' });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('writeComment', lang),
      });
    } else {
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_CONFIRMATION', comment: '' });
      await showBookingSummary(supabase, tenant, client, chatId, { ...botState, comment: '' }, channel, sender_phone_id);
    }
    return true;
  },

  WAIT_COMMENT: async ({ supabase, tenant, client, botState, chatId, text, channel, sender_phone_id }) => {
    await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_CONFIRMATION', comment: text });
    await showBookingSummary(supabase, tenant, client, chatId, { ...botState, comment: text }, channel, sender_phone_id);
    return true;
  },

  WAIT_CONFIRMATION: async ({ supabase, tenant, client, botState, chatId, text, channel, sender_phone_id }) => {
    const lang = (tenant.settings?.language || 'es') as Language;
    const options = [t('confirmYes', lang), t('confirmNo', lang), t('confirmBack', lang)];
    const selected = resolveOption(text, options);
    const msgLower = selected.toLowerCase().trim();

    if (msgLower === t('confirmYes', lang).toLowerCase() || msgLower.includes('confirmar') || msgLower.includes('confirm')) {
      try {
        const capitalize = (s: string) => s.trim().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        const cleanName = capitalize(botState.patientName);
        const cleanLastName = capitalize(botState.patientLastName);
        const cleanPhone = botState.patientPhone.replace(/[^0-9\+]/g, '');

        let { data: targetClient } = await supabase.from('clients').select('id, notes').eq('tenant_id', tenant.id).eq('phone', cleanPhone).limit(1).maybeSingle();

        if (!targetClient) {
          const { data: newClient, error: clientErr } = await supabase.from('clients').insert([{
            tenant_id: tenant.id, first_name: cleanName, last_name: cleanLastName, phone: cleanPhone, whatsapp_opt_in: true
          }]).select().single();
          if (clientErr) throw clientErr;
          targetClient = newClient;
        }

        const startAt = parseISO(`${botState.date}T${botState.time}:00Z`);
        const endAt = new Date(startAt.getTime() + 30 * 60000);

        await AppointmentService.createAppointment(supabase, {
          tenant_id: tenant.id,
          client_id: targetClient!.id,
          professional_id: botState.professionalId,
          service_id: botState.serviceId,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          source: channel,
          notes: botState.comment || undefined,
        });

        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          sender_phone_id,
          chat_id: chatId,
          text: t('appointmentConfirmed', lang, { name: `${cleanName} ${cleanLastName}`, date: botState.displayDate, time: botState.time }),
          removeKeyboard: true,
        });
        await updateClientState(supabase, client.id, { step: 'INITIAL' });

      } catch (err: any) {
        console.error('Error finalizando reserva:', err);
        await MessageService.sendMessage({
          channel,
          tenant_id: tenant.id,
          sender_phone_id,
          chat_id: chatId,
          text: t('appointmentError', lang, { error: err.message }),
        });
        await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, channel, sender_phone_id);
      }
    } else if (msgLower === t('confirmNo', lang).toLowerCase() || msgLower.includes('cambiar') || msgLower.includes('change')) {
      await updateClientState(supabase, client.id, { ...botState, step: 'WAIT_TIME' });
      const slots = await AppointmentService.getAvailableSlots(supabase, { tenant_id: tenant.id, professional_id: botState.professionalId, date: botState.date });
      await MessageService.sendMessage({
        channel,
        tenant_id: tenant.id,
        sender_phone_id,
        chat_id: chatId,
        text: t('askTime', lang),
        buttons: [...slots, t('changeDate', lang)],
      });
    } else {
      await showMainMenu(supabase, tenant, client.id, chatId, client.first_name, channel, sender_phone_id);
    }
    return true;
  },
};

export async function executeStateMachine(ctx: BotContext): Promise<boolean> {
  const lang = (ctx.tenant.settings?.language || 'es') as Language;
  const msgLower = ctx.text.toLowerCase().trim();

  const greetWords = translations[lang]?.greetWords || translations['es'].greetWords;

  // Global reset on any greeting word
  if (greetWords.some((word: string) => msgLower.includes(word))) {
    await showMainMenu(ctx.supabase, ctx.tenant, ctx.client.id, ctx.chatId, ctx.client.first_name, ctx.channel, ctx.sender_phone_id);
    return true;
  }

  const handler = StateHandlers[ctx.botState.step];
  if (handler) {
    return await handler(ctx);
  }

  await showMainMenu(ctx.supabase, ctx.tenant, ctx.client.id, ctx.chatId, ctx.client.first_name, ctx.channel, ctx.sender_phone_id);
  return true;
}
