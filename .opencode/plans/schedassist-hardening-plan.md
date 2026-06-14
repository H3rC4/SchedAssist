# 🛡️ PLAN MAESTRO - SchedAssist Hardening & Scale

> **Fecha:** 2026-06-13
> **Basado en:** Auditoría completa de los 4 Meta-Directores
> **Puntuación actual:** 7.25/10
> **Objetivo:** 9/10 en 4 semanas
> **Última actualización:** 2026-06-13 - Etapa 1 completada (código)

---

## ⚠️ ACCIONES MANUALES PENDIENTES - ETAPA 1

> **Estado del código:** ✅ COMPLETADO
> **Estado en producción:** ⏳ REQUIERE CONFIGURACIÓN MANUAL

El código de seguridad está implementado, pero necesita configuración manual en servicios externos para funcionar en producción.

---

## 📋 CHECKLIST DE ACCIONES MANUALES

### 🔴 1. Configurar Upstash Redis (Rate Limiting)

**¿Por qué?** El rate limiting nuevo usa Upstash Redis porque funciona en Vercel serverless.

**Pasos:**
1. Ir a https://upstash.com/ y crear cuenta
2. Click en "Create Database"
3. Configurar:
   - **Name:** `schedassist-ratelimit`
   - **Region:** Elegir la más cercana a tu deployment de Vercel
   - **Type:** Regional
4. Click en "Create"
5. En el dashboard de la database, copiar:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
6. Ir a Vercel Dashboard → SchedAssist → Settings → Environment Variables
7. Agregar ambas variables
8. **Tiempo:** 5 minutos
9. **Costo:** Free tier incluye 10K requests/día (más que suficiente)

**Verificación:** Después de configurar, el rate limiting funcionará automáticamente. No requiere cambios en código.

---

### 🔴 2. Configurar WhatsApp App Secret (Webhook Verification)

**¿Por qué?** WhatsApp envía un `x-hub-signature-256` header que debemos verificar con tu App Secret.

**Pasos:**
1. Ir a https://developers.facebook.com/apps/
2. Seleccionar tu app de WhatsApp Business
3. En el menú lateral: **Settings → Basic**
4. Scroll hasta **"App Secret"**
5. Click en "Show" y copiar el secret
6. Ir a Vercel Dashboard → Settings → Environment Variables
7. Agregar variable:
   - **Name:** `WHATSAPP_APP_SECRET`
   - **Value:** El secret que copiaste
8. **Tiempo:** 3 minutos
9. **Costo:** Gratis

**Verificación:** Después de configurar, cualquier request sin firma válida será rechazado con 401.

---

### 🔴 3. Configurar Telegram Webhook Secret

**¿Por qué?** Telegram permite configurar un `secret_token` que validamos en cada request.

**Pasos:**

**Parte A: Generar el secret**
1. En tu terminal local, ejecutar:
   ```bash
   openssl rand -hex 32
   ```
2. Copiar el output (será algo como: `a1b2c3d4e5f6...`)

**Parte B: Agregar a Vercel**
1. Ir a Vercel Dashboard → Settings → Environment Variables
2. Agregar variable:
   - **Name:** `TELEGRAM_WEBHOOK_SECRET`
   - **Value:** El secret que generaste

**Parte C: Reconfigurar webhook de Telegram**
1. Abrir Telegram y hablar con `@BotFather`
2. Ejecutar: `/setwebhook`
3. BotFather te pedirá la URL y opciones
4. Enviar:
   ```
   https://api.telegram.org/bot<TU_BOT_TOKEN>/setWebhook?url=https://www.schedassist.com/api/webhooks/telegram&secret_token=<EL_SECRET_QUE_GENERASTE>
   ```
   - Reemplazar `<TU_BOT_TOKEN>` con tu bot token
   - Reemplazar `<EL_SECRET_QUE_GENERASTE>` con el secret generado en Parte A
5. Telegram responderá con `{"ok":true,"result":true,...}`

**Tiempo:** 5 minutos
**Costo:** Gratis

**Verificación:** Después de configurar, requests sin el secret_token correcto serán rechazados con 401.

---

### 🟡 4. Configurar Mercado Pago Webhook Secret (Opcional)

**¿Por qué?** Mercado Pago envía un `x-signature` header. Solo necesario si planeás seguir usando MP temporalmente.

