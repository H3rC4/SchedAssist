# Plan: Modularización de i18n.ts

> **Fecha:** 2026-05-29
> **Objetivo:** Dividir `src/lib/i18n.ts` (2907 líneas) en módulos por dominio, siguiendo el patrón ya existente en `src/lib/i18n/booking/`

---

## Estado Actual

- `src/lib/i18n.ts` = 1 archivo de 2907 líneas con ~25 const por idioma (en, es, it)
- Ya existe `src/lib/i18n/booking/` con `en.ts`, `es.ts`, `it.ts`, `index.ts` (patrón a seguir)
- 40+ archivos consumidores importan `{ translations, Language, dateLocales }` from `@/lib/i18n`
- La API pública **NO cambia** — solo la estructura interna

## Patron Existente (booking)

```
src/lib/i18n/booking/
├── en.ts          # export const en_booking = { ... }
├── es.ts          # export const es_booking = { ... }
├── it.ts          # export const it_booking = { ... }
└── index.ts       # re-exports individuales
```

## Estructura Final

```
src/lib/
├── i18n.ts                    # SOLO imports + merge + exports (types, dateLocales, translations)
└── i18n/
    ├── booking/                # ✅ YA EXISTE
    │   ├── en.ts
    │   ├── es.ts
    │   ├── it.ts
    │   └── index.ts
    ├── general/               # Fase 1
    │   ├── en.ts
    │   ├── es.ts
    │   ├── it.ts
    │   └── index.ts
    ├── sidebar/               # Fase 2
    │   └── ...
    ├── dashboard/             # Fase 2 (hero_metrics + extras + preview + final_cta)
    │   └── ...
    ├── appointments/          # Fase 3 (appointments_calendar + waitlist)
    │   └── ...
    ├── settings/              # Fase 3 (settings_navigation + general_settings + billing_tab + other_settings)
    │   └── ...
    ├── whatsapp/              # Fase 4 (whatsapp_tab + bot_messages + whatsapp_chat)
    │   └── ...
    ├── landing/               # Fase 5 (nav + hero + features + chat_preview + pricing + customization + footer + landing_rebranded)
    │   └── ...
    ├── tour/                  # Fase 6 (guided_tour + onboarding + registration)
    │   └── ...
    ├── analytics/             # Fase 6 (analytics_extras)
    │   └── ...
    ├── notifications/          # Fase 6 (notifications)
    │   └── ...
    ├── booking-portal/        # Fase 7 (booking_portal_access + whatsapp_page)
    │   └── ...
    └── types.ts               # Fase 1 - Language type + dateLocales
```

**Total:** ~13 carpetas de dominio, cada una con 4 archivos (~100-300 líneas c/u)

---

## Mapeo de Constantes por Dominio

| Carpeta | Constantes incluidas | Líneas aprox (por idioma) |
|---------|---------------------|---------------------------|
| `general` | en_general, es_general, it_general | ~190 |
| `sidebar` | en_sidebar, es_sidebar, it_sidebar | ~80 |
| `dashboard` | *_dashboard_hero___metrics, *_dashboard_extras, *_dashboard_preview, *_final_cta | ~70 |
| `appointments` | *_appointments_calendar, *_waitlist | ~40 |
| `settings` | *_settings_navigation, *_general_settings, *_billing_tab, *_other_settings | ~100 |
| `whatsapp` | *_whatsapp_tab, *_bot_messages, *_whatsapp_chat | ~60 |
| `landing` | *_nav, *_hero, *_features_section, *_whatsapp_chat_preview, *_pricing, *_customization, *_footer, *_landing_rebranded | ~220 |
| `tour` | *_guided_tour (en), *_tour_guiado (es), *_tour_guidato (it) | ~80 |
| `analytics` | *_analytics___extras | ~70 |
| `notifications` | *_notifications | ~40 |
| `booking-portal` | *_booking_portal_access, *_whatsapp_page | ~125 |
| `booking` | *_booking | ~50 (YA EXISTE) |

**Nota:** Los nombres de const en es/it difieren. Ej: `en_guided_tour` vs `es_tour_guiado` vs `it_tour_guidato`. Dentro de cada archivo se mantiene el nombre original para no romper los spreads. Si se desea, en un paso posterior se pueden renombrar para consistencia.

