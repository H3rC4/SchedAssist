# 📊 Análisis Estratégico de Planes - Departamento de Marketing

> **Fecha:** 15 de Mayo 2026  
> **Producto:** SchedAssist SaaS  
> **Objetivo:** Diseñar la estrategia de 3 planes (Básico, Semi-Premium, Premium)

---

## 1. Estado Actual: Lo Que Tenemos

### 1.1 Landing Page - Pricing Component

**Archivo:** `src/components/landing/LandingPricing.tsx`

Actualmente muestra 3 planes con estos detalles:

| | Starter | Pro ⭐ | Premium |
|---|---------|--------|---------|
| **Precio** | $29/mes | $49/mes | $99/mes |
| **Turnos** | Hasta 100/mes | Ilimitados | Ilimitados |
| **WhatsApp** | Básico | Con IA | Con IA |
| **Profesionales** | No especificado | Hasta 5 | Ilimitados |
| **Historias Clínicas** | ✅ | ✅ | ✅ |
| **Dominio Personalizado** | ❌ | ❌ | ✅ |
| **Soporte** | Email | Prioritario | Prioritario |
| **Diseño** | Card blanca | Card dark (destacada) | Card blanca |

### 1.2 Base de Datos - Tabla `tenants`

**Campos de suscripción existentes:**
```typescript
stripe_customer_id?: string;
stripe_subscription_id?: string;
subscription_status?: string;  // 'active', 'trialing', etc.
subscription_price_id?: string; // ID del precio en Stripe
```

**⚠️ PROBLEMA CRÍTICO:** No existe un campo `plan_tier` o `plan_type` en la DB. Solo se guarda el `subscription_price_id` de Stripe, pero no hay lógica que diferencie qué features tiene cada plan.

### 1.3 Stripe - Checkout

**Archivo:** `src/app/api/checkout/route.ts`

**⚠️ PROBLEMA CRÍTICO:** El checkout usa UNA SOLA variable de entorno `STRIPE_PRICE_ID`. Esto significa que:
- Solo existe UN precio configurable
- No hay selección de plan en el flujo de checkout
- Todos los tenants pagan lo mismo

### 1.4 Superadmin Dashboard

**Archivo:** `src/app/superadmin/SuperAdminStats.tsx`

Calcula revenue como: `activeTenants * 70` (precio promedio ficticio de $70).

### 1.5 Billing Page

**Archivo:** `src/app/dashboard/settings/billing/page.tsx`

Solo muestra historial de facturas. **No muestra:**
- Plan actual del tenant
- Features disponibles en su plan
- Opción de upgrade/downgrade
- Comparación de planes

### 1.6 Settings WhatsApp

**Archivo:** `src/app/dashboard/settings/whatsapp/page.tsx`

Muestra `subscription_status` (active/trial) pero no el plan específico.

---

## 2. Diagnóstico: Gap Analysis

### Lo Que Dice la Landing vs Lo Que Hace la App

| Feature | Landing Dice | App Implementa | Estado |
|---------|-------------|----------------|--------|
| 3 planes con precios distintos | ✅ 3 planes | ❌ 1 solo precio | 🔴 ROTO |
| Límite 100 turnos/mes (Starter) | ✅ Dice | ❌ Sin límites | 🔴 ROTO |
| Hasta 5 profesionales (Pro) | ✅ Dice | ❌ Sin límites | 🔴 ROTO |
| WhatsApp con IA (Pro/Premium) | ✅ Dice | ❌ Sin diferenciación | 🔴 ROTO |
| Dominio personalizado (Premium) | ✅ Dice | ❌ Sin implementar | 🔴 ROTO |
| Trial 14 días | ✅ Dice | ✅ Implementado | 🟢 OK |
| Upgrade/downgrade | ✅ FAQ dice | ❌ Sin implementar | 🔴 ROTO |
| Selección de plan en checkout | ❌ | ❌ 1 solo precio | 🔴 ROTO |

### Conclusión del Diagnóstico

