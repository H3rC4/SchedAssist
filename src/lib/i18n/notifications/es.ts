export const es_notifications = {
  notifications_title: 'Notificaciones en Vivo',
  notifications_empty: 'Sin notificaciones',
  notifications_empty_desc: 'La actividad de turnos aparecerá aquí en tiempo real.',
  notifications_mark_all_read: 'Marcar todo leído',
  notification_new_appointment: 'Nueva Cita',
  notification_appointment_cancelled: 'Cita Cancelada',
  notification_appointment_rescheduled: 'Cita Reagendada',
  notification_professional_blocked: 'Día Cancelado',
  notification_appointment_confirmed: 'Cita Confirmada',
  notification_appointment_attended: 'Cita Atendida',
  notification_plan_activated: 'Plan Activado',
  notification_status_changed: 'Estado Cambiado',
  notify_body_created: (patient: string, professional: string, date: string, time: string) =>
  `${patient} agendó con ${professional} para el ${date} a las ${time}`,
  notify_body_cancelled: (patient: string, professional: string, date: string) =>
  `Cita de ${patient} con ${professional} del ${date} fue cancelada`,
  notify_body_rescheduled: (patient: string, oldDate: string, newDate: string, professional: string) =>
  `${patient} pasó del ${oldDate} al ${newDate} con ${professional}`,
  notify_body_blocked: (professional: string, date: string, count: number) =>
  `${professional} canceló el ${date}. ${count} cita(s) pendientes de reagendar.`,
  notify_body_confirmed: (patient: string, professional: string, date: string, time: string) =>
  `${patient} confirmó cita con ${professional} para el ${date} a las ${time}`,
  notify_body_attended: (patient: string, professional: string, date: string) =>
  `${patient} asistió a cita con ${professional} el ${date}`,
  notify_body_plan_activated: (plan: string, billingCycle: string) =>
  `Tu plan ${plan} (${billingCycle}) fue activado exitosamente.`,
};