**Nota sobre `it_general`:** Está incompleto respecto a `en_general` (le faltan ~30 keys que existen en en/es como `next`, `finish`, `new_patient`, etc.). En la Fase 1 se debe completar.

---

## FASES DE IMPLEMENTACIÓN

Cada fase es independiente y se puede ejecutar de a una. Al final de cada fase, `npm run build` debe pasar sin errores.

---

### FASE 0: Preparación — Types + Scaffold

**Objetivo:** Crear `types.ts` y reestructurar `i18n.ts` para que importe desde módulos.

**Archivos a crear:**
1. `src/lib/i18n/types.ts` — Contiene `Language` type y `dateLocales`

```ts
// src/lib/i18n/types.ts
import { es, it, enUS } from 'date-fns/locale';

export type Language = 'en' | 'es' | 'it';

export const dateLocales = {
  en: enUS,
  es: es,
  it: it
};
```

**Archivos a modificar:**
2. `src/lib/i18n.ts` — Reemplazar definición de type/dateLocales con import, agregar imports de booking (ya existen), dejar el resto igual

**Cambios en i18n.ts:**
- Borrar: `import { es, it, enUS } from 'date-fns/locale'`
- Borrar: `export type Language = ...`
- Borrar: `export const dateLocales = { ... }`
- Agregar: `import { Language, dateLocales } from './i18n/types'`
- Los imports de booking ya existen (`import { en_booking } from './i18n/booking/en'`)

**Verificación:** `npm run build` pasa. No hay cambios funcionales.

---

### FASE 1: Extract `general`

**Objetivo:** Mover las constants `en_general`, `es_general`, `it_general` a su propio módulo.

**Archivos a crear:**
1. `src/lib/i18n/general/en.ts` — Pegar todo `en_general` (líneas ~12-197)
2. `src/lib/i18n/general/es.ts` — Pegar todo `es_general` (líneas ~930-1119)
3. `src/lib/i18n/general/it.ts` — Pegar todo `it_general` (líneas ~1862-2135) **+ completar keys faltantes**
4. `src/lib/i18n/general/index.ts` — Re-exports

**Archivos a modificar:**
5. `src/lib/i18n.ts` — Reemplazar la definición inline de `en_general`, `es_general`, `it_general` con imports:
   ```ts
   import { en_general } from './i18n/general/en';
   import { es_general } from './i18n/general/es';
   import { it_general } from './i18n/general/it';
   ```
   Y **eliminar** las ~560 líneas de definiciones de esas 3 constants.

**⚠️ IMPORTANTE about `it_general`:** Las siguientes keys existen en `en_general` y `es_general` pero faltan en `it_general`. Se deben agregar en esta fase:

```
next, finish, upcoming_appointments, new_patient, active_patients,
total_appointments, patient_files, no_history, saved, save_error,
saving, uploading_file, registering_study, study_label, upload_success,
delete_file_confirm, deleting, delete_success, by_label, no_files_desc,
document_fallback, clinical_study_label, appointment_rescheduled_success,
appointment_created_success, reschedule_appointment_title,
confirm_cancel_appointment, appointment_cancelled,
cancellation_reason_title, mark_rescheduled_btn,
pending_cancellation, attending_professional, critical_alert, note,
add_comment_placeholder, call, identity, dni, birth_date, age, gender,
occupation, address, search_files, all, studies, consents,
upload_files_title, upload_files_desc, no_results_files, years_old,
patient_id, active_member, manage_services_btn, edit_professional,
access_title, access_email, access_pass, access_pass_hint,
access_reset_btn, access_generate_btn, access_no_account,
access_no_account_desc, confirm_reset_pass, confirm_delete_prof
```

**Verificación:** `npm run build` pasa.

---

### FASE 2: Extract `sidebar` + `dashboard`

**Objetivo:** Mover sidebar y dashboard (metrics + extras + preview + final_cta).

