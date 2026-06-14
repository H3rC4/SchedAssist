# 🗑️ PLAN: Eliminar Mercado Pago (Solo Stripe)

> **Fecha:** 2026-06-13
> **Objetivo:** Remover todo rastro de Mercado Pago del proyecto
> **Razón:** Simplificar arquitectura de pagos, usar solo Stripe

---

## 📊 Resumen de Archivos Afectados

| Archivo | Tipo | Acción |
|---------|------|--------|
| `src/lib/mercadopago.ts` | Librería | 🗑️ ELIMINAR |
| `src/app/api/checkout/mercadopago/route.ts` | API | 🗑️ ELIMINAR |
| `src/app/api/webhooks/mercadopago/route.ts` | API | 🗑️ ELIMINAR |
| `src/app/api/billing/cancel-mp/route.ts` | API | 🗑️ ELIMINAR |
| `src/scripts/setup-mercadopago-plans.ts` | Script | 🗑️ ELIMINAR |
| `src/types/index.ts` | Types | ✏️ MODIFICAR |
| `src/app/api/checkout/route.ts` | API | ✏️ MODIFICAR |
| `src/app/api/billing/portal/route.ts` | API | ✏️ MODIFICAR |
| `src/app/dashboard/settings/billing/page.tsx` | UI | ✏️ MODIFICAR |
| `package.json` | Dependencias | ✏️ MODIFICAR |

---

## 🔍 Explicación Simple

**¿Qué es Mercado Pago?**
Es como otro "Stripe" pero para Argentina. Tu sistema actual soporta los dos:
- Stripe → Para todo el mundo (USD)
- Mercado Pago → Solo para Argentina (ARS)

**¿Por qué eliminarlo?**
- Duplica código y complejidad
- Dos webhooks diferentes que mantener
- Dos sistemas de facturación
- Más puntos de falla

**¿Qué pasa con Argentina?**
Stripe también funciona en Argentina. Podés cobrar en USD y Stripe se encarga de la conversión. O podés configurar precios en ARS directamente en Stripe.

---

## 📋 CHECKLIST PASO A PASO

### FASE 1: Eliminar Archivos de Mercado Pago (5 archivos)

- [ ] **1.1** Eliminar `src/lib/mercadopago.ts`
  - Es el cliente de Mercado Pago (como stripe.ts pero para MP)
  - Ya no se necesita

- [ ] **1.2** Eliminar `src/app/api/checkout/mercadopago/route.ts`
  - Endpoint que crea suscripciones en Mercado Pago
  - Reemplazado por `/api/checkout/stripe`

- [ ] **1.3** Eliminar `src/app/api/webhooks/mercadopago/route.ts`
  - Webhook que recibe notificaciones de Mercado Pago
  - Reemplazado por `/api/webhooks/stripe`

- [ ] **1.4** Eliminar `src/app/api/billing/cancel-mp/route.ts`
  - Endpoint para cancelar suscripciones de Mercado Pago
  - Ahora se usa el portal de Stripe

- [ ] **1.5** Eliminar `src/scripts/setup-mercadopago-plans.ts`
  - Script para crear planes en Mercado Pago
  - Ya no se necesita

---

### FASE 2: Limpiar Types (1 archivo)

- [ ] **2.1** Modificar `src/types/index.ts`
  ```typescript
  // ANTES:
  export type PaymentGateway = 'stripe' | 'mercadopago';
  
  // DESPUÉS:
  export type PaymentGateway = 'stripe';
  // O eliminar el tipo completamente si solo hay una opción
  ```

---

### FASE 3: Actualizar API Routes (3 archivos)

- [ ] **3.1** Modificar `src/app/api/checkout/route.ts`
  - **Problema:** Endpoint legacy que menciona Mercado Pago
  - **Solución:** Redirigir directamente a Stripe o eliminar
  ```typescript
  // Opción A: Eliminar archivo (si nadie lo usa)
  // Opción B: Redirigir a /api/checkout/stripe
  ```

- [ ] **3.2** Modificar `src/app/api/billing/portal/route.ts`
  - **Problema:** Línea 26-30 tiene lógica para Mercado Pago
  - **Solución:** Eliminar el condicional de Mercado Pago
  ```typescript
  // ELIMINAR:
  if (paymentGateway === 'mercadopago') {
    return NextResponse.json({ 
      error: 'El portal de administración de Stripe no está disponible...'
    }, { status: 400 });
  }
  ```

