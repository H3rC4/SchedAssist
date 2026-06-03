export const en_whatsapp_tab = {
  whatsapp_integration: 'WhatsApp Integration',
  whatsapp_integration_desc: 'Automated Patient Communication Gateway',
  add_account: 'Add New Account',
  connect_business: 'Connect Business Account',
  account_label: 'Account Label',
  phone_id_label: 'Phone Number ID',
  token_label: 'Access Token',
  confirm_integration: 'Confirm Integration',
  integration_status: 'Integration Status',
  active_instance: 'Active Instance',
  link_required: 'Link Required',
  whatsapp_active_desc: 'Your primary account is linked. Automated reminders and clinical follow-ups are active.',
  whatsapp_inactive_desc: 'Connect your WhatsApp Business API account to enable automated reminders and sequential waitlist notifications.',
  qr_notice: 'Business accounts require API configuration. Standard QR pairing is for personal instances.',
  read_docs: 'Read Documentation',
  auto_reminders: 'Automated Reminders',
  reminders_desc: 'Send automatic confirmations 24 hours before scheduled visits.',
  on: 'On',
  off: 'Off',
  clinical_templates: 'Clinical Templates',
  manage_templates: 'Manage Cloud API Templates',
  preview_logic: 'Preview Logic',
  template_conf_text: 'Hi [Patient], your visit is confirmed for [Date] at [Time]. Please confirm attendance.',
  template_wait_text: 'Good news! A slot opened for today at [Time]. Would you like to take it?',
  template_feedback_text: 'Thank you for visiting [Clinic]. Please rate your experience: [Link]',
};

export const en_bot_messages = {
  bot_reminder_title: '🔔 *APPOINTMENT REMINDER*',
  bot_reminder_single: (name: string, svc: string, date: string, tenant: string) =>
  `Hello ${name}, we remind you of your *${svc}* appointment tomorrow at *${date}* at _${tenant}_.\n\nDo you confirm your attendance? Reply YES to confirm.`,
  bot_reminder_multi: (name: string, count: number, tenant: string) =>
  `Hello ${name}, you have *${count} appointments* tomorrow at _${tenant}_:\n\n`,
  bot_reminder_confirm_all: '\nDo you confirm your attendance? Reply YES to confirm.',
  reminder_immediate: 'Please, confirm your attendance by replying *YES* or cancel by replying *NO*.',
  bot_new_title: '✅ <b>NEW APPOINTMENT SCHEDULED</b>',
  bot_new_desc: (name: string, svc: string, prof: string, date: string) =>
  `Hello ${name}, your appointment for <b>${svc}</b> with <b>${prof}</b> is confirmed.\n\n📅 Date: <b>${date}</b>.\n\nSee you soon!`,
  bot_cancellation_title: '⚠️ <b>APPOINTMENT CANCELLED</b>',
  bot_cancellation_desc: (name: string, svc: string, date: string, tenant: string) =>
  `Hello ${name}, we regret to inform you that your appointment for <b>${svc}</b> on <b>${date}</b> at <b>${tenant}</b> has been cancelled due to unforeseen circumstances at the clinic.\n\nWe will contact you shortly to reschedule. Sorry for the inconvenience!`,
  send_whatsapp: 'Send WhatsApp',
};

export const en_whatsapp_chat = {
  bot_paused: 'Bot Paused',
  reactivate_bot: 'Reactivate Bot',
  reactivate_bot_confirm: 'The automatic assistant will respond to this patient again. Continue?',
  bot_reactivated: 'Bot reactivated successfully',
  bot_reactivate_error: 'Error reactivating bot',
};
