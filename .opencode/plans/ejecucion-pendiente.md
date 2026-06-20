# 🚀 PLAN DE EJECUCIÓN - SchedAssist Hardening

> **Estado:** 20/06/2026
> **Sesión de hoy:** Código hardening commiteado, deployado y bugs críticos fixeados
> **Próxima sesión:** Configurar Upstash Redis

---

## ✅ HECHO HOY (20/06/2026)

### Bug crítico de email
| Tarea | Archivos | Estado |
|-------|----------|--------|
| Arreglar link de verificación (faltaba `/`) | `src/lib/utils.ts` + `register/actions.ts` + `register/resend-action.ts` + `forgot-password/actions.ts` | ✅ Deployado |
| Actualizar `RESEND_FROM_EMAIL` a dominio verificado | `.env` + Vercel | ✅ Hecho |

### Hardening Etapas 2-4
| Tarea | Archivos | Estado |
|-------|----------|--------|
| Vista SQL + RPC Dashboard | `supabase/migrations/20260617001_create_tenant_stats_view.sql` + `dashboard/page.tsx` | ✅ Commiteado + SQL ejecutado |
| Paginación Appointments API | `appointments/route.ts` | ✅ Commiteado |
| Índices DB | Migration SQL | ✅ Ejecutado en Supabase |
| Zod Schemas + validación | `validation/schemas.ts` + API routes | ✅ Commiteado |
| Cleanup código | Express/body-parser desinstalados, `cache.ts` eliminado | ✅ Commiteado |
| robots.txt | `src/app/robots.ts` | ✅ Commiteado |
| OG Image + hreflang | `layout.tsx` | ✅ Commiteado |
| i18n LandingFeatures + dashboard | `LandingFeatures.tsx` + locales | ✅ Commiteado |
| Seguridad GET appointments | `verifyTenantAccess` agregado | ✅ Commiteado |
| .gitignore para SQL | `!supabase/migrations/*.sql` | ✅ Commiteado |
| Timeline paciente | `start_at` en vez de `date`/`time` | ✅ Commiteado |
| Tailwind `text-on-surface-muted` | `tailwind.config.ts` | ✅ Commiteado |

### Deploys
| Rama | Commit | Estado |
|------|--------|--------|
| `develop` | `d6c930f` | ✅ Pusheado |
| `main` | `d6c930f` | ✅ Pusheado + deploy en Vercel |

---

## ⏳ PENDIENTE PARA MAÑANA

### 🔴 PASO 1: Configurar Upstash Redis (5 min)

1. Ir a https://upstash.com/ → crear cuenta
2. Crear Database:
   - Name: `schedassist-ratelimit`
   - Region: la más cercana a tu Vercel
   - Type: Regional
3. Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
4. Ir a **Vercel Dashboard** → SchedAssist → Settings → Environment Variables
5. Agregar ambas variables
6. Hacer redeploy
7. **Costo:** Free tier (10K req/día)

**Verificación:** Después de configurar, el rate limiting funcionará automáticamente. No requiere cambios en código.

---

## ⏸️ PENDIENTE PARA MÁS ADELANTE

### 🟡 PASO 2: Configurar WhatsApp App Secret

1. Ir a https://developers.facebook.com/apps/
2. Seleccionar tu app de WhatsApp Business
3. Settings → Basic → App Secret
4. Copiar y agregar en Vercel como `WHATSAPP_APP_SECRET`

### 🟡 PASO 3: Configurar Telegram Webhook Secret

1. En terminal: `openssl rand -hex 32` → copiar resultado
2. Agregar en Vercel como `TELEGRAM_WEBHOOK_SECRET`
3. En Telegram, hablar con @BotFather:
   ```
   /setwebhook
   https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=https://www.schedassist.com/api/webhooks/telegram&secret_token=<EL_SECRET>
   ```

---

## 📊 Puntaje

| Antes | Hoy | Con Upstash |
|-------|-----|-------------|
| 7.25/10 | 8.5/10 | 9/10 ✅ |

---

## 📝 Notas

- El código del hardening ya está en `main` y deployado en Vercel.
- El email de verificación de registro ahora funciona correctamente.
- El dashboard usa la vista SQL `tenant_appointment_stats` y la RPC `get_daily_appointment_counts`.
- Mañana solo falta Upstash Redis para cerrar la Etapa 1 de seguridad.