**Archivos a crear:**
1. `src/lib/i18n/sidebar/en.ts` — `en_sidebar` (~líneas 199-278)
2. `src/lib/i18n/sidebar/es.ts` — `es_sidebar` (~líneas 1121-1200)
3. `src/lib/i18n/sidebar/it.ts` — `it_sidebar` (~líneas 1874-1961) + las keys que faltan
4. `src/lib/i18n/sidebar/index.ts`

5. `src/lib/i18n/dashboard/en.ts` — `en_dashboard_hero___metrics` + `en_dashboard_extras` + `en_dashboard_preview` + `en_final_cta`
6. `src/lib/i18n/dashboard/es.ts` — Ídem para es
7. `src/lib/i18n/dashboard/it.ts` — Ídem para it + completar keys faltantes
8. `src/lib/i18n/dashboard/index.ts`

**Nota sobre dashboard:** Se mergean 4 consts pequeñas en 1 archivo por idioma. En el archivo:
```ts
// dashboard/en.ts
export const en_dashboard_hero___metrics = { ... };
export const en_dashboard_extras = { ... };
export const en_dashboard_preview = { ... };
export const en_final_cta = { ... };
```
En `i18n.ts` se importan todas y se spreadean igual que antes:
```ts
import { en_dashboard_hero___metrics, en_dashboard_extras, en_dashboard_preview, en_final_cta } from './i18n/dashboard/en';
```

**Archivos a modificar:**
9. `src/lib/i18n.ts` — Agregar imports, eliminar ~300 líneas de definiciones

**Verificación:** `npm run build` pasa.

---

### FASE 3: Extract `appointments` + `settings`

**Objetivo:** Mover appointments_calendar + waitlist, y settings (4 sub-consts).

**Archivos a crear:**
1. `src/lib/i18n/appointments/en.ts` — `en_appointments_calendar` + `en_waitlist`
2. `src/lib/i18n/appointments/es.ts` — Ídem para es
3. `src/lib/i18n/appointments/it.ts` — Ídem para it
4. `src/lib/i18n/appointments/index.ts`

5. `src/lib/i18n/settings/en.ts` — `en_settings_navigation` + `en_general_settings` + `en_billing_tab` + `en_other_settings`
6. `src/lib/i18n/settings/es.ts` — Ídem para es
7. `src/lib/i18n/settings/it.ts` — Ídem para it + completar keys faltantes (language_en, language_es, language_it, etc.)
8. `src/lib/i18n/settings/index.ts`

**Archivos a modificar:**
9. `src/lib/i18n.ts` — Agregar imports, eliminar ~350 líneas

**Verificación:** `npm run build` pasa.

---

### FASE 4: Extract `whatsapp` + `booking-portal`

**Objetivo:** Mover whatsapp (tab + bot_messages + chat) y booking_portal_access + whatsapp_page.

**Archivos a crear:**
1. `src/lib/i18n/whatsapp/en.ts` — `en_whatsapp_tab` + `en_bot_messages` + `en_whatsapp_chat`
2. `src/lib/i18n/whatsapp/es.ts` — Ídem para es
3. `src/lib/i18n/whatsapp/it.ts` — Ídem para it
4. `src/lib/i18n/whatsapp/index.ts`

5. `src/lib/i18n/booking-portal/en.ts` — `en_booking_portal_access` + `en_whatsapp_page`
6. `src/lib/i18n/booking-portal/es.ts` — Ídem para es
7. `src/lib/i18n/booking-portal/it.ts` — Ídem para it + completar keys faltantes (dob, insurance, etc. que existen en it_whatsapp_page)
8. `src/lib/i18n/booking-portal/index.ts`

**Archivos a modificar:**
9. `src/lib/i18n.ts` — Agregar imports, eliminar ~400 líneas

**Verificación:** `npm run build` pasa.

---

### FASE 5: Extract `landing`

**Objetivo:** Mover todo lo relacionado con la landing page (8 consts mergeadas). Es la fase más grande.

**Archivos a crear:**
1. `src/lib/i18n/landing/en.ts` — `en_nav` + `en_hero` + `en_features_section` + `en_whatsapp_chat_preview` + `en_pricing` + `en_customization` + `en_footer` + `en_landing_rebranded`
2. `src/lib/i18n/landing/es.ts` — Ídem para es
3. `src/lib/i18n/landing/it.ts` — Ídem para it
4. `src/lib/i18n/landing/index.ts`

