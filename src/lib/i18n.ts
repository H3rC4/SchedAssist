import { es, it, enUS } from 'date-fns/locale';

export type Language = 'en' | 'es' | 'it';

export const dateLocales = {
  en: enUS,
  es: es,
  it: it
};

export const translations = {
  en: {
    // General
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    error: 'Error',
    success: 'Success',
    
    // Sidebar
    nav_home: 'Dashboard',
    nav_calendar: 'Calendar',
    nav_patients: 'Patients',
    nav_staff: 'Staff',
    nav_services: 'Services',
    nav_settings: 'Settings',

    // Dashboard Hero & Metrics
    system_active: 'System Online',
    welcome: 'Welcome,',
    export_report: 'Export Report',
    new_appointment: 'New Appointment',
    total_appointments: 'Total Appointments',
    active_patients: 'Active Patients',
    confirmed: 'Confirmed',
    pending: 'Pending',
    upcoming_appointments: 'Upcoming Appointments',
    see_full_calendar: 'View Full Calendar',
    no_activity_today: 'No activity today',
    bot_appointments_will_appear: 'Bot appointments will appear here automatically.',
    workload: 'Workload 🚀',
    workload_desc: (count: number) => `You have ${count} pending requests. Approving them now helps maintain a high conversion rate.`,
    effectiveness: 'Effectiveness',
    manage_requests: 'Manage Requests',
    canceled: 'Canceled',
    awaiting: 'Awaiting',

    // Settings
    system_settings: 'System Settings',
    whapi_integration: 'Whapi.Cloud Integration',
    whapi_desc: 'Configure your Whapi.Cloud channel to enable automated messaging and the AI booking assistant.',
    phone_id_label: 'Channel ID',
    access_token_label: 'API Token',
    verify_token_label: 'Channel Secret (Opcional)',
    webhook_instruction: 'Configure this URL and the Verify Token in your Meta Developers Console.',
    save_config: 'Save Configuration',
    config_saved: 'Configuration saved!',
    active: 'Active',
    not_configured: 'Not configured',
    change_password: 'Change Password',
    new_password: 'New Password',
    confirm_password: 'Confirm Password',
    update: 'Update',
    passwords_mismatch: 'Passwords do not match.',
    password_length: 'Password must be at least 6 characters.',
    password_updated: 'Password updated successfully!',
    language_settings: 'Language Settings',
    system_language: 'System Language',
    bot_language_desc: 'This language will be used in the dashboard and Bot messages.',

    // Bot Messages
    bot_reminder_title: '🔔 *APPOINTMENT REMINDER*',
    bot_reminder_single: (name: string, svc: string, date: string, tenant: string) => 
      `Hello ${name}, we remind you of your *${svc}* appointment tomorrow at *${date}* at _${tenant}_.\n\nDo you confirm your attendance? Reply YES to confirm.`,
    bot_reminder_multi: (name: string, count: number, tenant: string) => 
      `Hello ${name}, you have *${count} appointments* tomorrow at _${tenant}_:\n\n`,
    bot_reminder_confirm_all: '\nDo you confirm your attendance? Reply YES to confirm.',
    
    bot_new_title: '✅ <b>NEW APPOINTMENT SCHEDULED</b>',
    bot_new_desc: (name: string, svc: string, prof: string, date: string) => 
      `Hello ${name}, your appointment for <b>${svc}</b> with <b>${prof}</b> is confirmed.\n\n📅 Date: <b>${date}</b>.\n\nSee you soon!`,

    // Appointments Calendar
    schedule_appointment: 'Schedule Appointment',
    manual_entry: 'Manual patient entry',
    search_patient: 'Search existing patient',
    search_placeholder: 'Name, last name or phone...',
    or_new_patient: 'Or enter a new patient',
    when: 'For when?',
    name: 'First Name',
    last_name: 'Last Name',
    phone: 'Phone / WhatsApp',
    service: 'Service',
    professional: 'Specialist',
    available_slots: 'Available Slots',
    no_slots: 'No slots available.',
    reserving: 'Reserving...',
    confirm_booking: 'FINALIZE BOOKING',
    err_occupied: 'The professional already has an appointment booked for that time.',
    err_not_working: 'The professional is not available at the selected time.',
    err_generic: 'Error creating the appointment.',
    daily_view: 'Daily View',
    appointments_list: 'ACTIVE APPOINTMENTS',
    create_first: 'Create first appointment →',
    cancel_title: 'Are you sure you want to cancel this appointment?',
    notes: 'Interest notes',
    cancel_btn: 'Cancel Appointment',

    // Landing Page
    landing: {
      hero_badge: 'Multi-Tenant System Active',
      hero_title_1: 'The Power of WhatsApp,',
      hero_title_2: 'Fully Automated.',
      hero_subtitle: 'Schedule appointments, reduce no-shows, and serve your patients 24/7 autonomously. The ultimate infrastructure for your clinic.',
      hero_cta: 'Register Now!',
      nav_login: 'Login',
      feature_1_title: 'Native WhatsApp',
      feature_1_desc: 'Direct integration with your number. No high costs or Meta API restrictions. 100% autonomous.',
      feature_2_title: 'Conversational AI',
      feature_2_desc: 'Advanced state machine. Auto-skip specialists, user recognition, and dynamic cancellations.',
      feature_3_title: 'Omni-Dashboard',
      feature_3_desc: 'Master control for unlimited clinics. Manage staff, schedules, and real-time revenue control.',
      
      // New Customization Section
      custom_title: 'Full Scheduling Control',
      custom_subtitle: 'Flexibility that adapts to your workflow.',
      custom_feature_1: 'Personalized Schedules',
      custom_feature_1_desc: 'Each specialist defines their own work days and time slots.',
      custom_feature_2: 'Service durations',
      custom_feature_2_desc: 'Define how long each type of appointment takes to optimize your agenda.',
      custom_feature_3: 'Instant Blockers',
      custom_feature_3_desc: 'Block holidays or time-off in one click directly from the dashboard.',
      
      final_cta: 'Ready to automate your clinic?',
      
      // Login Form Specific
      login_card_title: 'Sign In',
      email_label: 'Email Address',
      password_label: 'Password',
      forgot_password: 'Forgot Password?',
      remember_me: 'Keep me signed in',
      login_button: 'Sign In',
      no_client_yet: 'Not a client yet?',
      contact_sales: 'Contact Sales',
      back_home: 'Back to Home',
    }
  },
  es: {
    // General
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    error: 'Error',
    success: 'Éxito',

    // Sidebar
    nav_home: 'Inicio',
    nav_calendar: 'Agenda',
    nav_patients: 'Pacientes',
    nav_staff: 'Especialistas',
    nav_services: 'Servicios',
    nav_settings: 'Ajustes',

    // Dashboard Hero & Metrics
    system_active: 'Sistema Online',
    welcome: 'Bienvenido,',
    export_report: 'Exportar Reporte',
    new_appointment: 'Nueva Cita',
    total_appointments: 'Citas Totales',
    active_patients: 'Pacientes Activos',
    confirmed: 'Confirmadas',
    pending: 'En Cola',
    upcoming_appointments: 'Próximas Citas',
    see_full_calendar: 'Ver Agenda Completa',
    no_activity_today: 'Sin actividad hoy',
    bot_appointments_will_appear: 'Los turnos del bot aparecerán aquí automáticamente.',
    workload: 'Carga de Trabajo 🚀',
    workload_desc: (count: number) => `Tienes ${count} solicitudes pendientes. Revisar ahora ayudará a mantener un alto % de conversión.`,
    effectiveness: 'Efectividad Confirmadas',
    manage_requests: 'Gestionar Solicitudes',
    canceled: 'Cancelada',
    awaiting: 'Pendiente',

    // Settings
    system_settings: 'Ajustes del Sistema',
    whapi_integration: 'Integración Whapi.Cloud',
    whapi_desc: 'Configura tu canal de Whapi.Cloud para habilitar la mensajería automatizada y el asistente de reservas con IA.',
    phone_id_label: 'ID del Canal',
    access_token_label: 'Token de API',
    verify_token_label: 'Secreto del Canal (Opcional)',
    webhook_instruction: 'Configura esta URL y el Token de Verificación en el panel de Meta for Developers.',
    save_config: 'Guardar Configuración',
    config_saved: '¡Configuración guardada!',
    active: 'Activo',
    not_configured: 'No configurado',
    change_password: 'Cambiar Contraseña',
    new_password: 'Nueva Contraseña',
    confirm_password: 'Confirmar Password',
    update: 'Actualizar',
    passwords_mismatch: 'Las contraseñas no coinciden.',
    password_length: 'La contraseña debe tener al menos 6 caracteres.',
    password_updated: '¡Contraseña actualizada con éxito!',
    language_settings: 'Ajustes de Idioma',
    system_language: 'Idioma del Sistema',
    bot_language_desc: 'Este idioma se utilizará en el panel central y en los mensajes del Bot.',

    // Bot Messages
    bot_reminder_title: '🔔 *RECORDATORIO DE TURNO*',
    bot_reminder_single: (name: string, svc: string, date: string, tenant: string) => 
      `Hola ${name}, te recordamos tu cita de *${svc}* para mañana a las *${date}* en _${tenant}_.\n\n¿Confirmas tu asistencia? Responde SI para confirmar.`,
    bot_reminder_multi: (name: string, count: number, tenant: string) => 
      `Hola ${name}, tienes *${count} citas* para mañana en _${tenant}_:\n\n`,
    bot_reminder_confirm_all: '\n¿Confirmas tu asistencia? Responde SI para confirmar.',
    
    bot_new_title: '✅ <b>NUEVA CITA AGENDADA</b>',
    bot_new_desc: (name: string, svc: string, prof: string, date: string) => 
      `Hola ${name}, te confirmamos tu turno para <b>${svc}</b> con <b>${prof}</b>.\n\n📅 Fecha: <b>${date}</b>.\n\n¡Te esperamos!`,

    // Appointments Calendar
    schedule_appointment: 'Agendar Turno',
    manual_entry: 'Carga manual de paciente',
    search_patient: 'Buscar paciente existente',
    search_placeholder: 'Nombre, apellido o teléfono...',
    or_new_patient: 'O ingresar nuevo paciente',
    when: '¿Para cuándo?',
    name: 'Nombre',
    last_name: 'Apellido',
    phone: 'Teléfono / WhatsApp',
    service: 'Servicio',
    professional: 'Especialista',
    available_slots: 'Horarios Disponibles',
    no_slots: 'Sin turnos disponibles.',
    reserving: 'Reservando...',
    confirm_booking: 'FINALIZAR RESERVA',
    err_occupied: 'El profesional ya tiene una cita reservada para ese horario.',
    err_not_working: 'El profesional no atiende en el horario seleccionado.',
    err_generic: 'Error al crear el turno.',
    daily_view: 'Visión Diaria',
    appointments_list: 'TURNOS ACTIVOS',
    create_first: 'Crear primer turno →',
    cancel_title: '¿Seguro que deseas cancelar este turno?',
    notes: 'Notas de interés',
    cancel_btn: 'Cancelar Cita',

    // Landing Page
    landing: {
      hero_badge: 'Sistema Multi-Tenant Activo',
      hero_title_1: 'El Poder de WhatsApp,',
      hero_title_2: 'Totalmente Automatizado.',
      hero_subtitle: 'Agenda citas, reduce ausencias y atiende a tus pacientes 24/7 de forma autónoma. La infraestructura definitiva para tu clínica.',
      hero_cta: '¡Regístrate Ahora!',
      nav_login: 'Iniciar Sesión',
      feature_1_title: 'WhatsApp Nativo',
      feature_1_desc: 'Integración directa con tu número. Sin costes elevados ni restricciones de Meta API. 100% autónomo.',
      feature_2_title: 'IA Conversacional',
      feature_2_desc: 'Máquina de estados avanzada. Auto-skip de médicos, reconocimiento de usuarios y cancelaciones dinámicas.',
      feature_3_title: 'Omni-Dashboard',
      feature_3_desc: 'Control maestro para clínicas ilimitadas. Gestor de médicos, horarios y control de ingresos en tiempo real.',
      
      // Nueva sección de personalización
      custom_title: 'Control Total de Agendamiento',
      custom_subtitle: 'Flexibilidad que se adapta a tu flujo de trabajo.',
      custom_feature_1: 'Horarios Personalizados',
      custom_feature_1_desc: 'Cada especialista define sus propios días y rangos horarios de atención.',
      custom_feature_2: 'Duración por Servicio',
      custom_feature_2_desc: 'Define cuánto tiempo toma cada tipo de cita para optimizar tu agenda.',
      custom_feature_3: 'Bloqueos al Instante',
      custom_feature_3_desc: 'Bloquea vacaciones o descansos con un clic directamente desde el panel.',
      
      final_cta: '¿Listo para automatizar tu clínica?',
      
      // Login Form Specific
      login_card_title: 'Acceder',
      email_label: 'Correo electrónico',
      password_label: 'Contraseña',
      forgot_password: '¿Olvidaste tu contraseña?',
      remember_me: 'Mantener sesión iniciada',
      login_button: 'Ingresar',
      no_client_yet: '¿Aún no eres cliente?',
      contact_sales: 'Contacta con Ventas',
      back_home: 'Volver al inicio',
    }
  },
  it: {
    // General
    loading: 'Caricamento...',
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    create: 'Crea',
    error: 'Errore',
    success: 'Successo',

    // Sidebar
    nav_home: 'Dashboard',
    nav_calendar: 'Agenda',
    nav_patients: 'Pazienti',
    nav_staff: 'Specialisti',
    nav_services: 'Servizi',
    nav_settings: 'Impostazioni',

    // Dashboard Hero & Metrics
    system_active: 'Sistema Attivo',
    welcome: 'Benvenuto,',
    export_report: 'Esporta Report',
    new_appointment: 'Nuovo Appuntamento',
    total_appointments: 'Appuntamenti Totali',
    active_patients: 'Pazienti Attivi',
    confirmed: 'Confermati',
    pending: 'In Coda',
    upcoming_appointments: 'Prossimi Appuntamenti',
    see_full_calendar: 'Vedi Agenda Completa',
    no_activity_today: 'Nessuna attività oggi',
    bot_appointments_will_appear: 'Gli appuntamenti del bot appariranno qui automaticamente.',
    workload: 'Carico di Lavoro 🚀',
    workload_desc: (count: number) => `Hai ${count} richieste in attesa. Controllare ora aiuterà a mantenere alta la conversione.`,
    effectiveness: 'Efficacia Conferme',
    manage_requests: 'Gestisci Richieste',
    canceled: 'Annullato',
    awaiting: 'In attesa',

    // Settings
    system_settings: 'Impostazioni di Sistema',
    whapi_integration: 'Integrazione Whapi.Cloud',
    whapi_desc: 'Configura il tuo canale Whapi.Cloud per abilitare la messaggistica automatizzata e l\'assistente di prenotazione AI.',
    phone_id_label: 'ID Canale',
    access_token_label: 'Token API',
    verify_token_label: 'Segreto del Canale (Opzionale)',
    webhook_instruction: 'Configura questo URL nel tuo pannello Whapi.Cloud.',
    save_config: 'Salva Configurazione',
    config_saved: 'Configurazione salvata!',
    active: 'Attivo',
    not_configured: 'Non configurato',
    change_password: 'Cambia Password',
    new_password: 'Nuova Password',
    confirm_password: 'Conferma Password',
    update: 'Aggiorna',
    passwords_mismatch: 'Le password non coincidono.',
    password_length: 'La password deve avere almeno 6 caratteri.',
    password_updated: 'Password aggiornata con successo!',
    language_settings: 'Impostazioni Lingua',
    system_language: 'Lingua del Sistema',
    bot_language_desc: 'Questa lingua sarà utilizzata nel pannello dashboard e nei messaggi del Bot.',

    // Bot Messages
    bot_reminder_title: '🔔 *PROMEMORIA APPUNTAMENTO*',
    bot_reminder_single: (name: string, svc: string, date: string, tenant: string) => 
      `Ciao ${name}, ti ricordiamo la tua visita per *${svc}* domani alle *${date}* in _${tenant}_.\n\nConfermi la tua presenza? Rispondi SI per confermare.`,
    bot_reminder_multi: (name: string, count: number, tenant: string) => 
      `Ciao ${name}, hai *${count} appuntamenti* programmati domani in _${tenant}_:\n\n`,
    bot_reminder_confirm_all: '\nConfermi la tua presenza? Rispondi SI per confermare.',
    
    bot_new_title: '✅ <b>NUOVO APPUNTAMENTO PROGRAMMATO</b>',
    bot_new_desc: (name: string, svc: string, prof: string, date: string) => 
      `Ciao ${name}, ti confermiamo il tuo appuntamento per <b>${svc}</b> con <b>${prof}</b>.\n\n📅 Data: <b>${date}</b>.\n\nTi aspettiamo!`,

    // Appointments Calendar
    schedule_appointment: 'Prenota Appuntamento',
    manual_entry: 'Inserimento manuale paziente',
    search_patient: 'Cerca paziente esistente',
    search_placeholder: 'Nome, cognome o telefono...',
    or_new_patient: 'Oppure inserisci nuovo paziente',
    when: 'Per quando?',
    name: 'Nome',
    last_name: 'Cognome',
    phone: 'Telefono / WhatsApp',
    service: 'Servizio',
    professional: 'Specialista',
    available_slots: 'Orari Disponibili',
    no_slots: 'Nessun orario disponibile.',
    reserving: 'Prenotazione...',
    confirm_booking: 'FINALIZZA PRENOTAZIONE',
    err_occupied: 'Il professionista ha già una visita prenotata in quell\'orario.',
    err_not_working: 'Il professionista non è disponibile nell\'orario selezionato.',
    err_generic: 'Errore durante la creazione dell\'appuntamento.',
    daily_view: 'Vista Giornaliera',
    appointments_list: 'APPUNTAMENTI ATTIVI',
    create_first: 'Crea primo appuntamento →',
    cancel_title: 'Sei sicuro di voler annullare questo appuntamento?',
    notes: 'Note di interesse',
    cancel_btn: 'Annulla Appuntamento',

    // Landing Page
    landing: {
      hero_badge: 'Sistema Multi-Tenant Attivo',
      hero_title_1: 'Il Potere di WhatsApp,',
      hero_title_2: 'Completamente Automatizzato.',
      hero_subtitle: 'Prenota appuntamenti, riduci le assenze e servi i tuoi pazienti 24/7 in modo autonomo. L\'infrastruttura definitiva per la tua clinica.',
      hero_cta: 'Registrati ora!',
      nav_login: 'Accedi',
      feature_1_title: 'WhatsApp Nativo',
      feature_1_desc: 'Integrazione diretta con il tuo numero. Senza costi elevati o restrizioni di Meta API. 100% autonomo.',
      feature_2_title: 'IA Conversacional',
      feature_2_desc: 'Macchina a stati avanzata. Auto-skip degli specialisti, riconoscimento utenti e cancellazioni dinamiche.',
      feature_3_title: 'Omni-Dashboard',
      feature_3_desc: 'Controllo master per cliniche illimitate. Gestione staff, orari e controllo ricavi in tempo reale.',
      
      // Nuova sezione di personalización
      custom_title: 'Controllo Totale della Pianificazione',
      custom_subtitle: 'Flessibilità che si adatta al tuo flusso di lavoro.',
      custom_feature_1: 'Orari Personalizzati',
      custom_feature_1_desc: 'Ogni specialista definisce i propri giorni e fasce orarie di ricezione.',
      custom_feature_2: 'Durata per Servizio',
      custom_feature_2_desc: 'Definisci la durata di ogni tipo di appuntamento per ottimizzare l\'agenda.',
      custom_feature_3: 'Blocchi Istantanei',
      custom_feature_3_desc: 'Blocca vacanze o pause con un clic direttamente dal pannello.',
      
      final_cta: 'Pronto ad automatizzare la tua clinica?',
      
      // Login Form Specific
      login_card_title: 'Accedere',
      email_label: 'Indirizzo e-mail',
      password_label: 'Password',
      forgot_password: 'Password dimenticata?',
      remember_me: 'Rimani collegato',
      login_button: 'Accedi',
      no_client_yet: 'Non sei ancora cliente?',
      contact_sales: 'Contatta il Reparto Vendite',
      back_home: 'Torna alla Home',
    }
  }
};