**La landing page vende 3 planes pero la app solo soporta 1.** Esto es un problema grave de coherencia que puede generar:
- Confusión en usuarios
- Problemas legales (vender features inexistentes)
- Pérdida de confianza en la marca

---

## 3. Propuesta Estratégica: 3 Planes Rediseñados

### 3.1 Filosofía de Pricing

```
BÁSICO     → Entrada al ecosistema. Para consultorios individuales.
PRO        → Sweet spot. Para clínicas pequeñas/medianas.
PREMIUM    → Sin límites. Para cadenas de clínicas y grupos médicos.
```

### 3.2 Tabla Comparativa Propuesta

| Feature | BÁSICO | PRO | PREMIUM |
|---------|--------|-----|---------|
| **Precio mensual** | $29 | $59 | $129 |
| **Precio anual** | $24/mes (-17%) | $49/mes (-17%) | $99/mes (-23%) |
| **Trial** | 14 días | 14 días | 14 días |
| | | | |
| **Turnos/mes** | 150 | Ilimitados | Ilimitados |
| **Profesionales** | 1 | Hasta 5 | Ilimitados |
| **Servicios** | 3 | 10 | Ilimitados |
| **Ubicaciones** | 1 | 2 | Ilimitadas |
| **Pacientes** | 200 | Ilimitados | Ilimitados |
| | | | |
| **WhatsApp** | Manual | Automatizado | IA + Multi-agente |
| **Recordatorios** | Manual | Automáticos | IA predictivos |
| **Lista de espera** | ❌ | ✅ | ✅ + Auto-assign |
| **Historias clínicas** | Básica | Completa | Completa + Templates |
| **Analytics** | Básico | Avanzado | Custom reports |
| | | | |
| **Booking page** | schedassist.com/clinica | Custom branding | Dominio propio |
| **Branding** | SchedAssist | White-label parcial | White-label total |
| **API access** | ❌ | ✅ | ✅ + Webhooks |
| | | | |
| **Soporte** | Email | Email + WhatsApp | Dedicated account mgr |
| **Onboarding** | Self-service | Guided | Done-for-you |
| **SLA** | Best effort | 99.5% | 99.9% |

### 3.3 Justificación de Precios

| Plan | Target | CAC Target | LTV Expected | Payback |
|------|--------|------------|--------------|---------|
| **Básico $29** | Consultorio individual, 1 doctor | < $30 | $348 (12 meses) | < 1 mes |
| **Pro $59** | Clínica pequeña, 2-5 doctores | < $50 | $708 (12 meses) | < 1 mes |
| **Premium $129** | Cadena de clínicas, 5+ doctores | < $100 | $1,548 (12 meses) | < 1 mes |

### 3.4 Anclaje de Precios (Psicología)

```
Básico $29    → Ancla baja. Hace que Pro parezca razonable.
Pro $59       → Sweet spot. El que queremos que elijan.
Premium $129  → Ancla alta. Hace que Pro parezca barato.
```

**Estrategia:** El plan Pro debe ser elegido por el 60-70% de los usuarios.

---

## 4. Implementación Técnica Requerida

### 4.1 Base de Datos - Cambios

```sql
-- Agregar campo plan_tier a tenants
ALTER TABLE tenants 
ADD COLUMN plan_tier VARCHAR(20) DEFAULT 'basic' 
CHECK (plan_tier IN ('basic', 'pro', 'premium'));

-- Agregar campos de límites para enforcement
ALTER TABLE tenants
ADD COLUMN max_professionals INT DEFAULT 1,
ADD COLUMN max_services INT DEFAULT 3,
ADD COLUMN max_locations INT DEFAULT 1,
ADD COLUMN max_appointments_per_month INT DEFAULT 150,
ADD COLUMN max_patients INT DEFAULT 200;

-- Agregar campos de features
ALTER TABLE tenants
ADD COLUMN whatsapp_ai_enabled BOOLEAN DEFAULT false,
ADD COLUMN custom_domain_enabled BOOLEAN DEFAULT false,
ADD COLUMN white_label_enabled BOOLEAN DEFAULT false,
ADD COLUMN api_access_enabled BOOLEAN DEFAULT false,
ADD COLUMN analytics_tier VARCHAR(20) DEFAULT 'basic';
```