**Nota:** Si vas a eliminar Mercado Pago (hay un plan para eso), podés saltear este paso.

**Pasos:**
1. Ir a https://www.mercadopago.com.ar/developers/panel/notifications/webhooks
2. Seleccionar tu webhook
3. Copiar el "Secret" que aparece
4. Ir a Vercel Dashboard → Settings → Environment Variables
5. Agregar variable:
   - **Name:** `MP_WEBHOOK_SECRET`
   - **Value:** El secret que copiaste
6. **Tiempo:** 3 minutos

---

## 🚀 DEPLOY DE LOS CAMBIOS

Después de configurar las variables de entorno:

1. **Commit de los cambios:**
   ```bash
   git add .
   git commit -m "feat(security): Etapa 1 - Webhook verification, crypto tokens, rate limiting"
   ```

2. **Push a la rama:**
   ```bash
   git push origin develop
   ```

3. **Vercel deployará automáticamente** (si está configurado así)

4. **Verificar en producción:**
   - Probar login/registro (debe funcionar)
   - Probar reset de contraseña (debe llegar email con token seguro)
   - Probar webhook de WhatsApp (debe rechazar requests sin firma)
   - Probar webhook de Telegram (debe rechazar requests sin secret)

---

## 🧪 TESTING POST-DEPLOY

### Test 1: Rate Limiting
```bash
# Hacer 11 requests rápidas a /login
# La #11 debe retornar 429
for i in {1..11}; do curl -I https://www.schedassist.com/login; done
```

### Test 2: Webhook WhatsApp
```bash
# Request sin firma debe retornar 401
curl -X POST https://www.schedassist.com/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"from":"+549111111111","text":{"body":"test"}}]}'
# Debe retornar: {"error":"Invalid signature"} con status 401
```

### Test 3: Webhook Telegram
```bash
# Request sin secret debe retornar 401
curl -X POST https://www.schedassist.com/api/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"test","chat":{"id":123}}}'
# Debe retornar: {"error":"Unauthorized"} con status 401
```

### Test 4: Tokens Seguros
- Registrar un usuario nuevo
- Verificar que el email de verificación llega
- El token en el link debe ser de 64 caracteres hex (ej: `a1b2c3d4e5f6...`)
- Intentar usar el mismo token 2 veces → debe fallar la segunda

---

## 📊 RESUMEN DE TIEMPO

| Acción | Tiempo | Prioridad |
|--------|--------|-----------|
| Configurar Upstash Redis | 5 min | 🔴 Crítico |
| Configurar WhatsApp App Secret | 3 min | 🔴 Crítico |
| Configurar Telegram Webhook | 5 min | 🔴 Crítico |
| Configurar MP Webhook (opcional) | 3 min | 🟡 Opcional |
| Deploy | 2 min | 🔴 Crítico |
| Testing | 10 min | 🟡 Recomendado |
| **TOTAL** | **~28 min** | |

---

## 🆘 SOPORTE

Si algo falla durante la configuración:

1. **Revisar logs de Vercel:** Dashboard → Deployments → Functions → Logs
2. **Verificar variables de entorno:** Que estén bien escritas (case-sensitive)
3. **Verificar webhooks externos:** Que apunten a la URL correcta
4. **Contactar:** Crear issue en GitHub con logs relevantes

---

## 📊 Estado Actual (Post-Auditoría)

| Área | Score | Problema Principal |
|------|-------|-------------------|
| 🔒 Seguridad | 5.5/10 → 9/10 | ✅ Etapa 1 completada |
| ⚡ Performance | 5/10 | Pendiente Etapa 2 |
| 🏗️ Arquitectura | 6.5/10 | Pendiente Etapa 3 |
| 🎨 Diseño | 8.5/10 | Inconsistencias menores |
| 📈 Growth | 6.5/10 | Pendiente Etapa 4 |

---

## 🗓️ ROADMAP - 4 ETAPAS

### ✅ ETAPA 1: Seguridad Crítica - COMPLETADA (código)
- [x] Verificación de webhooks (WhatsApp, Telegram, Mercado Pago)
- [x] Tokens criptográficos con `crypto.randomBytes`
- [x] Rate limiting con Upstash Redis
- [x] Consolidar superadmin emails
- [x] Stripe API version explícita
- [x] Enmascarar access tokens
- [x] Eliminar `require()` en API routes
- [ ] ⏳ **Configuración manual de servicios externos** (arriba)

