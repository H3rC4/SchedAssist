export const es_whatsapp_tab = {
  whatsapp_integration: 'Integración de WhatsApp',
  whatsapp_integration_desc: 'Pasarela de Comunicación Automatizada con el Paciente',
  add_account: 'Añadir Nueva Cuenta',
  connect_business: 'Conectar Cuenta Business',
  account_label: 'Etiqueta de la Cuenta',
  phone_id_label: 'ID de Número de Teléfono',
  token_label: 'Token de Acceso',
  confirm_integration: 'Confirmar Integración',
  integration_status: 'Estado de la Integración',
  active_instance: 'Instancia Activa',
  link_required: 'Vínculo Requerido',
  whatsapp_active_desc: 'Su cuenta principal está vinculada. Los recordatorios automáticos y el seguimiento clínico están activos.',
  whatsapp_inactive_desc: 'Conecte su cuenta de WhatsApp Business API para habilitar recordatorios automáticos y notificaciones de lista de espera.',
  qr_notice: 'Las cuentas Business requieren configuración de API. El emparejamiento por QR es para instancias personales.',
  read_docs: 'Leer Documentación',
  auto_reminders: 'Recordatorios Automáticos',
  reminders_desc: 'Envía confirmaciones automáticas 24 horas antes de las visitas programadas.',
  on: 'Activado',
  off: 'Desactivado',
  clinical_templates: 'Plantillas Clínicas',
  manage_templates: 'Gestionar Plantillas Cloud API',
  preview_logic: 'Vista Previa de Lógica',
  template_conf_text: 'Hola [Paciente], su visita está confirmada para el [Fecha] a las [Hora]. Por favor confirme asistencia.',
  template_wait_text: '¡Buenas noticias! Se abrió un turno para hoy a las [Hora]. ¿Desea tomarlo?',
  template_feedback_text: 'Gracias por visitar [Clínica]. Por favor califique su experiencia: [Enlace]',
};

export const es_bot_messages = {
  bot_reminder_title: '🔔 *RECORDATORIO DE TURNO*',
  bot_reminder_single: (name: string, svc: string, date: string, tenant: string) =>
  `Hola ${name}, te recordamos tu cita de *${svc}* para mañana a las *${date}* en _${tenant}_.\n\n¿Confirmas tu asistencia? Responde SI para confirmar.`,
  bot_reminder_multi: (name: string, count: number, tenant: string) =>
  `Hola ${name}, tienes *${count} citas* para mañana en _${tenant}_:\n\n`,
  bot_reminder_confirm_all: '\n¿Confirmas tu asistencia? Responde SI para confirmar.',
  reminder_immediate: 'Por favor, confirma respondiendo *SÍ* o cancela con *NO*.',
  bot_new_title: '✅ <b>NUEVA CITA AGENDADA</b>',
  bot_new_desc: (name: string, svc: string, prof: string, date: string) =>
  `Hola ${name}, te confirmamos tu turno para <b>${svc}</b> con <b>${prof}</b>.\n\n📅 Fecha: <b>${date}</b>.\n\n¡Te esperamos!`,
  bot_cancellation_title: '⚠️ <b>CITA CANCELADA</b>',
  bot_cancellation_desc: (name: string, svc: string, date: string, tenant: string) =>
  `Hola ${name}, lamentamos informarte que tu cita para <b>${svc}</b> el día <b>${date}</b> en <b>${tenant}</b> ha sido cancelada por imprevistos en la clínica.\n\nNos pondremos en contacto contigo a la brevedad para reagendar. ¡Disculpa las molestias!`,
  send_whatsapp: 'Enviar WhatsApp',
};

export const es_whatsapp_chat = {
  bot_paused: 'Bot Pausado',
  reactivate_bot: 'Reactivar Bot',
  reactivate_bot_confirm: 'El asistente automático volverá a responder a este paciente. ¿Continuar?',
  bot_reactivated: 'Bot reactivado correctamente',
  bot_reactivate_error: 'Error al reactivar el bot',
};