### 4.2 Stripe - Configuración

Necesitamos crear en Stripe:

| Producto | Price ID (monthly) | Price ID (yearly) |
|----------|-------------------|-------------------|
| Basic | `price_basic_monthly` | `price_basic_yearly` |
| Pro | `price_pro_monthly` | `price_pro_yearly` |
| Premium | `price_premium_monthly` | `price_premium_yearly` |

### 4.3 API Checkout - Rediseño

```typescript
// Nuevo flujo: POST /api/checkout con body
{
  plan: "basic" | "pro" | "premium",
  billing_cycle: "monthly" | "yearly"
}

// Mapeo de plan a Stripe Price ID
const PRICE_MAP = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  },
};
```

### 4.4 Webhook Stripe - Actualización

Cuando Stripe confirma el pago, actualizar:
```typescript
// En /api/webhooks/stripe
const planMap = {
  'price_basic_monthly': { tier: 'basic', professionals: 1, services: 3, ... },
  'price_pro_monthly': { tier: 'pro', professionals: 5, services: 10, ... },
  'price_premium_monthly': { tier: 'premium', professionals: -1, services: -1, ... },
};

// Actualizar tenant con los límites del plan
await supabase
  .from('tenants')
  .update({ 
    plan_tier: planConfig.tier,
    max_professionals: planConfig.professionals,
    // ... etc
  })
  .eq('id', tenantId);
```

### 4.5 Feature Gates - Middleware/Hooks

```typescript
// Hook: usePlanLimits()
export function usePlanLimits() {
  const { tenant } = useTenant();
  
  return {
    canAddProfessional: tenant.current_professionals < tenant.max_professionals,
    canAddService: tenant.current_services < tenant.max_services,
    canAddLocation: tenant.current_locations < tenant.max_locations,
    hasWhatsAppAI: tenant.whatsapp_ai_enabled,
    hasCustomDomain: tenant.custom_domain_enabled,
    hasWhiteLabel: tenant.white_label_enabled,
    hasApiAccess: tenant.api_access_enabled,
    appointmentsUsed: tenant.appointments_this_month,
    appointmentsLimit: tenant.max_appointments_per_month,
    isUnlimited: tenant.max_appointments_per_month === -1,
  };
}
```

### 4.6 Billing Page - Rediseño

Debe mostrar:
- Plan actual con badge visual
- Features incluidas en el plan
- Barra de uso (turnos usados / límite)
- Botón de upgrade con comparativa
- Historial de facturas
- Opción de cancelar/downgrade

---

## 5. Plan de Acción por Fases

### Fase 1: Corrección Crítica (Semana 1-2) 🔴

| Tarea | Responsable | Prioridad |
|-------|-------------|-----------|
| Crear productos en Stripe (3 planes × 2 ciclos) | Operations | 🔴 |
| Agregar campo `plan_tier` a tabla tenants | Database | 🔴 |
| Actualizar checkout API para recibir plan | Backend | 🔴 |
| Actualizar webhook Stripe para setear plan | Backend | 🔴 |
| Actualizar landing pricing con precios correctos | Frontend | 🔴 |

### Fase 2: Feature Gates (Semana 3-4) 🟡

| Tarea | Responsable | Prioridad |
|-------|-------------|-----------|
| Crear hook `usePlanLimits()` | Frontend | 🟡 |
| Implementar límites en crear profesional | Backend | 🟡 |
| Implementar límites en crear servicio | Backend | 🟡 |
| Implementar límites en turnos/mes | Backend | 🟡 |
| UI de "plan limit reached" con upgrade CTA | Frontend | 🟡 |

### Fase 3: Billing Experience (Semana 5-6) 🟡

| Tarea | Responsable | Prioridad |
|-------|-------------|-----------|
| Rediseñar billing page con plan actual | Frontend | 🟡 |
| Implementar upgrade flow | Full-stack | 🟡 |
| Implementar downgrade flow | Full-stack | 🟡 |
| Mostrar comparativa de planes en dashboard | Frontend | 🟡 |
| Email de "trial ending" con plan recommendation | Email | 🟡 |

