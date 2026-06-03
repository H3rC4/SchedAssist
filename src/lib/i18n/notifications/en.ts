export const en_notifications = {
  notifications_title: 'Live Notifications',
  notifications_empty: 'No notifications yet',
  notifications_empty_desc: 'Appointment activity will appear here in real time.',
  notifications_mark_all_read: 'Mark all read',
  notification_new_appointment: 'New Appointment',
  notification_appointment_cancelled: 'Appointment Cancelled',
  notification_appointment_rescheduled: 'Appointment Rescheduled',
  notification_professional_blocked: 'Day Cancelled',
  notification_appointment_confirmed: 'Appointment Confirmed',
  notification_appointment_attended: 'Appointment Attended',
  notification_plan_activated: 'Plan Activated',
  notification_status_changed: 'Status Changed',
  notify_body_created: (patient: string, professional: string, date: string, time: string) =>
  `${patient} booked with ${professional} for ${date} at ${time}`,
  notify_body_cancelled: (patient: string, professional: string, date: string) =>
  `${patient}'s appointment with ${professional} on ${date} was cancelled`,
  notify_body_rescheduled: (patient: string, oldDate: string, newDate: string, professional: string) =>
  `${patient} moved from ${oldDate} to ${newDate} with ${professional}`,
  notify_body_blocked: (professional: string, date: string, count: number) =>
  `${professional} cancelled ${date}. ${count} appointment(s) need to be rescheduled.`,
  notify_body_confirmed: (patient: string, professional: string, date: string, time: string) =>
  `${patient} confirmed appointment with ${professional} for ${date} at ${time}`,
  notify_body_attended: (patient: string, professional: string, date: string) =>
  `${patient} attended appointment with ${professional} on ${date}`,
  notify_body_plan_activated: (plan: string, billingCycle: string) =>
  `Your ${plan} plan (${billingCycle}) has been successfully activated.`,
};
