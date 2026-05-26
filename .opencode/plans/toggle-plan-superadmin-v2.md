# Plan: Toggle de Plan para Superadmin (v2 - Ultra Simple)

## Principio
**Nada de "gratis". Nada visible para el usuario.** El superadmin tiene un toggle para activar/desactivar el plan de un tenant como si hubiera pagado Stripe. El usuario ve su plan como cualquier otro plan activo.

## Cambios (5 archivos, nada mas)

### 1. Backend — `src/app/superadmin/actions.ts`

**Nueva action:** `togglePlanAction(tenantId: string, activate: boolean, planTier?: PlanTier)`

**Logica:**
- `activate=true` + `planTier`:
  - Busca `plan_configs` por el tier
  - Setea `subscription_status: 'active'`
  - Setea `plan_tier: planTier`
  - Aplica todos los limites del plan desde `plan_configs`
  - Setea `payment_gateway: 'manual'` (para tracking interno del admin)
  - Setea `trial_ends_at: null`
- `activate=false`:
  - Busca `plan_configs` por `basic`
  - Setea `subscription_status: 'inactive'`
  - Setea `plan_tier: 'basic'`
  - Resetea limites a basic
  - Setea `payment_gateway: null`

**Borrar:** `grantFreePlanAction` y `revokeFreePlanAction` (implementados antes)

### 2. Frontend — `src/app/superadmin/TenantActions.tsx`

**Reemplazar los botones de "gratis" por:**

```
[Toggle Switch]  Plan Activo / Plan Inactivo

Si Activo:
  [Dropdown] Basic / Pro / Premium
  [Boton "Aplicar"] 

Si Inactivo:
  Muestra: "Plan inactivo - usa limites Basic"
```

**Estado local:**
- `planActive: boolean` (basado en `subscription_status === 'active'`)
- `selectedPlan: PlanTier` (basado en `plan_tier`)
- `isUpdating: boolean`

**En el modal de detalles:**
- Mostrar tag "Activado manualmente" si `payment_gateway === 'manual'`
- Esto es SOLO para que el superadmin sepa que el no pago por Stripe

### 3. Frontend — `src/app/superadmin/SuperAdminContent.tsx`

**En cada tarjeta de clinica, mostrar:**
- Plan: `{plan_tier || 'basic'}` (con color segun tier)
- Estado: `{subscription_status}` (con color segun estado)

**Remover:**
- Todo lo relacionado a `gratis`
- Badge de "Startup Gratis"

### 4. Frontend — `src/app/superadmin/SuperAdminStats.tsx`

**Card nueva:** "Planes Activos (Manual)" — cuenta tenants con `payment_gateway === 'manual'`
**Remover:** Card de "Startup Gratis"

### 5. Revertir cambios previos

**Archivos a revertir a su estado original:**
- `src/types/index.ts` — quitar `granted_by_admin_*`
- `src/components/dashboard/TrialBanner.tsx` — quitar `if (status === 'gratis') return null`
- `src/app/dashboard/settings/whatsapp/page.tsx` — quitar condicional `subscription_status !== 'gratis'`, quitar card morada
- `src/app/dashboard/settings/billing/page.tsx` — quitar estado `gratis` de `getStatusColor` y `getStatusLabel`
- `src/services/message.service.ts` — quitar bloqueo de `gratis`
- `src/app/api/settings/whatsapp/route.ts` — quitar verificacion de `gratis`
- `src/app/api/webhooks/stripe/route.ts` — quitar limpieza de `granted_by_admin_*`
- `src/app/api/cron/trial-expiry/route.ts` — quitar `.neq('subscription_status', 'gratis')`
- `src/scripts/migration-startup-gratis.sql` — borrar archivo

## Flujo para el usuario final

| Paso | Estado DB | Lo que ve el usuario |
|------|-----------|---------------------|
| 1. Registro | `trialing`, `plan_tier=basic` | Trial 15 dias, plan Basic |
| 2. Superadmin activa | `active`, `plan_tier=pro` | Plan Pro activo, todo funciona |
| 3. Usuario entra a Billing | `active`, `plan_tier=pro` | "Plan Pro - Activo" |
| 4. Usuario entra a WhatsApp | `active`, `plan_tier=pro` | Puede configurar WhatsApp normal |
| 5. Superadmin desactiva | `inactive`, `plan_tier=basic` | Vuelve a plan Basic inactivo |

## Zero impacto en el usuario
- No hay palabras como "gratis", "regalado", "manual"
- No hay badges ni avisos especiales
- El checkout de Stripe sigue funcionando normalmente
- Si el usuario paga despues, el webhook de Stripe sobreescribe `payment_gateway: 'stripe'` y todo sigue normal

## Seguridad
- Solo el superadmin puede ejecutar `togglePlanAction`
- La action usa Service Role Key (ya asi esta)
- No hay endpoints nuevos expuestos al publico