### Fase 4: Features Premium (Semana 7-8) 🟢

| Tarea | Responsable | Prioridad |
|-------|-------------|-----------|
| Implementar custom domains | Backend | 🟢 |
| Implementar white-label | Frontend | 🟢 |
| Implementar WhatsApp AI | Integrations | 🟢 |
| Implementar API access | Backend | 🟢 |
| Implementar analytics avanzado | Frontend | 🟢 |

---

## 6. Métricas de Éxito

### KPIs a Monitorear

| Métrica | Target Mes 1 | Target Mes 3 | Target Mes 6 |
|---------|-------------|-------------|-------------|
| Conversión trial → paid | 15% | 25% | 35% |
| % usuarios en Basic | 40% | 30% | 20% |
| % usuarios en Pro | 45% | 55% | 60% |
| % usuarios en Premium | 15% | 15% | 20% |
| MRR | $500 | $3,000 | $10,000 |
| Churn rate | < 8% | < 5% | < 3% |
| ARPU | $45 | $55 | $65 |

### Revenue Projection

```
Mes 1:   10 tenants → $450 MRR (avg $45)
Mes 3:   60 tenants → $3,300 MRR (avg $55)
Mes 6:  180 tenants → $11,700 MRR (avg $65)
Mes 12: 500 tenants → $35,000 MRR (avg $70)
```

---

## 7. Riesgos y Mitigación

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|------------|
| Precios muy altos para LATAM | Alto | Media | Testear con $19/$39/$79 |
| Tenants existentes sin plan definido | Medio | Alta | Migrar todos a Pro como default |
| Feature gates complejos de mantener | Medio | Media | Centralizar en un solo servicio |
| Stripe webhook falla | Alto | Baja | Retry logic + manual reconciliation |
| Competencia con precios menores | Medio | Alta | Diferenciar con WhatsApp AI |

---

## 8. Recomendaciones del Departamento de Marketing

### 8.1 Sobre los Precios

**Opción A - Precios actuales (landing):** $29 / $49 / $99
- ✅ Coherente con lo que ya se muestra
- ✅ Competitivo para LATAM
- ⚠️ Margen bajo en Basic

**Opción B - Precios propuestos:** $29 / $59 / $129
- ✅ Mejor margen en Pro y Premium
- ✅ Mejor anclaje de precios
- ⚠️ Requiere actualizar landing

**Opción C - Precios LATAM-friendly:** $19 / $39 / $79
- ✅ Más accesible para mercado LATAM
- ✅ Mayor volumen de conversiones
- ⚠️ Menor revenue por tenant

**🎯 Recomendación:** Opción B ($29/$59/$129) con descuento anual del 20%.

### 8.2 Sobre el Nombre de los Planes

| Opción | Plan 1 | Plan 2 | Plan 3 |
|--------|--------|--------|--------|
| Actual | Starter | Pro | Premium |
| Alternativa 1 | Básico | Profesional | Enterprise |
| Alternativa 2 | Esencial | Avanzado | Premium |
| Alternativa 3 | Solo | Equipo | Cadena |

**🎯 Recomendación:** Mantener **Starter / Pro / Premium** - son universales y se entienden en los 3 idiomas (ES/EN/IT).

### 8.3 Sobre la Comunicación

- **Starter:** "Perfecto para empezar" - enfocar en simplicidad
- **Pro:** "El favorito de las clínicas" - social proof, más popular
- **Premium:** "Sin límites, sin preocupaciones" - enfocar en tranquilidad

---

## 9. Decisiones Pendientes

1. **¿Aprobar los precios propuestos ($29/$59/$129) o ajustar?**
2. **¿Qué features van en cada plan?** (revisar tabla comparativa)
3. **¿Migrar tenants existentes? ¿A qué plan?**
4. **¿Implementar descuentos por volumen para Premium?**
5. **¿Ofrecer plan gratuito (freemium) además de trial?**

---

*Documento generado por el Departamento de Marketing - SchedAssist*
