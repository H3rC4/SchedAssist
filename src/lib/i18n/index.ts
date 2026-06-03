import { Language, dateLocales } from './types';

import { en_general } from './general/en';
import { es_general } from './general/es';
import { it_general } from './general/it';

import { en_sidebar } from './sidebar/en';
import { es_sidebar } from './sidebar/es';
import { it_sidebar } from './sidebar/it';

import { en_dashboard_hero___metrics, en_dashboard_preview, en_final_cta, en_dashboard_extras } from './dashboard/en';
import { es_dashboard_hero___metrics, es_dashboard_preview, es_final_cta, es_dashboard_extras } from './dashboard/es';
import { it_dashboard_hero___metrics, it_dashboard_preview, it_final_cta, it_dashboard_extras } from './dashboard/it';

import { en_booking_portal_access, en_whatsapp_page } from './booking-portal/en';
import { es_booking_portal_access, es_whatsapp_page } from './booking-portal/es';
import { it_booking_portal_access, it_whatsapp_page } from './booking-portal/it';

import { en_settings_navigation, en_general_settings, en_billing_tab, en_other_settings } from './settings/en';
import { es_settings_navigation, es_general_settings, es_billing_tab, es_other_settings } from './settings/es';
import { it_settings_navigation, it_general_settings, it_billing_tab, it_other_settings } from './settings/it';

import { en_whatsapp_tab, en_bot_messages, en_whatsapp_chat } from './whatsapp/en';
import { es_whatsapp_tab, es_bot_messages, es_whatsapp_chat } from './whatsapp/es';
import { it_whatsapp_tab, it_bot_messages, it_whatsapp_chat } from './whatsapp/it';

import { en_waitlist, en_appointments_calendar } from './appointments/en';
import { es_waitlist, es_appointments_calendar } from './appointments/es';
import { it_waitlist, it_appointments_calendar } from './appointments/it';

import { en_nav, en_hero, en_features_section, en_whatsapp_chat_preview, en_pricing, en_customization, en_footer, en_landing_rebranded } from './landing/en';
import { es_nav, es_hero, es_features_section, es_whatsapp_chat_preview, es_pricing, es_customization, es_footer, es_landing_rebranded } from './landing/es';
import { it_nav, it_hero, it_features_section, it_whatsapp_chat_preview, it_pricing, it_customization, it_footer, it_landing_rebranded } from './landing/it';

import { en_guided_tour, en_login } from './tour/en';
import { es_login, es_tour_guiado } from './tour/es';
import { it_login, it_tour_guidato } from './tour/it';

import { en_analytics___extras } from './analytics/en';
import { es_analytics___extras } from './analytics/es';
import { it_analytics___extras } from './analytics/it';

import { en_notifications } from './notifications/en';
import { es_notifications } from './notifications/es';
import { it_notifications } from './notifications/it';

import { en_booking } from './booking/en';
import { es_booking } from './booking/es';
import { it_booking } from './booking/it';

export const translations = {
  en: {
    ...en_general,
    ...en_sidebar,
    ...en_dashboard_hero___metrics,
    ...en_booking_portal_access,
    ...en_settings_navigation,
    ...en_general_settings,
    ...en_whatsapp_tab,
    ...en_billing_tab,
    ...en_other_settings,
    ...en_bot_messages,
    ...en_waitlist,
    ...en_appointments_calendar,
    ...en_nav,
    ...en_hero,
    ...en_features_section,
    ...en_whatsapp_chat_preview,
    ...en_dashboard_preview,
    ...en_pricing,
    ...en_customization,
    ...en_footer,
    ...en_landing_rebranded,
    ...en_final_cta,
    ...en_login,
    ...en_guided_tour,
    ...en_dashboard_extras,
    ...en_analytics___extras,
    ...en_whatsapp_page,
    ...en_notifications,
    ...en_whatsapp_chat,
    ...en_booking,
  },
  es: {
    ...es_general,
    ...es_sidebar,
    ...es_dashboard_hero___metrics,
    ...es_settings_navigation,
    ...es_general_settings,
    ...es_whatsapp_tab,
    ...es_billing_tab,
    ...es_other_settings,
    ...es_bot_messages,
    ...es_waitlist,
    ...es_appointments_calendar,
    ...es_nav,
    ...es_hero,
    ...es_features_section,
    ...es_whatsapp_chat_preview,
    ...es_dashboard_preview,
    ...es_pricing,
    ...es_customization,
    ...es_footer,
    ...es_landing_rebranded,
    ...es_final_cta,
    ...es_login,
    ...es_tour_guiado,
    ...es_dashboard_extras,
    ...es_analytics___extras,
    ...es_booking_portal_access,
    ...es_whatsapp_page,
    ...es_notifications,
    ...es_whatsapp_chat,
    ...es_booking,
  },
  it: {
    ...it_general,
    ...it_sidebar,
    ...it_dashboard_hero___metrics,
    ...it_settings_navigation,
    ...it_general_settings,
    ...it_whatsapp_tab,
    ...it_billing_tab,
    ...it_other_settings,
    ...it_bot_messages,
    ...it_waitlist,
    ...it_appointments_calendar,
    ...it_nav,
    ...it_hero,
    ...it_features_section,
    ...it_whatsapp_chat_preview,
    ...it_dashboard_preview,
    ...it_pricing,
    ...it_customization,
    ...it_footer,
    ...it_landing_rebranded,
    ...it_final_cta,
    ...it_login,
    ...it_tour_guidato,
    ...it_dashboard_extras,
    ...it_analytics___extras,
    ...it_booking_portal_access,
    ...it_whatsapp_page,
    ...it_notifications,
    ...it_whatsapp_chat,
    ...it_booking,
  },
};