**Archivos a modificar:**
5. `src/lib/i18n.ts` — Agregar imports, eliminar ~600 líneas

**Verificación:** `npm run build` pasa.

---

### FASE 6: Extract `tour` + `analytics` + `notifications`

**Objetivo:** Mover las 3 const restantes menores.

**Archivos a crear:**
1. `src/lib/i18n/tour/en.ts` — `en_guided_tour`
2. `src/lib/i18n/tour/es.ts` — `es_tour_guiado`
3. `src/lib/i18n/tour/it.ts` — `it_tour_guidato` + completar keys faltantes (it_login)
4. `src/lib/i18n/tour/index.ts`

5. `src/lib/i18n/analytics/en.ts` — `en_analytics___extras`
6. `src/lib/i18n/analytics/es.ts` — Ídem para es
7. `src/lib/i18n/analytics/it.ts` — Ídem para it
8. `src/lib/i18n/analytics/index.ts`

9. `src/lib/i18n/notifications/en.ts` — `en_notifications`
10. `src/lib/i18n/notifications/es.ts` — Ídem para es
11. `src/lib/i18n/notifications/it.ts` — Ídem para it
12. `src/lib/i18n/notifications/index.ts`

**Nota sobre `es_login`:** `es_login` e `it_login` existen en el archivo pero no se usan en el spread de `translations.es` (solo `es_login` está en el spread de `es`, `it_login` en `it`). Se incluyen en `tour/` como parte del registro/onboarding.

**Verificación:** `npm run build` pasa.

---

### FASE 7: Cleanup y Verificación Final

**Objetivo:** Verificar que `src/lib/i18n.ts` quedó limpio y todas las imports funcionan.

**Archivo `src/lib/i18n.ts` final debería verse así:**

```ts
import { Language, dateLocales } from './i18n/types';

// General
import { en_general } from './i18n/general/en';
import { es_general } from './i18n/general/es';
import { it_general } from './i18n/general/it';

// Sidebar
import { en_sidebar } from './i18n/sidebar/en';
import { es_sidebar } from './i18n/sidebar/es';
import { it_sidebar } from './i18n/sidebar/it';

// Dashboard
import { en_dashboard_hero___metrics, en_dashboard_extras, en_dashboard_preview, en_final_cta } from './i18n/dashboard/en';
import { es_dashboard_hero___metrics, es_dashboard_extras, es_dashboard_preview, es_final_cta } from './i18n/dashboard/es';
import { it_dashboard_hero___metrics, it_dashboard_extras, it_dashboard_preview, it_final_cta } from './i18n/dashboard/it';

// Appointments
import { en_appointments_calendar, en_waitlist } from './i18n/appointments/en';
import { es_appointments_calendar, es_waitlist } from './i18n/appointments/es';
import { it_appointments_calendar, it_waitlist } from './i18n/appointments/it';

// Settings
import { en_settings_navigation, en_general_settings, en_billing_tab, en_other_settings } from './i18n/settings/en';
import { es_settings_navigation, es_general_settings, es_billing_tab, es_other_settings } from './i18n/settings/es';
import { it_settings_navigation, it_general_settings, it_billing_tab, it_other_settings } from './i18n/settings/it';

// WhatsApp
import { en_whatsapp_tab, en_bot_messages, en_whatsapp_chat } from './i18n/whatsapp/en';
import { es_whatsapp_tab, es_bot_messages, es_whatsapp_chat } from './i18n/whatsapp/es';
import { it_whatsapp_tab, it_bot_messages, it_whatsapp_chat } from './i18n/whatsapp/it';

// Booking Portal + WhatsApp Page
import { en_booking_portal_access, en_whatsapp_page } from './i18n/booking-portal/en';
import { es_booking_portal_access, es_whatsapp_page } from './i18n/booking-portal/es';
import { it_booking_portal_access, it_whatsapp_page } from './i18n/booking-portal/it';

// Landing
import { en_nav, en_hero, en_features_section, en_whatsapp_chat_preview, en_pricing, en_customization, en_footer, en_landing_rebranded } from './i18n/landing/en';
import { es_nav, es_hero, es_features_section, es_whatsapp_chat_preview, es_pricing, es_customization, es_footer, es_landing_rebranded } from './i18n/landing/es';
import { it_nav, it_hero, it_features_section, it_whatsapp_chat_preview, it_pricing, it_customization, it_footer, it_landing_rebranded } from './i18n/landing/it';

// Tour (onboarding + registration)
import { en_guided_tour } from './i18n/tour/en';
import { es_tour_guiado } from './i18n/tour/es';
import { it_tour_guidato } from './i18n/tour/it';

// Analytics
import { en_analytics___extras } from './i18n/analytics/en';
import { es_analytics___extras } from './i18n/analytics/es';
import { it_analytics___extras } from './i18n/analytics/it';

// Notifications
import { en_notifications } from './i18n/notifications/en';
import { es_notifications } from './i18n/notifications/es';
import { it_notifications } from './i18n/notifications/it';

// Booking (ya existente)
import { en_booking } from './i18n/booking/en';
import { es_booking } from './i18n/booking/es';
import { it_booking } from './i18n/booking/it';

export { Language, dateLocales };

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
```

