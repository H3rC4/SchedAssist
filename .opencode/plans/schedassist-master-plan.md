# 📋 PLAN MAESTRO - SchedAssist

> **Fecha:** 2026-05-27
> **Último commit:** `5fb9be8` (trial system with grace period)

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
| 7 | Plan detallado verificación de límites | ✅ | `.opencode/plans/plan-limits-enforcement.md` |
| 8 | **Verificación de límites (backend + UI)** | ✅ | `7f02d79` |
| 9 | **Trial System (14 días + grace period + cleanup)** | ✅ | `5fb9be8` |
| 10 | **TrialExpiredGate component** | ✅ | `5fb9be8` |
| 11 | **Dashboard layout con bloqueo inactive** | ✅ | `5fb9be8` |
| 12 | **Página de pago con 3 planes** | ✅ | `5fb9be8` |
| 13 | **TrialBanner con grace period y link a /pay** | ✅ | `5fb9be8` |
| 14 | **Toggle Plan Superadmin v2** | ✅ | - |
| 15 | **Sistema de email marca blanca para auth** | ✅ | `auth-email-whitelabel-plan.md` |

---

## 🔲 Pendiente - MANUAL (requiere tu acción)

### Fase 3: Precios de Stripe

- **Link:** https://dashboard.stripe.com/products
- **Cambiar:** Starter mensual de $39 → $29
- **Cambiar:** Starter anual de $390 → $290
- **Verificar:** Price IDs en `.env` coincidan con los de Stripe

### Fase 4: Migración de plan_configs

- **Archivo:** `src/scripts/run-migration-plans.ts`
- **Ejecutar:** `npx tsx src/scripts/run-migration-plans.ts`
- **O ejecutar SQL manualmente en Supabase Dashboard`

---

## 🔲 Pendiente - FUTURO

### Fase 5: Notificaciones

| # | Tarea | Requisito |
|---|-------|-----------|
| 1 | Email 3 días antes de expirar trial | Servicio de email (Resend/SendGrid) |
| 2 | WhatsApp 3 días antes de expirar trial | Whapi.Cloud configurado y pago |
| 3 | Email cuando expira el trial | Servicio de email |
| 4 | Whapi.Cloud webhook | Pago del servicio |

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
trial_ends_at = hoy + 14 días
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

Una vez que(validemos que todo funciona, hacer:

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
5. **Sistema de email marca blanca** completado y verificado