- [ ] **3.3** Revisar `src/app/api/webhooks/stripe/route.ts`
  - Verificar que no haya referencias a Mercado Pago
  - Asegurar que maneja todos los eventos de Stripe necesarios

---

### FASE 4: Actualizar UI de Billing (1 archivo)

- [ ] **4.1** Modificar `src/app/dashboard/settings/billing/page.tsx`
  - **Línea 180:** Eliminar detección de Argentina para Mercado Pago
  - **Línea 311:** Eliminar texto "Mercado Pago" del gateway display
  - **Línea 329:** Eliminar sección especial para Mercado Pago
  
  **Cambios específicos:**
  ```typescript
  // ELIMINAR lógica de detección Argentina para MP
  // ELIMINAR: if (gateway === 'mercadopago' && !isMpAvailable)
  // ELIMINAR: {planInfo.payment_gateway === 'mercadopago' ? 'Mercado Pago' : 'Stripe'}
  // ELIMINAR toda la sección de Mercado Pago en el UI
  ```

---

### FASE 5: Eliminar Dependencia (1 archivo)

- [ ] **5.1** Modificar `package.json`
  ```bash
  npm uninstall mercadopago
  ```
  - Elimina la dependencia `mercadopago: ^2.12.1`

---

### FASE 6: Variables de Entorno

- [ ] **6.1** Eliminar variables de Mercado Pago de `.env` y Vercel:
  ```
  ❌ MERCADOPAGO_ACCESS_TOKEN
  ❌ MERCADOPAGO_PUBLIC_KEY
  ❌ MP_PLAN_BASIC_MONTHLY
  ❌ MP_PLAN_BASIC_YEARLY
  ❌ MP_PLAN_PRO_MONTHLY
  ❌ MP_PLAN_PRO_YEARLY
  ❌ MP_PLAN_PREMIUM_MONTHLY
  ❌ MP_PLAN_PREMIUM_YEARLY
  ```

---

### FASE 7: Base de Datos (Opcional)

- [ ] **7.1** Decidir qué hacer con campos de MP en tabla `tenants`
  - `mp_subscription_id` → ¿Eliminar columna o dejarla vacía?
  - `payment_gateway` → ¿Eliminar o hardcodear 'stripe'?
  
  **Recomendación:** Dejar las columnas por ahora (no rompe nada), solo dejar de usarlas.

---

### FASE 8: Testing

- [ ] **8.1** Verificar que el checkout de Stripe funciona
- [ ] **8.2** Verificar que el webhook de Stripe procesa pagos
- [ ] **8.3** Verificar que el portal de billing funciona
- [ ] **8.4** Verificar que la UI de billing muestra correctamente
- [ ] **8.5** Verificar que no hay errores de TypeScript
- [ ] **8.6** Verificar que el build pasa sin errores

---

## 📁 Archivos a Eliminar (Completos)

```
src/lib/mercadopago.ts
src/app/api/checkout/mercadopago/
src/app/api/webhooks/mercadopago/
src/app/api/billing/cancel-mp/
src/scripts/setup-mercadopago-plans.ts
```

---

## 📝 Archivos a Modificar

```
src/types/index.ts
src/app/api/checkout/route.ts
src/app/api/billing/portal/route.ts
src/app/dashboard/settings/billing/page.tsx
package.json
```

---

## ⚠️ Precauciones

1. **Backup:** Hacer commit antes de empezar por si hay que revertir
2. **Clientes existentes:** Si hay clientes argentinos con suscripciones activas en MP, necesitás migrarlos manualmente a Stripe primero
3. **Testing:** Probar todo el flujo de pago después de los cambios
4. **Deploy:** Desplegar en horario de baja actividad

---

## 🎯 Orden de Ejecución Recomendado

1. **Commit de backup** - Guardar estado actual
2. **Eliminar archivos** (Fase 1)
3. **Modificar types** (Fase 2)
4. **Modificar APIs** (Fase 3)
5. **Modificar UI** (Fase 4)
6. **Eliminar dependencia** (Fase 5)
7. **Limpiar env vars** (Fase 6)
8. **Testing completo** (Fase 8)
9. **Deploy**

---

**Tiempo estimado:** 30-45 minutos
**Riesgo:** Medio (si hay clientes con MP activo)

---

**Última actualización:** 2026-06-13
**Próximo paso:** Confirmar si hay clientes argentinos con suscripciones activas en Mercado Pago