**Tareas de cleanup:**
1. Verificar que NO quedan definiciones inline de constants en `i18n.ts` (debería ser solo imports + spread)
2. `npm run build` pasa sin errores
3. Verificar que los 40+ archivos consumidores siguen funcionando sin cambios
4. Buscar keys duplicadas entre dominios (ej: `generate_report` en `en_general` y `en_dashboard_hero___metrics`) y decidir estrategia (mantener ambas o consolidar)

---

## NOTAS IMPORTANTES

### Keys faltantes en Italiano (`it_general`)
El bloque `it_general` tiene ~30 keys menos que `en_general` y `es_general`. Estas keys se deben agregar al crear `it.ts` en la Fase 1 con traducciones apropiadas.

### Keys duplicadas
Algunas keys aparecen en múltiples consts:
- `generate_report` → en `en_general` y `en_dashboard_hero___metrics` (en)
- `new_patient`, `active_patients`, `total_appointments`, `upcoming_appointments` → en `en_general` y `en_dashboard_hero___metrics` (en)
- `manage_services_btn` → en `en_sidebar` y `it_general`

Estas se resuelven por el orden del spread (el último gana). **No cambiar el orden de los spreads en `translations`** o las keys se sobreescribirán diferente.

### Nombres inconsistentes entre idiomas
Los nombres de consts difieren entre idiomas. Ej:
- `en_guided_tour` vs `es_tour_guiado` vs `it_tour_guidato`
- `es_login` / `it_login` existen pero `en_login` no

Estos nombres se mantienen en los archivos por compatibilidad, pero dentro de cada carpeta se puede renombrar el export para consistencia interna (ej: todos exportar como `en`, `es`, `it` sin prefijo de idioma).

### Orden de ejecución
Las fases son independientes entre sí. Se pueden hacer en cualquier orden. Pero recomiendo seguirlas en orden porque cada fase elimina líneas del archivo principal, haciendo más fácil encontrar lo que queda.

---

## RESUMEN DE ARCHIVOS POR FASE

| Fase | Carpetas nuevas | Archivos creados | Líneas eliminadas de i18n.ts |
|------|----------------|-----------------|------------------------------|
| 0 | types.ts | 1 | ~10 |
| 1 | general/ | 4 | ~560 |
| 2 | sidebar/ + dashboard/ | 8 | ~300 |
| 3 | appointments/ + settings/ | 8 | ~350 |
| 4 | whatsapp/ + booking-portal/ | 8 | ~400 |
| 5 | landing/ | 4 | ~600 |
| 6 | tour/ + analytics/ + notifications/ | 12 | ~400 |
| 7 | Cleanup | 0 | Restantes |
| **TOTAL** | **13 carpetas** | **~44 archivos** | **~2900** |

**Resultado:** `src/lib/i18n.ts` pasa de 2907 líneas a ~80 líneas (solo imports + merge + re-exports)