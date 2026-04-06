# SchedAssist SaaS — Sistema Multi-Tenant de Agendamiento con WhatsApp & Telegram

## 🎯 Visión General

**SchedAssist** es un SaaS completo de agendamiento de citas diseñado para clínicas, centros médicos y negocios de servicios. El sistema permite que múltiples negocios ("tenants") operen de forma completamente aislada sobre una misma infraestructura compartida, con bots conversacionales propios y un dashboard de gestión profesional.

El sistema opera en tres frentes:

1. **Motor Conversacional Multi-Canal:** Un bot de estado contextual (`engine.ts`) que atiende citas automáticamente tanto por **WhatsApp** (via Whapi.Cloud) como por **Telegram** (via Bot API nativa). Soporta español, inglés e italiano de forma dinámica según el tenant.
2. **Dashboard Operativo por Tenant:** Portal web donde doctores y secretarias gestionan citas, pacientes, profesionales, servicios y configuración del negocio. Incluye modo oscuro y localización completa.
3. **Dashboard Super Admin (Panel Maestro):** Portal exclusivo del dueño del SaaS. Permite provisionar nuevos tenants con un solo clic: crea usuario, configura el negocio y popula datos demo en segundos.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología | Rol |
|------|-----------|-----|
| **Framework Web** | Next.js 14.2 (App Router) + TypeScript | Frontend & Backend (API Routes) |
| **Autenticación** | Supabase Auth (SSR) + Middleware RBAC | Sesiones seguras, protección de rutas |
| **Base de Datos** | Supabase (PostgreSQL) | Persistencia multi-tenant con `tenant_id` |
| **UI / Diseño** | Tailwind CSS + Lucide React + `next-themes` | Dark Mode, glassmorphism, diseño premium |
| **Bot Engine** | State Machine contextual (`engine.ts`) | Lógica de agendamiento compartida, canal-agnóstica |
| **Adapters** | `IChannelAdapter` (interfaz) + `WhapiAdapter` / `TelegramAdapter` | Un adapter por canal — el resto del código no conoce el proveedor |
| **WhatsApp** | Whapi.Cloud (Default) o **Meta Cloud API** | Mensajería modular. Intercambiable vía [Guía de Migración](WHATSAPP_MIGRATION_GUIDE.md) |
| **Telegram** | Telegram Bot API (vía `TelegramAdapter`) | Canal alternativo, instanciable por tenant |
| **Validación** | Zod | Schemas de validación en API Routes |
| **Fechas** | date-fns | Cálculo de slots, reminders, formateo localizado |
| **Internacionalización** | `translations.ts` custom | ES / EN / IT dinámico por tenant |
| **Recordatorios** | Script TSX (`send-reminders.ts`) | Notificaciones previas a la cita |
| **Tunnel local** | ngrok | Exposición de webhooks en desarrollo |

---

## 🏛️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENTE FINAL                          │
│         WhatsApp ──────────────── Telegram               │
└────────────────┬───────────────────────┬────────────────┘
                 │  Webhook HTTPS        │ Webhook HTTPS
                 ▼                       ▼
┌────────────────────────────────────────────────────────┐
│            NEXT.JS API ROUTES (Serverless)              │
│  /api/webhooks/whatsapp   /api/webhooks/telegram-gastro │
│   channel: 'whatsapp'      channel: 'telegram_gastro'   │
│                  │                   │                   │
│         ┌────────┴───────────────────┘                  │
│         ▼                                               │
│    engine.ts — Máquina de Estados (canal-agnóstica)     │
│    (INITIAL → SERVICE → PROF → DATE → TIME → CONFIRM)  │
│         │                                               │
│    translations.ts  ←──── tenant.settings.language      │
│         │                                               │
│    message.service.ts — Enrutador / Registro de Adaps.  │
│    ├── IChannelAdapter (interfaz común)                 │
│    ├── WhapiAdapter    → gate.whapi.cloud (WhatsApp)    │
│    └── TelegramAdapter → api.telegram.org               │
│                                                         │
│    ⚠  Intercambiar Whapi ↔ Meta Cloud API:           │
│       Sigue los pasos en [Guía de Migración](WHATSAPP_MIGRATION_GUIDE.md) │
│       engine.ts, webhooks y DB permanecen intactos.     │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────┐
          │    SUPABASE (PostgreSQL) │
          │  ┌────────────────────┐  │
          │  │ tenants            │  │
          │  │ tenant_users       │  │
          │  │ clients            │  │
          │  │ professionals      │  │
          │  │ services           │  │
          │  │ appointments       │  │
          │  │ business_hours     │  │
          │  └────────────────────┘  │
          └──────────────────────────┘
                         │
          ┌──────────────┴──────────────────┐
          │         NEXT.JS FRONTEND         │
          │  /dashboard      ← Tenant Ops    │
          │  /superadmin     ← Master SaaS   │
          │  /login          ← Auth Bouncer  │
          └──────────────────────────────────┘