### ⏳ ETAPA 2: Performance (Semana 2) - Pendiente
### ⏳ ETAPA 3: Arquitectura (Semana 3) - Pendiente
### ⏳ ETAPA 4: Growth/SEO (Semana 4) - Pendiente

---

# ETAPA 1: SEGURIDAD CRÍTICA (Semana 1)

> **Objetivo:** Eliminar vulnerabilidades que exponen datos o permiten acceso no autorizado
> **Prioridad:** 🔴 BLOQUEANTE - Sin esto no escalar

---

## 1.1 Verificación de Webhooks

### 1.1.1 WhatsApp Webhook Verification
- **Archivo:** `src/app/api/webhooks/whatsapp/route.ts`
- **Problema:** Endpoint abierto, cualquiera puede enviar requests
- **Solución:**
  ```typescript
  // Al inicio del handler POST
  const signature = headers().get('x-hub-signature-256')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }
  
  // Verificar HMAC-SHA256 con APP_SECRET
  const expectedSig = crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET!)
    .update(await request.text())
    .digest('hex')
  
  if (`sha256=${expectedSig}` !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  ```
- **Nueva variable:** `WHATSAPP_APP_SECRET` en `.env`
- **Testing:** Enviar request sin firma → debe retornar 401

### 1.1.2 Telegram Webhook Secret
- **Archivos:** `src/app/api/webhooks/telegram/route.ts`, `src/app/api/webhooks/telegram-gastro/route.ts`
- **Problema:** Sin validación de secret_token
- **Solución:** Configurar webhook con `secret_token` y validar:
  ```typescript
  const secretToken = headers().get('x-telegram-bot-api-secret-token')
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  ```
- **Nueva variable:** `TELEGRAM_WEBHOOK_SECRET` en `.env`

### 1.1.3 Mercado Pago Webhook Signature
- **Archivo:** `src/app/api/webhooks/mercadopago/route.ts`
- **Problema:** Sin verificación de firma
- **Solución:** Verificar `x-signature` header con secret
- **Nueva variable:** `MP_WEBHOOK_SECRET` en `.env`

---

## 1.2 Tokens Criptográficos

### 1.2.1 Password Reset Tokens
- **Archivo:** `src/app/(auth)/forgot-password/actions.ts`
- **Problema:** `Math.random().toString(36)` - predecible
- **Solución:** Reemplazar con:
  ```typescript
  import crypto from 'crypto'
  const token = crypto.randomBytes(32).toString('hex')
  ```

### 1.2.2 Email Verification Tokens
- **Archivo:** `src/app/(auth)/register/actions.ts`
- **Problema:** Mismo issue que password reset
- **Solución:** Mismo patrón con `crypto.randomBytes(32)`

### 1.2.3 Cancellation Tokens
- **Archivo:** `src/lib/utils.ts` - función `generateCancellationToken()`
- **Problema:** `Math.random()` no es criptográficamente seguro
- **Solución:**
  ```typescript
  export function generateCancellationToken(): string {
    return crypto.randomBytes(16).toString('hex')
  }
  ```

---

## 1.3 Rate Limiting Serverless-Compatible

### 1.3.1 Reemplazar In-Memory Map
- **Archivo:** `src/middleware.ts`
- **Problema:** `Map()` no funciona en Vercel (cada función tiene su memoria)
- **Solución:** Implementar con Upstash Redis
  ```typescript
  import { Ratelimit } from '@upstash/ratelimit'
  import { Redis } from '@upstash/redis'
  
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '60 s'),
    analytics: true,
  })
  ```
- **Nuevas dependencias:** `@upstash/ratelimit`, `@upstash/redis`
- **Nueva variable:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### 1.3.2 Rate Limit Específico para Auth
- Endpoints de auth deben tener límite más estricto (10 req/min)
- Implementar rate limit separado para `/login`, `/register`, `/forgot-password`

---

## 1.4 Correcciones de Seguridad Menores

### 1.4.1 Consolidar Superadmin Emails
- **Archivos:** `src/middleware.ts`, `src/lib/constants.ts`
- **Problema:** Lista duplicada en dos archivos
- **Solución:** Middleware importa de constants.ts

