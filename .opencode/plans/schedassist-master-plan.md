# 📋 PLAN MAESTRO - SchedAssist

> **Fecha:** 2026-05-26
> **Estado:** Pendiente de implementación
> **Último commit:** `d5c87f8` (white-label for all plans)

---

## ✅ Completado hoy

| # | Tarea | Estado | Commit |
|---|-------|--------|--------|
| 1 | Dynamic imports landing page (reduce JS) | ✅ | `9fa810d` |
| 2 | Geolocalización cache localStorage (24h) | ✅ | `9fa810d` |
| 3 | Redirección apex→www en next.config.mjs | ✅ | `9fa810d` |
| 4 | Placeholders de altura para CLS | ✅ | `9fa810d` |
| 5 | White-label para todos los planes | ✅ | `d5c87f8` |
| 6 | Starter sin WhatsApp, precio $29 | ✅ | `d5c87f8` |
| 7 | Plan detallado verificación de límites | ✅ | `.opencode/plans/plan-limits-enforcement.md` |

---

## 🔲 Pendiente - Fase 1: Sistema de Trial (PRÓXIMO)

### Paso 1: Corregir duración del trial
- **Archivo:** `src/app/(auth)/register/actions.ts`
- **Línea 43:** Cambiar `+7` → `+14`
- **Razón:** Landing dice 14 días, código dice 7

### Paso 2: Corregir status mismatch en cron
- **Archivo:** `src/app/api/cron/trial-expiry/route.ts`
- **Línea 31:** Cambiar `'trialing'` → `'trial'`
- **Razón:** Registro crea 'trial' pero cron busca 'trialing'

### Paso 3: Agregar grace period de 3 días
- **Archivo:** `src/app/api/cron/trial-expiry/route.ts`
- **Cambio:** No bloquear inmediatamente, dar 3 días de gracia
- **Lógica:** Solo cambiar a 'inactive' si `trial_ends_at + 3 días < now`

### Paso 4: Agregar limpieza de datos a los 30 días
- **Archivo:** `src/app/api/cron/trial-expiry/route.ts`
- **Cambio:** Si `subscription_status = 'inactive'` y `updated_at + 30 días < now`, borrar tenant
- **Orden de borrado:** clinical_records → appointments → clients → professionals → services → locations → whatsapp_accounts → tenant_users → tenants → auth.users

### Paso 5: Crear componente TrialExpiredGate
- **Archivo nuevo:** `src/components/dashboard/TrialExpiredGate.tsx`
- **Función:** Pantalla fullscreen de bloqueo cuando trial expira
- **Contenido:** Título "Tu trial expiró", subtítulo "Elegí un plan para continuar", 3 cards de planes (Starter $29, Pro $59, Premium $129)
- **Botón:** "Elegir Plan" → `/dashboard/pay`
- **Estilo:** Usar design system de SchedAssist (bg-surface, primary, etc.)

### Paso 6: Modificar layout del dashboard para bloqueo
- **Archivo:** `src/app/dashboard/layout.tsx`
- **Cambio:** Si `subscription_status === 'inactive'`, mostrar `<TrialExpiredGate />` en vez del dashboard
- **Excepción:** Permitir acceso a `/dashboard/pay` y `/dashboard/settings/billing`

### Paso 7: Rediseñar página de pago
- **Archivo:** `src/app/dashboard/pay/page.tsx`
- **Cambio:** Mostrar 3 planes con precios correctos
- **Starter:** $29/mes, 1 profesional, 1 ubicación, 150 turnos, white-label
- **Pro:** $59/mes, 5 profesionales, 2 ubicaciones, WhatsApp incluido
- **Premium:** $129/mes, todo ilimitado, WhatsApp incluido
- **Botón:** Cada plan inicia checkout de Stripe con su Price ID

### Paso 8: Corregir TrialBanner
- **Archivo:** `src/components/dashboard/TrialBanner.tsx`
- **Línea 36:** Cambiar `$79/mes` → texto dinámico
- **Línea 34:** Cambiar link `/dashboard/settings/whatsapp` → `/dashboard/pay`
- **Cambio:** Durante grace period (3 días), mostrar banner amarillo con aviso

### Paso 9: Agregar traducciones i18n
- **Archivo:** `src/lib/i18n.ts`
- **Keys nuevas:**
  - `trial_expired_title` (es/en/it)
  - `trial_expired_subtitle` (es/en/it)
  - `trial_expired_cta` (es/en/it)
  - `trial_grace_period` (es/en/it)
  - `trial_days_remaining` (es/en/it)

### Paso 10: Actualizar plan_configs en Supabase
- **Archivo:** `src/scripts/run-migration-plans.ts`
- **Ejecutar:** `npx tsx src/scripts/run-migration-plans.ts`
- **O ejecutar SQL manualmente en Supabase Dashboard**

