export const es_dashboard_hero___metrics = {
  system_active: 'Sistema Online',
  welcome: 'Bienvenido,',
  new_patient: 'Nuevo Paciente',
  active_patients: 'Pacientes Activos',
  awaiting: 'Por Confirmar',
  see_full_calendar: 'Ver Agenda Completa',
  full_calendar: 'Agenda Completa',
  operational_pulse: 'Pulso Operativo',
  operational_intelligence: 'Inteligencia Operativa',
  patient_interface: 'Interfaz de Paciente',
  booking_portal_active: 'Portal de Reservas Activo',
  view_portal: 'Ver Portal',
  precision_goal: 'Objetivo de Precisión',
  monthly_growth: 'Crecimiento Mensual',
  generate_report: 'Generar Reporte',
  generate_full_report: 'Generar Reporte Completo',
  export_report: 'Exportar Reporte',
  no_activity_today: 'Sin actividad hoy',
  bot_appointments_will_appear: 'Los turnos del bot aparecerán aquí automáticamente.',
  workload: 'Carga de Trabajo 🚀',
  workload_desc: (count: number) => `Tienes ${count} citas pendientes de reprogramar por cancelaciones del profesional.`,
  effectiveness: 'Efectividad Confirmadas',
  manage_requests: 'Gestionar Solicitudes',
  pending_notification_title: 'PENDIENTES POR REPROGRAMAR',
  pending_cancellation: 'PENDIENTE REPROGRAMAR',
  mark_as_notified: 'Marcar como Gestionado',
  notified_success: '¡Gestionado!',
  total_pending_calls: 'Contactos pendientes',
  notification_notes_placeholder: 'Nota sobre el contacto...',
  call_summary: 'Resumen del contacto',
};

export const es_dashboard_preview = {
  dashboard_today_panel: "Panel de Hoy",
  dashboard_progress: 'Progreso de Optimización',
  clients_title: 'Pacientes',
};

export const es_final_cta = {
  final_cta: '¿Listo para transformar tu clínica?',
  final_cta_btn: 'Comienza tu prueba gratuita de 14 días',
};

export const es_dashboard_extras = {
  weekly_activity: 'Actividad Semanal',
  appointments: 'Citas',
  appointment: 'Cita',
  appointments_volume: 'Volumen de citas por día',
  distribution: 'Distribución',
  estimated_revenue: 'Ingresos Estimados',
  appointments_completed: 'Citas completadas',
  activity_progress: 'Progreso de Actividad',
  activity_desc: (p: number) => p > 0 ? `Se ha completado el ${p}% de las citas activas.` : 'No hay actividad para mostrar hoy.',
  whatsapp_banner: {
  desc: 'Automatiza tu clínica 24/7. Conecta tu número y reduce ausencias.',
  cta: 'Activar Bot'
  },
  no_data_to_export: 'No hay citas en los últimos 30 días para exportar',
  csv_headers: {
  client: 'Cliente',
  },
};
