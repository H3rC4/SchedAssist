# 🚀 PLAN DE EJECUCIÓN - SchedAssist Hardening

> **Estado:** 17/06/2026
> **Código:** ✅ 100% completado
> **Pendiente:** ⏳ SQL + Configuración manual de servicios externos

---

## ✅ CÓDIGO COMPLETADO (Ya está deployeado)

### Etapa 2: Performance
| Tarea | Archivos | Estado |
|-------|----------|--------|
| Vista SQL + RPC Dashboard | `supabase/migrations/20260617001_create_tenant_stats_view.sql` + `dashboard/page.tsx` | ✅ |
| Paginación Appointments API | `appointments/route.ts` (from/to/limit/offset) + `clients/[id]/page.tsx` | ✅ |
| Booking Cache | `src/lib/cache.ts` con unstable_cache | ✅ |
| Índices DB | En el migration SQL | ✅ |

### Etapa 3: Arquitectura
| Tarea | Archivos | Estado |
|-------|----------|--------|
| Zod Schemas + validación | `validation/schemas.ts` + clients, professionals, services, locations, appointments routes | ✅ |
| Cleanup código | Express/body-parser desinstalados de package.json | ✅ |

### Etapa 4: SEO
| Tarea | Archivos | Estado |
|-------|----------|--------|
| robots.txt | `src/app/robots.ts` | ✅ |
| OG Image + hreflang | `layout.tsx` | ✅ |
| i18n LandingFeatures | `LandingFeatures.tsx` + locales es/en/it | ✅ |

---

## ⏳ PASOS MANUALES PENDIENTES

### 🔴 PASO 1: Ejecutar Migration en Supabase (5 min)

Ir a **Supabase Dashboard** → **SQL Editor** → pegar y ejecutar:
```
supabase/migrations/20260617001_create_tenant_stats_view.sql
```

Esto crea:
- `tenant_appointment_stats` → vista con stats agregados
- `get_daily_appointment_counts()` → RPC function para charts
- `idx_appointments_tenant_date`, `idx_clients_tenant`, `idx_professionals_tenant` → índices

---

### 🔴 PASO 2: Configurar Upstash Redis (5 min)

1. Ir a https://upstash.com/ → crear cuenta
2. Crear Database:
   - Name: `schedassist-ratelimit`
   - Region: la más cercana a tu Vercel
   - Type: Regional
3. Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
4. Ir a **Vercel Dashboard** → SchedAssist → Settings → Environment Variables
5. Agregar ambas variables
6. **Costo:** Free tier (10K req/día)

---

### 🔴 PASO 3: Configurar WhatsApp App Secret (3 min)

1. Ir a https://developers.facebook.com/apps/
2. Seleccionar tu app de WhatsApp Business
3. Settings → Basic → App Secret
4. Copiar y agregar en Vercel como `WHATSAPP_APP_SECRET`

---

### 🔴 PASO 4: Configurar Telegram Webhook (5 min)

1. En terminal: `openssl rand -hex 32` → copiar resultado
2. Agregar en Vercel como `TELEGRAM_WEBHOOK_SECRET`
3. En Telegram, hablar con @BotFather:
   ```
   /setwebhook
   https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=https://www.schedassist.com/api/webhooks/telegram&secret_token=<EL_SECRET>
   ```

---

### 🟢 PASO 5: Verificar Resend (2 min)

1. Ir a https://resend.com/domains
2. Verificar que `schedassist.com` esté "Verified"
3. Si no: seguir instrucciones de DNS
4. Una vez verificado: actualizar `RESEND_FROM_EMAIL` en Vercel a `SchedAssist <no-reply@schedassist.com>`

---

## 📊 Puntaje

| Antes | Ahora (código) | Con pasos manuales |
|-------|----------------|-------------------|
| 7.25/10 | 8/10 | 9/10 ✅ |
