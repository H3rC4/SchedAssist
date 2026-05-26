# Plan: Implementación de Verificaciones de Límites por Plan

> **Fecha:** 2026-05-26
> **Estado:** Pendiente
> **Prioridad:** Crítica (bloquea modelo de negocio)
> **Branch:** main (commit 9fa810d)

---

## Contexto

Las limitaciones de plan existen en la base de datos (`plan_configs`) pero **NO se verifican en las APIs**. Un usuario del plan Starter puede crear ilimitados profesionales, ubicaciones, pacientes y turnos, lo que rompe el modelo de negocio.

## Limitaciones por Plan (según plan_configs)

| Recurso | Starter (Basic) | Pro | Premium |
|---------|----------------|-----|---------|
| Profesionales | 1 | 5 | ∞ (-1) |
| Ubicaciones | 1 | 2 | ∞ (-1) |
| Turnos/mes | 150 | ∞ (-1) | ∞ (-1) |
| Pacientes | 200 | ∞ (-1) | ∞ (-1) |
| Servicios | ∞ (-1) | ∞ (-1) | ∞ (-1) |
| WhatsApp numbers | 1 | 1 | ∞ (-1) |

> **Nota:** `-1` significa "ilimitado" en la convención del código.

---

## Checklist de Implementación

### Fase 1: Crear utilidad reutilizable

- [ ] **Archivo:** `src/lib/plan-limits.ts`
- [ ] Crear función `checkPlanLimit()` que:
  - Reciba `tenant_id`, `resource` (professionals|locations|appointments|patients|services), `action` (create|count)
  - Consulte los límites del tenant desde la tabla `tenants`
  - Cuente los registros actuales
  - Retorne `{ allowed: boolean, current: number, max: number, error?: string }`
- [ ] Crear función `getTenantLimits(tenant_id)` que obtenga los límites del tenant

### Fase 2: Proteger APIs (Backend)

- [ ] **Archivo:** `src/app/api/professionals/route.ts` (POST)
  - Agregar verificación antes de insertar
  - Si `current_count >= max_professionals`, retornar 403 con mensaje "Plan limit reached"
- [ ] **Archivo:** `src/app/api/locations/route.ts` (POST)
  - Agregar verificación antes de insertar
  - Si `current_count >= max_locations`, retornar 403
- [ ] **Archivo:** `src/app/api/clients/route.ts` (POST)
  - Agregar verificación antes de insertar
  - Si `current_count >= max_patients`, retornar 403
- [ ] **Archivo:** `src/app/api/appointments/route.ts` (POST)
  - Agregar verificación antes de insertar
  - Contar turnos del mes actual
  - Si `current_month_count >= max_appointments_per_month`, retornar 403
- [ ] **Archivo:** `src/app/api/services/route.ts` (POST)
  - Agregar verificación (aunque sea ilimitado, por consistencia)

### Fase 3: Proteger UI (Frontend)

- [ ] **Archivo:** `src/components/professionals/AddProfessionalModal.tsx`
  - Usar `usePlanLimits()` para deshabilitar botón si `canAddProfessional() === false`
  - Mostrar mensaje de upgrade
- [ ] **Archivo:** `src/components/clients/NewPatientDrawer.tsx`
  - Usar `usePlanLimits()` para deshabilitar creación si `canAddPatient() === false`
- [ ] **Archivo:** `src/components/appointments/QuickAppointmentDrawer.tsx`
  - Usar `usePlanLimits()` para deshabilitar si `canAddAppointment() === false`
- [ ] **Archivo:** `src/app/dashboard/locations/page.tsx`
  - Deshabilitar botón "Add Location" si se alcanzó el límite

### Fase 4: Mensajes de error amigables

- [ ] Crear componente `PlanLimitAlert` que muestre:
  - "Has alcanzado el límite de X para tu plan Starter"
  - Botón "Upgrade a Pro" que redirija a `/dashboard/settings/billing`
- [ ] Agregar traducciones en `src/lib/i18n.ts`:
  - `limit_reached_title`
  - `limit_reached_description`
  - `limit_reached_upgrade_cta`

