export const it_notifications = {
  notifications_title: 'Notifiche in Tempo Reale',
  notifications_empty: 'Nessuna notifica',
  notifications_empty_desc: "L'attività degli appuntamenti apparirà qui in tempo reale.",
  notifications_mark_all_read: 'Segna tutto come letto',
  notification_new_appointment: 'Nuovo Appuntamento',
  notification_appointment_cancelled: 'Appuntamento Cancellato',
  notification_appointment_rescheduled: 'Appuntamento Riprogrammato',
  notification_professional_blocked: 'Giorno Cancellato',
  notification_appointment_confirmed: 'Appuntamento Confermato',
  notification_appointment_attended: 'Appuntamento Completato',
  notification_plan_activated: 'Piano Attivato',
  notification_status_changed: 'Stato Cambiato',
  notify_body_created: (patient: string, professional: string, date: string, time: string) =>
  `${patient} ha prenotato con ${professional} per il ${date} alle ${time}`,
  notify_body_cancelled: (patient: string, professional: string, date: string) =>
  `Appuntamento di ${patient} con ${professional} del ${date} è stato cancellato`,
  notify_body_rescheduled: (patient: string, oldDate: string, newDate: string, professional: string) =>
  `${patient} è passato dal ${oldDate} al ${newDate} con ${professional}`,
  notify_body_blocked: (professional: string, date: string, count: number) =>
  `${professional} ha cancellato il ${date}. ${count} appuntamento/i da riprogrammare.`,
  notify_body_confirmed: (patient: string, professional: string, date: string, time: string) =>
  `${patient} ha confermato appuntamento con ${professional} per il ${date} alle ${time}`,
  notify_body_attended: (patient: string, professional: string, date: string) =>
  `${patient} ha completato appuntamento con ${professional} il ${date}`,
  notify_body_plan_activated: (plan: string, billingCycle: string) =>
  `Il tuo piano ${plan} (${billingCycle}) è stato attivato con successo.`,
};
