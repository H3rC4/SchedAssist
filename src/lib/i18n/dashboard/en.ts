export const en_dashboard_hero___metrics = {
  system_active: 'System Online',
  welcome: 'Welcome,',
  new_patient: 'New Patient',
  active_patients: 'Active Patients',
  generate_report: 'Generate Report',
  reserved: 'Reserved',
  professional_created: 'Professional created successfully',
  adding_professional: 'Add Professional',
  awaiting: 'Waiting Confirmation',
  see_full_calendar: 'View Full Calendar',
  full_calendar: 'Full Calendar',
  operational_pulse: 'Operational Pulse',
  operational_intelligence: 'Operational Intelligence',
  patient_interface: 'Patient Interface',
  booking_portal_active: 'Booking Portal is Active',
  view_portal: 'View Portal',
  precision_goal: 'Precision Goal',
  monthly_growth: 'Monthly Growth',
  generate_full_report: 'Generate Full Report',
  export_report: 'Export Report',
  no_activity_today: 'No activity today',
  bot_appointments_will_appear: 'Bot appointments will appear here automatically.',
  workload: 'Workload 🚀',
  workload_desc: (count: number) => `You have ${count} appointments pending reschedule due to professional cancellations.`,
  effectiveness: 'Effectiveness',
  manage_requests: 'Manage Requests',
  pending_notification_title: 'PENDING RESCHEDULE',
  mark_as_notified: 'Mark as Handled',
  notified_success: 'Done!',
  total_pending_calls: 'Pending contacts',
  notification_notes_placeholder: 'Notes about the contact...',
  call_summary: 'Contact summary',
};

export const en_dashboard_preview = {
  dashboard_today_panel: "Today's Panel",
  // upcoming_synchronizations removed (duplicate)
  dashboard_progress: 'Optimization Progress',
  clients_title: 'Patients',
};

export const en_final_cta = {
  final_cta: 'Ready to Transform Your Clinic?',
  final_cta_btn: 'Start Your 14-Day Free Trial',
};

export const en_dashboard_extras = {
  weekly_activity: 'Weekly Activity',
  appointments: 'Appointments',
  appointment: 'Appointment',
  appointments_volume: 'Appointment volume per day',
  distribution: 'Distribution',
  estimated_revenue: 'Estimated Revenue',
  appointments_completed: 'Completed appointments',
  activity_progress: 'Activity Progress',
  activity_desc: (p: number) => p > 0 ? `${p}% of active appointments have been completed.` : 'No activity to show today.',
  whatsapp_banner: {
  desc: 'Automate your clinic 24/7. Connect your number and reduce no-shows.',
  cta: 'Get Access'
  },
  no_data_to_export: 'No appointments in the last 30 days to export',
  csv_headers: {
  client: 'Client',
  },
};