### Fase 5: Testing

- [ ] Verificar que un tenant Starter no puede crear más de 1 profesional
- [ ] Verificar que un tenant Starter no puede crear más de 1 ubicación
- [ ] Verificar que un tenant Starter no puede crear más de 200 pacientes
- [ ] Verificar que un tenant Starter no puede crear más de 150 turnos/mes
- [ ] Verificar que un tenant Pro puede crear hasta 5 profesionales
- [ ] Verificar que un tenant Premium no tiene límites

---

## Archivos a Modificar (Lista Completa)

### Nuevos archivos:
1. `src/lib/plan-limits.ts` - Utilidad de verificación
2. `src/components/ui/PlanLimitAlert.tsx` - Componente de alerta

### Archivos existentes a modificar:
3. `src/app/api/professionals/route.ts` - Verificación POST
4. `src/app/api/locations/route.ts` - Verificación POST
5. `src/app/api/clients/route.ts` - Verificación POST
6. `src/app/api/appointments/route.ts` - Verificación POST
7. `src/app/api/services/route.ts` - Verificación POST
8. `src/components/professionals/AddProfessionalModal.tsx` - UI
9. `src/components/clients/NewPatientDrawer.tsx` - UI
10. `src/components/appointments/QuickAppointmentDrawer.tsx` - UI
11. `src/app/dashboard/locations/page.tsx` - UI
12. `src/lib/i18n.ts` - Traducciones

---

## Código de Referencia: Ejemplo de Verificación

```typescript
// src/lib/plan-limits.ts
import { createClient } from '@/lib/supabase/server';

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number;
  error?: string;
}

export async function checkPlanLimit(
  tenantId: string,
  resource: 'professionals' | 'locations' | 'appointments' | 'patients' | 'services'
): Promise<LimitCheckResult> {
  const supabase = createClient();
  
  // 1. Obtener límites del tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select(`max_${resource === 'appointments' ? 'appointments_per_month' : resource}`)
    .eq('id', tenantId)
    .single();
  
  const maxLimit = tenant?.[`max_${resource === 'appointments' ? 'appointments_per_month' : resource}`] ?? -1;
  
  // -1 significa ilimitado
  if (maxLimit === -1) {
    return { allowed: true, current: 0, max: -1 };
  }
  
  // 2. Contar registros actuales
  let countQuery = supabase
    .from(resource)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  
  // Para appointments, contar solo del mes actual
  if (resource === 'appointments') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    countQuery = countQuery.gte('start_at', startOfMonth).lte('start_at', endOfMonth);
  }
  
  const { count } = await countQuery;
  const current = count ?? 0;
  
  // 3. Verificar límite
  if (current >= maxLimit) {
    return {
      allowed: false,
      current,
      max: maxLimit,
      error: `Has alcanzado el límite de ${resource} para tu plan (${maxLimit}). Upgrade para agregar más.`
    };
  }
  
  return { allowed: true, current, max: maxLimit };
}
```

---

## Notas Importantes

1. **Siempre verificar en backend:** El frontend puede ser bypassed, la verificación real debe estar en las APIs.
2. **Contar con RLS:** Usar `head: true` y `count: 'exact'` para contar sin traer datos.
3. **Appointments por mes:** Para turnos, contar solo los del mes actual (usar `start_at` del mes en curso).
4. **Servicios:** Aunque sea ilimitado, agregar verificación por consistencia.
5. **Mensajes i18n:** Todos los mensajes deben soportar es/en/it.

---

## Estado del Commit Base

- Commit: `9fa810d`
- Build: ✅ Exitoso
- Archivos modificados: `next.config.mjs`, `src/app/dashboard/page.tsx`, `src/app/page.tsx`, `src/components/LanguageContext.tsx`, `src/components/landing/LandingPricing.tsx`, `src/lib/geo.ts`

**Deploy:** Pendiente (requiere Vercel CLI o push a Git)

---

## Próximo Paso

Implementar Fase 1 (crear `src/lib/plan-limits.ts`) y Fase 2 (proteger APIs).