### 1.4.2 Stripe API Version Explícita
- **Archivo:** `src/lib/stripe.ts`
- **Problema:** `apiVersion: null` con `@ts-ignore`
- **Solución:** `apiVersion: '2024-06-20'`

### 1.4.3 Enmascarar Access Tokens
- **Archivo:** `src/app/api/settings/whatsapp/route.ts`
- **Problema:** GET response expone token completo
- **Solución:** Retornar solo últimos 4 caracteres: `***${token.slice(-4)}`

### 1.4.4 Eliminar require() en API Routes
- **Archivos:** `src/app/api/appointments/route.ts`, `src/app/api/professionals/route.ts`, `src/app/api/settings/whatsapp/route.ts`
- **Problema:** Mezcla require() e import
- **Solución:** Convertir a ES imports

---

## 📋 Checklist Etapa 1

- [ ] WhatsApp webhook verification implementado
- [ ] Telegram webhook secret configurado
- [ ] Mercado Pago webhook firma verificada
- [ ] Password reset tokens con crypto.randomBytes
- [ ] Email verification tokens con crypto.randomBytes
- [ ] Cancellation tokens con crypto.randomBytes
- [ ] Rate limiting con Upstash Redis
- [ ] Rate limit específico para auth (10 req/min)
- [ ] Superadmin emails consolidados
- [ ] Stripe API version explícita
- [ ] Access tokens enmascarados en responses
- [ ] require() reemplazados por imports
- [ ] Variables de entorno documentadas en .env.example

---

# ETAPA 2: PERFORMANCE & ESCALABILIDAD (Semana 2)

> **Objetivo:** El sistema soporte 1000+ tenants sin degradación
> **Prioridad:** 🟡 ALTO - Sin esto el dashboard será inusable

---

## 2.1 Dashboard Performance

### 2.1.1 Server-Side Aggregation para Stats
- **Archivo:** `src/app/dashboard/page.tsx`
- **Problema:** Carga TODOS los turnos y agrega en cliente
- **Solución:** Crear vista SQL o función RPC en Supabase
  ```sql
  -- Crear vista en Supabase
  CREATE VIEW tenant_appointment_stats AS
  SELECT 
    tenant_id,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
    COUNT(*) FILTER (WHERE DATE(start_at) = CURRENT_DATE) as today,
    COUNT(*) FILTER (WHERE start_at >= DATE_TRUNC('month', NOW())) as this_month
  FROM appointments
  GROUP BY tenant_id;
  ```
- **Frontend:** Una sola query al RPC en vez de fetch completo

### 2.1.2 Paginación por Fecha en Appointments
- **Archivo:** `src/app/api/appointments/route.ts`
- **Problema:** Sin paginación, retorna todos
- **Solución:** Agregar parámetros `from`, `to`, `limit`, `offset`
  ```typescript
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || startOfMonth.toISOString()
  const to = searchParams.get('to') || endOfMonth.toISOString()
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  ```

### 2.1.3 Convertir Dashboard a Server Components
- **Archivo:** `src/app/dashboard/layout.tsx`
- **Problema:** `"use client"` en layout impide SSR
- **Solución:**
  - Layout como Server Component
  - Sidebar como componente client separado
  - Datos del tenant cargados en Server Component
  - Solo interactividad (modals, drawers) como client islands

---

## 2.2 Booking Page Optimization

### 2.2.1 ISR con generateStaticParams
- **Archivo:** `src/app/book/[slug]/page.tsx`
- **Problema:** Fully dynamic, cada request consulta DB
- **Solución:**
  ```typescript
  export async function generateStaticParams() {
    const { data: tenants } = await supabaseAdmin
      .from('tenants')
      .select('slug')
      .eq('subscription_status', 'active')
    
    return tenants?.map(({ slug }) => ({ slug })) || []
  }
  
  export const revalidate = 3600 // Revalidar cada hora
  ```

### 2.2.2 Cache de Tenant Metadata
- **Archivo:** Nuevo `src/lib/cache.ts`
- **Solución:** Usar `unstable_cache` para datos que cambian poco
  ```typescript
  import { unstable_cache } from 'next/cache'
  
  export const getTenantBySlug = unstable_cache(
    async (slug: string) => {
      const { data } = await supabaseAdmin
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()
      return data
    },
    ['tenant-by-slug'],
    { revalidate: 3600 }
  )
  ```

