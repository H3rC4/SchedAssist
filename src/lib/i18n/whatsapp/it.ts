export const it_whatsapp_tab = {
  whatsapp_integration: 'Integrazione WhatsApp',
  whatsapp_integration_desc: 'Gateway di Comunicazione Automatizzata con il Paziente',
  add_account: 'Aggiungi Nuovo Account',
  connect_business: 'Connetti Account Business',
  account_label: 'Etichetta Account',
  phone_id_label: 'ID Numero di Telefono',
  token_label: 'Token di Accesso',
  confirm_integration: 'Conferma Integrazione',
  integration_status: 'Stato dell\'Integrazione',
  active_instance: 'Istanza Attiva',
  link_required: 'Collegamento Richiesto',
  whatsapp_active_desc: 'Il tuo account principale è collegato. I promemoria automatici e il follow-up clinico sono attivi.',
  whatsapp_inactive_desc: 'Collega il tuo account WhatsApp Business API per abilitare i promemoria automatici e le notifiche della lista d\'attesa.',
  qr_notice: 'Gli account Business richiedono la configurazione dell\'API. L\'accoppiamento tramite QR è per istanze personali.',
  read_docs: 'Leggi la Documentazione',
  auto_reminders: 'Promemoria Automatici',
  reminders_desc: 'Invia conferme automatiche 24 ore prima delle visite programmate.',
  on: 'Attivo',
  off: 'Disattivato',
  clinical_templates: 'Modelli Clinici',
  manage_templates: 'Gestisci Modelli Cloud API',
  preview_logic: 'Anteprima Logica',
  template_conf_text: 'Ciao [Paziente], la tua visita è confermata per il [Data] alle [Ora]. Si prega di confermare la partecipazione.',
  template_wait_text: 'Buone notizie! Si è aperto un posto per oggi alle [Ora]. Vorresti prenderlo?',
  template_feedback_text: 'Grazie per aver visitato [Clinica]. Valuta la tua esperienza: [Link]',
};

export const it_bot_messages = {
  bot_reminder_title: '🔔 *PROMEMORIA APPUNTAMENTO*',
  bot_reminder_single: (name: string, svc: string, date: string, tenant: string) =>
  `Ciao ${name}, ti ricordiamo la tua visita per *${svc}* domani alle *${date}* in _${tenant}_.\n\nConfermi la tua presenza? Rispondi SI per confermare.`,
  bot_reminder_multi: (name: string, count: number, tenant: string) =>
  `Ciao ${name}, hai *${count} appuntamenti* programmati domani in _${tenant}_:\n\n`,
  bot_reminder_confirm_all: '\nConfermi la tua presenza? Rispondi SI per confermare.',
  reminder_immediate: 'Per favore, conferma rispondendo *SÌ* o annulla con *NO*.',
  bot_new_title: '✅ <b>NUOVO APPUNTAMENTO PROGRAMMATO</b>',
  bot_new_desc: (name: string, svc: string, prof: string, date: string) =>
  `Ciao ${name}, ti confermiamo il tuo appuntamento per <b>${svc}</b> con <b>${prof}</b>.\n\n📅 Data: <b>${date}</b>.\n\nTi aspettiamo!`,
  bot_cancellation_title: '⚠️ <b>APPUNTAMENTO ANNULLATO</b>',
  bot_cancellation_desc: (name: string, svc: string, date: string, tenant: string) =>
  `Ciao ${name}, siamo spiacenti di informarti che il tuo appuntamento per <b>${svc}</b> il giorno <b>${date}</b> presso <b>${tenant}</b> è stato annullato per imprevisti in clinica.\n\nTi contatteremo al più presto per riprogrammare. Ci scusiamo per l'inconveniente!`,
  send_whatsapp: 'Invia WhatsApp',
};

export const it_whatsapp_chat = {
  bot_paused: 'Bot in Pausa',
  reactivate_bot: 'Riattiva Bot',
  reactivate_bot_confirm: "L'assistente automatico risponderà di nuovo a questo paziente. Continuare?",
  bot_reactivated: 'Bot riattivato correttamente',
  bot_reactivate_error: "Errore nella riattivazione del bot",
};