### Paso 11: Build + Deploy
- `npm run build` (verificar que no hay errores)
- `git add -A && git commit -m "feat: implement trial system with grace period"`
- `git push origin main` (deploy automático en Vercel)

---

## 🔲 Pendiente - Fase 2: Verificación de Límites (DESPUÉS)

> Plan detallado en: `.opencode/plans/plan-limits-enforcement.md`

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `src/lib/plan-limits.ts` | **NUEVO** - Utilidad de verificación |
| 2 | `src/app/api/professionals/route.ts` | Verificar max_professionals |
| 3 | `src/app/api/locations/route.ts` | Verificar max_locations |
| 4 | `src/app/api/clients/route.ts` | Verificar max_patients |
| 5 | `src/app/api/appointments/route.ts` | Verificar max_appointments_per_month |
| 6 | `src/app/api/services/route.ts` | Verificar max_services |
| 7 | `src/components/ui/PlanLimitAlert.tsx` | **NUEVO** - Alerta de límite alcanzado |
| 8-12 | Componentes UI | Deshabilitar botones cuando se alcanza límite |

---

## 🔲 Pendiente - Fase 3: Precios de Stripe (MANUAL)

- **Link:** https://dashboard.stripe.com/products
- **Cambiar:** Starter mensual de $39 → $29
- **Cambiar:** Starter anual de $390 → $290
- **Verificar:** Price IDs en `.env` coincidan con los de Stripe

---

## 🔲 Pendiente - Fase 4: Notificaciones (FUTURO)

| # | Tarea | Requisito |
|---|-------|-----------|
| 1 | Email 3 días antes de expirar trial | Servicio de email (Resend/SendGrid) |
| 2 | WhatsApp 3 días antes de expirar trial | Whapi.Cloud configurado y pago |
| 3 | Email cuando expira el trial | Servicio de email |
| 4 | Whapi.Cloud webhook | Pago del servicio |

---

## 📁 Archivos modificados hoy (NO hacer push todavía)

| Archivo | Cambio |
|---------|--------|
| `src/scripts/run-migration-plans.ts` | white_label=true para todos, whatsapp_limit=0 para starter |
| `src/components/landing/LandingPricing.tsx` | Precios actualizados, features corregidas |
| `src/lib/i18n.ts` | Keys nuevas de WhatsApp unlimited |

---

## 🔑 Variables de entorno (.env)

```
NEXT_PUBLIC_APP_URL=https://www.schedassist.com/
NEXT_PUBLIC_SITE_URL=https://www.schedassist.com/
```

---

## 📌 Notas importantes

1. **No hacer push** hasta que el usuario lo pida
2. **Build local** antes de cada push para verificar
3. **Verificar deploy** en Vercel después de cada push
4. **White-label** está en todos los planes ahora
5. **WhatsApp** solo en Pro y Premium (1 número incluido, extras se pagan)
6. **Starter** no tiene WhatsApp, tiene white-label, cuesta $29

---

## 📊 Configuración de Planes (estado final)

| Plan | Precio USD | Precio ARS | Profesionales | Ubicaciones | Turnos/mes | Pacientes | WhatsApp | White-label |
|------|------------|------------|---------------|-------------|------------|-----------|----------|-------------|
| Starter | $29 | $45.000 | 1 | 1 | 150 | 200 | ❌ | ✅ |
| Pro | $59 | $90.000 | 5 | 2 | ∞ | ∞ | ✅ 1 número | ✅ |
| Premium | $129 | $195.000 | ∞ | ∞ | ∞ | ∞ | ✅ 1 número | ✅ |

**WhatsApp extra:** +$35 USD / $52.500 ARS por número adicional (todos los planes)

---

## 🔄 Flujo del Trial

```
Registro (día 0)
    ↓
subscription_status = 'trial'
trial_ends_at = hoy + 14 días
plan_tier = 'starter'
    ↓
Día 1-14: Trial activo
    - Banner muestra días restantes
    - Acceso completo al dashboard
    - WhatsApp bloqueado
    ↓
Día 14: Trial expira
    ↓
Cron diario detecta expiración
    ↓
subscription_status = 'inactive'
    ↓
Día 15-17: Grace period (3 días)
    - Banner rojo: "Tu trial expiró, tenés 3 días para elegir un plan"
    - Acceso al dashboard + página de planes (/dashboard/pay)
    ↓
Día 18+: Bloqueo total
    - Pantalla fullscreen de bloqueo
    - Solo puede ver: elegir plan (/dashboard/pay)
    - No puede navegar al dashboard
    ↓
Día 45+: Limpieza de datos
    - Borrar tenant + todos los datos
    - Borrar usuario de Auth
```

---

Mañana retomamos desde el **Paso 1: Corregir duración del trial**.