```

---

## 🗂️ Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── dashboard/             # Panel del tenant (citas, profesionales, clientes, ajustes)
│   ├── superadmin/            # Panel maestro del SaaS Owner
│   └── api/
│       ├── webhooks/
│       │   ├── whatsapp/      # Entrada de mensajes de WhatsApp (Whapi.Cloud)
│       │   └── telegram-gastro/ # Entrada de mensajes de Telegram (tenant gastro)
│       ├── appointments/      # CRUD de citas
│       ├── professionals/     # CRUD de profesionales
│       ├── services/          # CRUD de servicios
│       └── settings/          # Configuración del tenant
├── lib/
│   └── bot/
│       ├── engine.ts          # Máquina de estados del bot (lógica compartida)
│       ├── translations.ts    # Textos en ES / EN / IT
│       ├── types.ts           # Tipos del bot context
│       └── utils.ts           # Helpers (showMainMenu, updateClientState, etc.)
├── services/
│   ├── adapters/
│   │   ├── channel.adapter.ts   # Interfaz IChannelAdapter (contrato común)
│   │   ├── whapi.adapter.ts     # Implementación Whapi.Cloud ← único archivo que conoce Whapi
│   │   └── telegram.adapter.ts  # Implementación Telegram Bot API
│   ├── message.service.ts       # Registro de adapters + enrutador canal-agnóstico
│   ├── appointment.service.ts   # Slots disponibles, creación, cancelación
│   └── audit.service.ts         # Auditoría de eventos
├── scripts/
│   ├── send-reminders.ts      # Cron de recordatorios de citas
│   ├── setup-gastro-tenant.ts # Setup del tenant de gastroenterología
│   └── seed-gastro-*.ts       # Datos semilla para tenant gastro
├── components/                # Componentes de UI reutilizables
├── types/                     # Tipos globales TypeScript
├── validation/                # Schemas Zod
└── middleware.ts              # Protección de rutas con Supabase SSR
```

---

## 🗃️ Modelo de Base de Datos

El esquema pivotea sobre `tenant_id`, garantizando aislamiento de datos entre negocios:

| Tabla | Descripción |
|-------|-------------|
| `tenants` | Negocios registrados. Incluye campo `settings` JSONB (idioma, nombre, canal de bot, etc.) |
| `tenant_users` | Relación N:N entre usuarios de Auth y tenants. Define si el usuario es `owner`. |
| `clients` | Pacientes/clientes. Identificados por teléfono único por tenant. |
| `professionals` | Doctores, estilistas, etc. Tienen horarios propios via `business_hours`. |
| `services` | Servicios ofrecidos. Cada uno tiene duración configurable en minutos. |
| `appointments` | Núcleo del sistema. Relaciona cliente, profesional, servicio y tenant. Campo `source` indica si la cita vino de WhatsApp o Telegram. |
| `business_hours` | Reglas de disponibilidad por día y profesional. |

---

## 🤖 Motor Conversacional (engine.ts)

El bot es una **máquina de estados** que guarda el paso actual de cada cliente en la base de datos. Flujo principal:

```
INITIAL
  └─ Agendar ──► ASK_WHO_IS_PATIENT
       ├─ Para mí ──► WAIT_SERVICE
       │                └─► [Auto-Skip si 1 profesional] ──► WAIT_DATE
       │                └─► WAIT_PROFESSIONAL ──► WAIT_DATE
       │                                              └─► WAIT_TIME
       │                                                    └─► ASK_COMMENT_DECISION
       │                                                          └─► WAIT_CONFIRMATION ──► ✅
       └─ Para otro ──► WAIT_PATIENT_NAME ──► WAIT_PATIENT_LAST_NAME ──► WAIT_PATIENT_PHONE ──► WAIT_SERVICE...

  └─ Cancelar ──► WAIT_CANCEL_SELECTION ──► ✅
```

**Características clave:**
- **Auto-Skip de Profesional:** Si el tenant tiene un solo profesional activo para el servicio elegido, el bot omite la pregunta de profesional y va directo a la selección de fecha.
- **Multilingual:** Cada mensaje usa `t('clave', lang)` donde `lang` se lee desde `tenant.settings.language`. Soporta `es`, `en`, `it`.
- **Reset global:** Cualquier saludo (hola, hi, ciao, etc.) reinicia al menú principal desde cualquier estado.
- **Canal agnóstico:** El mismo `engine.ts` sirve tanto a WhatsApp como a Telegram; el `MessageService` enruta la respuesta al canal correcto.

---

## 🌐 Integración WhatsApp (Whapi.Cloud)

A diferencia de soluciones basadas en Puppeteer/Chromium, la integración actual usa **Whapi.Cloud**, una API REST oficial:

