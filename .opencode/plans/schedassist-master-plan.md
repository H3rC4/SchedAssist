# 📋 PLAN MAESTRO - SchedAssist

> **Fecha:** 2026-06-08
> **Último commit:** `d4fa426` (schedule blocking + i18n)

---

## ✅ Completado

| # | Tarea | Estado | Commit |
|---|-------|--------|--------|
| 1 | Dynamic imports landing page (reduce JS) | ✅ | `9fa810d` |
| 2 | Geolocalización cache localStorage (24h) | ✅ | `9fa810d` |
| 3 | Redirección apex→www in next.config.mjs | ✅ | `9fa810d` |
| 4 | Placeholders de altura para CLS | ✅ | `9fa810d` |
| 5 | White-label para todos los planes | ✅ | `d5c87f8` |
| 6 | Starter sin WhatsApp, precio $29 | ✅ | `d5c87f8` |
| 7 | Verificación de límites (backend + UI) | ✅ | `7f02d79` |
| 8 | Trial System (14 días + grace period + cleanup) | ✅ | `5fb9be8` |
| 9 | TrialExpiredGate component | ✅ | `5fb9be8` |
| 10 | Dashboard layout con bloqueo inactive | ✅ | `5fb9be8` |
| 11 | Página de pago con 3 planes | ✅ | `5fb9be8` |
| 12 | TrialBanner con grace period y link a /pay | ✅ | `5fb9be8` |
| 13 | Toggle Plan Superadmin (solo Basic) | ✅ | - |
| 14 | Sistema de email marca blanca para auth | ✅ | - |
| 15 | Trial asigna correctamente plan Starter | ✅ | `fc33790` |
| 16 | Precios actualizados $29 Starter | ✅ | `eb6df40` |
| 17 | Migración plan_configs ejecutada | ✅ | Manual (Supabase) |
| 18 | Bloqueo parcial de horarios | ✅ | `d4fa426` |
| 19 | Doctor puede bloquear horas específicas | ✅ | `d4fa426` |
| 20 | needs_rescheduling en AppointmentStatus | ✅ | `d4fa426` |
| 21 | Unificación cancelación → reprogramación | ✅ | `d4fa426` |
| 22 | i18n completo doctor/schedule (3 idiomas) | ✅ | `d4fa426` |

---

## ⏳ Pendiente - MANUAL (requiere tu acción)

### Verificación DNS en Resend

- **Estado:** Esperando propagación DNS
- **Acción:** Verificar dominio `schedassist.com` en resend.com/domains
- **Una vez verificado:** Actualizar `RESEND_FROM_EMAIL` en Vercel

---

## 🔲 Pendiente - FUTURO

### Notificaciones

| # | Tarea | Requisito |
|---|-------|-----------|
| 1 | Email 3 días antes de expirar trial | Servicio de email (Resend) |
| 2 | WhatsApp 3 días antes de expirar trial | Whapi.Cloud configurado y pago |
| 3 | Email cuando expira el trial | Servicio de email |
| 4 | Panel para gestionar citas en needs_rescheduling | Desarrollo |

---

## 📊 Configuración de Planes (actual)

| Plan | Precio USD | Profesionales | Ubicaciones | Turnos/mes | Pacientes | WhatsApp | White-label |
|------|------------|---------------|-------------|------------|-----------|----------|-------------|
| Starter | $29 | 1 | 1 | 150 | 200 | ❌ | ✅ |
| Pro | $59 | 5 | 2 | ∞ | ∞ | ✅ 1 número | ✅ |
| Premium | $129 | ∞ | ∞ | ∞ | ∞ | ✅ 1 número | ✅ |

**WhatsApp extra:** +$35 USD por número adicional (todos los planes)

---

## 🔄 Flujo del Trial (IMPLEMENTADO)

```
Registro (día 0)
    ↓
subscription_status = 'trial'
plan_tier = 'basic' (Starter)
trial_ends_at = hoy + 14 días
max_professionals = 1, max_locations = 1
max_appointments_per_month = 150, max_patients = 200
    ↓
Día 1-14: Trial activo (banner verde)
    ↓
Día 14: Trial expira → cron cambia a 'inactive'
    ↓
Días 15-17: Grace period (banner amarillo)
    ↓
Día 18+: Bloqueo total (TrialExpiredGate)
    Solo puede ver /dashboard/pay
    ↓
Día 45+: Cleanup de datos (30 días inactivo)
```

---

## 🔑 Pendiente: Merge a main

Una vez que validemos que todo funciona, hacer:

```bash
git checkout main
git merge develop
git push origin main
```

---

## 📌 Notas

1. **Build local** antes de cada push para verificar
2. **Verificar deploy** en Vercel después de cada push
3. **White-label** está en todos los planes ahora
4. **WhatsApp** solo en Pro y Premium (1 número incluido)
5. **Sistema de email marca blanca** completado (pendiente verificación DNS)
6. **Bloqueo de horarios** soporta bloqueos parciales por hora
7. **i18n** completo en doctor/schedule (es, en, it)