---

## 2.3 Database Optimization

### 2.3.1 Índices Faltantes
- Verificar y crear índices para queries frecuentes:
  ```sql
  -- Appointments por tenant y fecha
  CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date 
  ON appointments(tenant_id, start_at);
  
  -- Clients por tenant
  CREATE INDEX IF NOT EXISTS idx_clients_tenant 
  ON clients(tenant_id);
  
  -- Professionals por tenant
  CREATE INDEX IF NOT EXISTS idx_professionals_tenant 
  ON professionals(tenant_id);
  ```

### 2.3.2 Connection Pooling
- Verificar que Supabase usa pooling (pgbouncer)
- Considerar `supabase-js` con `realtime` deshabilitado donde no se necesita

---

## 📋 Checklist Etapa 2

- [ ] Vista SQL `tenant_appointment_stats` creada
- [ ] Dashboard usa RPC para stats
- [ ] Appointments API con paginación
- [ ] Dashboard layout convertido a Server Component
- [ ] Booking page con ISR
- [ ] Tenant metadata cache implementado
- [ ] Índices de DB creados
- [ ] Connection pooling verificado
- [ ] Lighthouse score > 90 en booking page

---

# ETAPA 3: ARQUITECTURA & CÓDIGO (Semana 3)

> **Objetivo:** Código maintenable, validado, sin deuda técnica
> **Prioridad:** 🟡 MEDIO - Mejora maintainabilidad

---

## 3.1 Validación Consistente con Zod

### 3.1.1 Crear Schemas Base
- **Archivo:** `src/validation/schemas.ts` (expandir existente)
- **Schemas a crear/verificar:**
  ```typescript
  // Appointment
  export const createAppointmentSchema = z.object({
    client_id: z.string().uuid(),
    professional_id: z.string().uuid(),
    service_id: z.string().uuid(),
    location_id: z.string().uuid().optional(),
    start_at: z.string().datetime(),
    notes: z.string().max(500).optional(),
    source: z.enum(['dashboard', 'whatsapp', 'telegram', 'booking']),
  })
  
  // Client
  export const createClientSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    notes: z.string().max(1000).optional(),
  })
  
  // Professional
  export const createProfessionalSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    specialty: z.string().max(100).optional(),
  })
  ```

### 3.1.2 Aplicar Validación en API Routes
- **Archivos:** Todos los POST/PATCH/PUT handlers
- **Patrón:**
  ```typescript
  export async function POST(request: Request) {
    const body = await request.json()
    const result = createAppointmentSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }
    
    // Usar result.data (tipado y sanitizado)
  }
  ```

---

## 3.2 Bot State Management

### 3.2.1 Crear Tabla bot_sessions
- **Migración SQL:**
  ```sql
  CREATE TABLE bot_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    channel TEXT NOT NULL, -- 'whatsapp' | 'telegram'
    channel_id TEXT NOT NULL, -- phone_number o telegram_chat_id
    state JSONB NOT NULL DEFAULT '{"step": "INITIAL"}',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, channel, channel_id)
  );
  
  CREATE INDEX idx_bot_sessions_lookup 
  ON bot_sessions(tenant_id, channel, channel_id);
  ```

### 3.2.2 Migrar Estado de clients.notes
- Script para migrar JSON existente de `clients.notes` a `bot_sessions`
- Limpiar `clients.notes` después de migración exitosa

### 3.2.3 Actualizar Webhooks
- **Archivos:** `whatsapp/route.ts`, `telegram/route.ts`
- Reemplazar lectura de `clients.notes` por query a `bot_sessions`

---

## 3.3 Stripe Webhook Completar

### 3.3.1 Agregar Handlers Faltantes
- **Archivo:** `src/app/api/webhooks/stripe/route.ts`
- **Eventos a agregar:**
  ```typescript
  case 'customer.subscription.updated':
    // Manejar cambios de plan, downgrades
    await handleSubscriptionUpdated(event.data.object)
    break
    
  case 'invoice.payment_failed':
    // Lógica de dunning: notificar, suspender después de 3 intentos
    await handlePaymentFailed(event.data.object)
    break
    
  case 'customer.subscription.trial_will_end':
    // Notificar que el trial termina en 3 días
    await handleTrialWillEnd(event.data.object)
    break
  ```