- **Sin Chromium:** No hay instancias de browser corriendo en el servidor. El consumo de RAM por tenant es mínimo (solo la sesión en Whapi.Cloud).
- **Webhook HTTPS:** Whapi.Cloud envía los mensajes entrantes a `/api/webhooks/whatsapp` via POST.
- **Credencial por tenant:** Cada tenant tiene su propio `whapi_token` almacenado en `tenant.settings`.
- **Mensajes salientes:** El `WhatsAppService` hace `POST https://gate.whapi.cloud/messages/text` con el token del tenant correspondiente.
- **Flexibilidad de Proveedor:** La arquitectura permite migrar a la **API Oficial de Meta** u otros (como Twilio o Baileys) implementando un nuevo `IChannelAdapter`. Consulta la [Guía de Migración](WHATSAPP_MIGRATION_GUIDE.md) para más detalles.

---

## 📡 Integración Telegram

El tenant de gastroenterología usa Telegram como canal primario:

- Webhook registrado en `/api/webhooks/telegram-gastro`.
- El `TelegramService` usa la Bot API oficial con `TELEGRAM_BOT_TOKEN` como variable de entorno.
- El mismo `engine.ts` procesa los mensajes; el `MessageService` detecta el canal y enruta la respuesta correctamente.

---

## 🎨 Dashboard & UI

- **Dark Mode** nativo con `next-themes` (toggle persistente).
- **Diseño Glassmorphism** premium con Tailwind CSS.
- **Localización completa** del dashboard (fechas con `date-fns`, textos por `settings.language`).
- **Páginas del tenant:** Citas, Profesionales, Clientes, Servicios, Configuración.
- **Superadmin:** Wizard de creación de tenants con provisioning automático (usuario Auth + datos demo).

---

## 🚀 Cómo Ejecutar Localmente

### Prerequisitos
- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Whapi.Cloud](https://whapi.cloud) (para WhatsApp)
- [ngrok](https://ngrok.com) (para exponer webhooks en local)

### Variables de Entorno

Crea un archivo `.env.local` basado en `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
```

### Iniciar

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev

# En otra terminal: exponer webhooks al exterior
npm run tunnel  # alias de: npx ngrok http 3000
```

### Scripts útiles

```bash
# Enviar recordatorios de citas próximas
npm run reminders

```bash
# Provisionar el tenant de gastroenterología
npm run seed:gastro
```

---

## 🔐 Configuración de Recuperación de Contraseña (Producción)

Para que el flujo de "Olvidé mi contraseña" funcione en producción, debes realizar los siguientes pasos:

1. **Supabase Dashboard:**
   - Ve a **Authentication > URL Configuration**.
   - En **Redirect URLs**, añade la URL de tu dominio (ej: `https://tu-saas.com/auth/callback`).
   - Asegúrate de que `SITE_URL` sea la principal.

2. **Variables de Entorno (.env):**
   - Configura `NEXT_PUBLIC_SITE_URL=https://tu-saas.com`. El sistema usa esta variable para generar los enlaces de recuperación.

3. **Verificación:**
   - Prueba el flujo desde `/forgot-password` para asegurar que el email llega con el enlace correcto que apunta a tu dominio.

---

## 📈 Escalabilidad

### Base de Datos & Web

La arquitectura sobre **Next.js + Supabase (PostgreSQL)** es horizontalmente escalable:

- Todos los queries filtran por `tenant_id`, garantizando aislamiento y velocidad independientemente del número de negocios.
- La lógica serverless (API Routes) escala automáticamente con el tráfico.

### WhatsApp (Whapi.Cloud)

Al haber migrado de `whatsapp-web.js` a Whapi.Cloud:

- ✅ **Sin Chromium / Puppeteer en servidor.** No hay consumo de 150-300 MB de RAM por tenant.
- ✅ **100+ tenants** pueden operar concurrentemente sin impacto en el servidor propio.
- ✅ **Sin necesidad de escanear QR.** Las sesiones se gestionan completamente en la nube de Whapi.

### Roadmap

| **Recuperación de Clave** | Sistema de `/forgot-password` y `/reset-password` vía email con Supabase Auth. | ✅ Hecho |
| **RLS (Row Level Security)** | Implementar políticas de seguridad en PostgreSQL para que ningún query de frontend pueda acceder a datos de otro tenant. | ⏳ Pendiente |
| **Telegram por tenant** | Actualmente el bot de Telegram es exclusivo de un tenant. Generalizar para todos los tenants. | ⏳ Pendiente |
| **Recordatorios automáticos** | Integrar `send-reminders.ts` con un cron job (Vercel Cron o Supabase). | ⏳ Pendiente |
| **Pagos & Suscripciones** | Integrar Stripe para la facturación mensual de los tenants. | ⏳ Pendiente |
| **Meta Cloud API Oficial** | Documentación y guía de migración técnica preparada. | ✅ Guía Lista |