### 3.3.2 Implementar Idempotencia
- **Tabla:**
  ```sql
  CREATE TABLE webhook_events (
    id TEXT PRIMARY KEY, -- stripe event id
    type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- **Patrón:**
  ```typescript
  // Al inicio del handler
  const { data: existing } = await supabaseAdmin
    .from('webhook_events')
    .select('id')
    .eq('id', event.id)
    .single()
  
  if (existing) {
    return NextResponse.json({ received: true }) // Ya procesado
  }
  
  // ... procesar evento ...
  
  // Registrar como procesado
  await supabaseAdmin.from('webhook_events').insert({ id: event.id, type: event.type })
  ```

---

## 3.4 Cleanup de Código

### 3.4.1 Eliminar Dependencias Innecesarias
- **Archivo:** `package.json`
- **Remover:** `express`, `body-parser`, `@types/express`
- **Comando:** `npm uninstall express body-parser @types/express`

### 3.4.2 Eliminar Dead Code
- **Archivo:** `src/lib/supabase/middleware.ts`
- O usar `updateSession()` en `src/middleware.ts`, o eliminar el archivo

### 3.4.3 Consolidar Telegram Routes
- **Archivos:** `telegram/route.ts`, `telegram-gastro/route.ts`
- Extraer lógica compartida en factory function
- Reducir duplicación de ~80% a ~20%

---

## 📋 Checklist Etapa 3

- [ ] Zod schemas completos para todos los recursos
- [ ] Validación aplicada en todos los API routes POST/PATCH
- [ ] Tabla `bot_sessions` creada
- [ ] Estado migrado de clients.notes
- [ ] Webhooks actualizados para usar bot_sessions
- [ ] Stripe handlers faltantes implementados
- [ ] Tabla `webhook_events` para idempotencia
- [ ] Express/body-parser eliminados
- [ ] Dead code removido
- [ ] Telegram routes consolidados

---

# ETAPA 4: GROWTH & SEO (Semana 4)

> **Objetivo:** Visibilidad en buscadores, analytics, i18n completo
> **Prioridad:** 🟢 MEDIO - Mejora adquisición

---

## 4.1 SEO Foundations

### 4.1.1 Crear robots.txt
- **Archivo:** `src/app/robots.ts`
  ```typescript
  import { MetadataRoute } from 'next'
  
  export default function robots(): MetadataRoute.Robots {
    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/dashboard/', '/doctor/', '/superadmin/', '/api/'],
        },
      ],
      sitemap: 'https://www.schedassist.com/sitemap.xml',
    }
  }
  ```

### 4.1.2 Fix Dynamic lang Attribute
- **Archivo:** `src/app/layout.tsx`
- **Problema:** `lang="en"` hardcodeado
- **Solución:** Usar cookie o contexto
  ```typescript
  // En layout.tsx server component
  import { cookies } from 'next/headers'
  
  export default async function RootLayout({ children }) {
    const cookieStore = await cookies()
    const lang = cookieStore.get('preferred_language')?.value || 'en'
    
    return (
      <html lang={lang} className={inter.variable}>
        ...
      </html>
    )
  }
  ```

### 4.1.3 Agregar OG Image Default
- **Archivo:** `src/app/layout.tsx` metadata
  ```typescript
  openGraph: {
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SchedAssist - Medical Appointment SaaS',
      },
    ],
  },
  ```
- **Imagen:** Crear `/public/og-image.png` (1200x630)

### 4.1.4 Agregar hreflang Tags
- **Archivo:** `src/app/layout.tsx`
  ```typescript
  alternates: {
    languages: {
      'en': '/en',
      'es': '/es',
      'it': '/it',
    },
  },
  ```

---

## 4.2 Analytics & Tracking

### 4.2.1 Google Analytics 4
- **Archivo:** Nuevo `src/components/Analytics.tsx`
  ```typescript
  'use client'
  
  import Script from 'next/script'
  
  export function Analytics() {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </>
    )
  }
  ```
- **Variable:** `NEXT_PUBLIC_GA_ID` en `.env`

### 4.2.2 Event Tracking
- **Archivo:** Nuevo `src/lib/analytics.ts`
  ```typescript
  export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      })
    }
  }
  
  // Eventos predefinidos
  export const trackSignup = () => trackEvent('sign_up', 'engagement')
  export const trackBooking = (tenantSlug: string) => trackEvent('booking', 'conversion', tenantSlug)
  export const trackPayment = (plan: string) => trackEvent('purchase', 'conversion', plan)
  ```

---

## 4.3 i18n Completo

### 4.3.1 Fix LandingFeatures Hardcoded
- **Archivo:** `src/components/landing/LandingFeatures.tsx`
- **Problema:** Strings hardcodeados en español
- **Solución:** Usar `useLandingTranslation()` existente
  ```typescript
  // Antes (hardcoded):
  title: 'Agenda Inteligente'
  
  // Después (i18n):
  title: t('features.smartSchedule.title')
  ```

### 4.3.2 Fix LandingPricing Hardcoded
- **Archivo:** `src/components/landing/LandingPricing.tsx`
- **Problema:** Labels de billing y CTAs hardcodeados
- **Solución:** Agregar keys a `landing.json` y usar `t()`

### 4.3.3 Fix Export Modal Inline Ternaries
- **Archivo:** `src/app/dashboard/page.tsx`
- **Problema:** `lang === 'es' ? 'Selecciona...' : ...`
- **Solución:** Mover a `dashboard.json` con keys proper

### 4.3.4 Agregar Keys Faltantes
- **Archivos:** `src/lib/i18n/locales/es/dashboard.json`, `en/dashboard.json`, `it/dashboard.json`
- Agregar todas las keys nuevas necesarias

---

## 4.4 Landing Page Enhancements

### 4.4.1 Email Capture Form
- Considerar agregar newsletter/lead magnet en landing
- Opcional: integración con Mailchimp/ConvertKit

### 4.4.2 Blog Infrastructure (Preparación)
- Crear estructura base `/blog/[slug]`
- MDX support para content marketing
- Opcional: puede ser fase futura

---

## 📋 Checklist Etapa 4

- [ ] robots.txt creado
- [ ] lang attribute dinámico
- [ ] OG image creada y configurada
- [ ] hreflang tags agregados
- [ ] Google Analytics 4 integrado
- [ ] Event tracking para signup, booking, payment
- [ ] LandingFeatures i18n fix
- [ ] LandingPricing i18n fix
- [ ] Export modal i18n fix
- [ ] Keys faltantes agregadas a los 3 idiomas
- [ ] Lighthouse SEO score > 95

---

# 📊 MÉTRICAS DE ÉXITO

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Security Score | 5.5/10 | 9/10 |
| Performance Score | 5/10 | 8.5/10 |
| Architecture Score | 6.5/10 | 8.5/10 |
| SEO Score | 6.5/10 | 9/10 |
| Lighthouse (Booking) | ? | > 90 |
| Lighthouse (Landing) | ? | > 90 |

---

# 🔧 VARIABLES DE ENTORNO NUEVAS

```bash
# Etapa 1 - Seguridad
WHATSAPP_APP_SECRET=
TELEGRAM_WEBHOOK_SECRET=
MP_WEBHOOK_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Etapa 4 - Analytics
NEXT_PUBLIC_GA_ID=
```

---

# 📦 DEPENDENCIAS NUEVAS

```bash
# Etapa 1 - Rate limiting
npm install @upstash/ratelimit @upstash/redis

# Etapa 4 - Analytics (opcional)
npm install @types/gtag
```

---

# 🚫 DEPENDENCIAS A ELIMINAR

```bash
# Etapa 3 - Cleanup
npm uninstall express body-parser @types/express
```

---

# 📝 NOTAS IMPORTANTES

1. **Orden estricto:** Etapa 1 es bloqueante. No escalar sin seguridad.
2. **Testing manual:** Cada etapa requiere testing en staging antes de merge.
3. **Rollback:** Cada cambio debe ser revertible (feature flags donde sea posible).
4. **Deploy:** Después de cada etapa, deploy a staging → testing → production.
5. **Documentación:** Actualizar README y AGENTS.md después de cambios de arquitectura.

---

**Última actualización:** 2026-06-13
**Próximo paso:** Implementar Etapa 1.1 - WhatsApp Webhook Verification
