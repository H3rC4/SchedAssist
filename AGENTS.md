# SchedAssist - Project Context & Architecture Guide

> **SaaS de gestión de turnos clínicos/medical con multi-tenancy, WhatsApp automation, y Stripe billing**

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 14.2.3 (App Router) |
| **Lenguaje** | TypeScript 5.4.5 |
| **UI** | React 18.3.1 + Tailwind CSS 3.4.3 |
| **Animaciones** | Framer Motion 12 |
| **Iconos** | Lucide React |
| **Base de datos** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (SSR con @supabase/ssr) |
| **Pagos** | Stripe (checkout, subscriptions, webhooks) |
| **Mensajería** | WhatsApp (webhooks), Telegram (webhooks) |
| **Charts** | Recharts 3 |
| **Validación** | Zod 3 |
| **i18n** | Custom (es, en, it) via LanguageContext |
| **Deployment** | Vercel |

---

## 2. Estructura de Carpetas

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (grupo de rutas)
│   │   ├── login/                # Login page + server actions
│   │   ├── register/             # Registro page + server actions
│   │   ├── forgot-password/      # Recuperación de contraseña
│   │   └── reset-password/       # Reset de contraseña
│   ├── api/                      # API Routes (REST endpoints)
│   │   ├── appointments/         # CRUD turnos + available-slots + notify
│   │   ├── clients/              # CRUD pacientes/clientes
│   │   ├── clinical-records/     # Historias clínicas
│   │   ├── professionals/        # CRUD profesionales
│   │   ├── services/             # CRUD servicios
│   │   ├── locations/            # CRUD ubicaciones/sucursales
│   │   ├── waitlists/            # Lista de espera
│   │   ├── tenant/               # Tenant management (onboarding, settings, delete)
│   │   ├── settings/whatsapp/    # Config WhatsApp
│   │   ├── webhooks/             # Stripe, WhatsApp, Telegram webhooks
│   │   ├── cron/                 # Cron jobs (reminders, waitlist followup)
│   │   ├── checkout/             # Stripe checkout session
│   │   └── billing/portal/       # Stripe billing portal
│   ├── dashboard/                # Panel admin del tenant
│   │   ├── page.tsx              # Dashboard home (stats, charts)
│   │   ├── appointments/         # Gestión de turnos
│   │   ├── clients/              # Gestión de pacientes
│   │   ├── professionals/        # Gestión de profesionales
│   │   ├── services/             # Gestión de servicios
│   │   ├── locations/            # Gestión de ubicaciones
│   │   ├── whatsapp/             # Config WhatsApp
│   │   ├── analytics/            # Analytics y métricas
│   │   ├── pay/                  # Stripe payment redirect
│   │   └── settings/             # Settings del tenant (billing, notifications, whatsapp)
│   ├── doctor/                   # Panel del profesional (vista doctor)
│   │   ├── page.tsx              # Dashboard del doctor
│   │   ├── patients/             # Pacientes del doctor
│   │   ├── schedule/             # Agenda del doctor
│   │   └── settings/             # Settings del doctor
│   ├── superadmin/               # Panel superadmin (gestión de tenants)
│   │   ├── page.tsx              # Lista de tenants
│   │   ├── metrics/              # Métricas globales
│   │   ├── 2fa/                  # 2FA para superadmin
│   │   └── reset-password/       # Reset password superadmin
│   ├── book/[slug]/              # Página pública de booking por tenant slug
│   ├── register/clinic/          # Registro de nueva clínica/tenant
│   ├── auth/callback/            # Callback de OAuth (Supabase)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   ├── auth/                     # GoogleAuthButton, MicrosoftAuthButton
│   ├── appointments/             # AppointmentDetailDrawer, QuickAppointmentDrawer, WeeklyCalendar, MiniCalendar, PatientSearch, DayActivityFeed
│   ├── clients/                  # NewPatientDrawer, PatientMedicalRecordDrawer
│   ├── dashboard/                # Sidebar, HeaderActions, StatCard, DashboardCharts, OnboardingWizard, TrialBanner, WaitlistView, InteractiveTutorial, SkeletonStates, ForcePasswordChangeGate, LocationPrecisionCard, ServicePrecisionCard
│   ├── doctor/                   # DoctorSidebar
│   ├── landing/                  # LandingHero, LandingFeatures, LandingCustomization, RealisticDashboard, WhatsAppChatPreview
│   ├── professionals/            # AddProfessionalModal, ProfessionalCard, ProfessionalDetailDrawer
│   ├── ui/                       # Skeleton
│   ├── LanguageContext.tsx       # i18n context (es, en, it)
│   ├── LanguageSelector.tsx      # Selector de idioma
│   ├── Logo.tsx                  # Logo component
│   ├── Navbar.tsx                # Navbar landing
│   ├── ThemeProvider.tsx         # Theme provider (next-themes)
│   └── ThemeToggle.tsx           # Toggle dark/light
├── hooks/                        # Custom hooks
├── lib/
│   ├── supabase/                 # Supabase clients (server, client, admin, middleware)
│   ├── stripe.ts                 # Stripe client
│   ├── i18n.ts                   # i18n utilities
│   └── utils.ts                  # cn() utility (clsx + tailwind-merge)
├── scripts/                      # Scripts CLI (tsx)
│   ├── send-reminders.ts         # Envío de recordatorios
│   ├── link-whatsapp.ts          # Link WhatsApp
│   ├── switch-whatsapp.ts        # Switch WhatsApp provider
│   ├── setup-gastro-tenant.ts    # Setup tenant gastro
│   └── seed-gastro-*.ts          # Seed data gastro
├── services/                     # Business logic services
├── types/
│   └── index.ts                  # TypeScript types/interfaces
├── validation/
│   └── schemas.ts                # Zod validation schemas
└── middleware.ts                 # Next.js middleware (auth, rate limiting, security headers)
```

---

## 3. Arquitectura Multi-Tenant

### Modelo de datos
- **Tenants**: Cada clínica/consultorio es un tenant con `id`, `name`, `slug`, `timezone`, `settings`
- **Tenant Users**: Tabla `tenant_users` con `user_id`, `tenant_id`, `role` (tenant_admin, secretary, professional)
- **Row Level Security (RLS)**: Supabase RLS para aislar datos por tenant
- **Profesionales**: Pertenecen a un tenant, pueden tener user_id asociado para auth
- **Clientes/Pacientes**: Pertenecen a un tenant
- **Turnos**: Pertenecen a un tenant, referencian client, professional, service

### Roles
- **tenant_admin**: Admin completo del tenant
- **secretary**: Gestión de turnos y clientes
- **professional**: Vista doctor limitada a su agenda y pacientes

### Superadmin
- Email whitelist: `hernanenriquecaballero@gmail.com`
- Acceso a `/superadmin` para gestionar todos los tenants
- 2FA obligatorio con QR TOTP (otplib)
- Puede crear, activar, desactivar tenants

---

## 4. Design System

### 4.1 Paleta de Colores Completa (Clinical Premium)

| Token | Valor Hex | Tailwind Class | Uso |
|-------|-----------|----------------|-----|
| **Primary** | `#005c55` | `bg-primary`, `text-primary` | Botones principales, estados activos, links |
| **Primary Light** | `#0d9488` | `bg-primary-light`, `text-primary-light` | Hover de botones, acentos |
| **Primary 400** | `#14b8a6` | `text-primary-400` | Gradientes, elementos decorativos |
| **Primary Container** | `#004b46` | `bg-primary-container` | Variantes oscuras del primary |
| **Primary 950** | `#001f1c` | `bg-primary-950` | Fondos muy oscuros |
| **Surface** | `#f7f9fb` | `bg-surface` | Fondo de páginas del dashboard |
| **Surface Lowest** | `#ffffff` | `bg-surface-container-lowest` | Cards puras, modals |
| **Surface Low** | `#f2f4f6` | `bg-surface-container-low` | Cards secundarias |
| **On Surface** | `#191c1e` | `text-[#191c1e]` | Texto principal |
| **On Surface Variant** | `#444651` | `text-[#191c1e]/50` | Texto secundario |
| **Secondary** | `#855300` | `text-secondary` | Acentos secundarios |
| **Error** | `#ba1a1a` | `text-error` | Errores críticos |
| **Success** | `#10b981` | `text-emerald-600` | Estados de éxito |
| **Warning** | `#f59e0b` | `text-accent` | Advertencias |

### 4.2 Patrones de Fondo

#### Fondo de Auth Pages (Login, Register, Forgot Password)
```tsx
<div className="min-h-screen w-full flex items-center justify-center bg-white p-6 overflow-hidden relative">
  {/* Blur decorativo de fondo */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/[0.03] blur-[120px] rounded-full -z-10 pointer-events-none" />
</div>
```

#### Fondo de Dashboard
```tsx
<div className="min-h-screen bg-surface">
  {/* Surface = #f7f9fb, un gris azulado muy suave */}
</div>
```

### 4.3 Cards y Contenedores

#### Card Principal (Auth Pages)
```tsx
<div className="border border-primary/10 p-12 md:p-16 relative overflow-hidden">
  {/* Texto decorativo de fondo */}
  <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none">
    <span className="text-6xl font-black uppercase tracking-tighter text-primary">Login</span>
  </div>
</div>
```

#### Card de Dashboard
```tsx
<div className="bg-surface-container-lowest rounded-xl border border-on-surface/5 shadow-card p-6">
  {/* Card blanca con borde sutil y sombra suave */}
</div>
```

### 4.4 Inputs y Formularios

#### Input Estándar (Auth Pages)
```tsx
<div className="relative group">
  <Icon className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors" />
  <input
    className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-5 text-sm font-bold text-[#191c1e] placeholder:text-primary/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
    placeholder="name@provider.com"
  />
</div>
```

**Reglas de inputs:**
- Fondo: `bg-primary/[0.03]`
- Borde: `border border-primary/20`
- Padding: `py-4 pl-14 pr-5` (icono a la izquierda con 14px de padding)
- Texto: `text-sm font-bold text-[#191c1e]`
- Placeholder: `placeholder:text-primary/30`
- Focus: `focus:ring-4 focus:ring-primary/10 focus:border-primary`
- Icono: `text-primary/30` que cambia a `text-primary` en focus

#### Label de Input
```tsx
<label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.3em] ml-2">
  Email Address
</label>
```

#### Select
```tsx
<select className="w-full bg-primary/[0.03] border border-primary/20 py-4 pl-14 pr-10 text-sm font-bold text-[#191c1e] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none">
```

### 4.5 Botones

#### Botón Principal (Submit)
```tsx
<button
  className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] transition-all shadow-xl shadow-primary/20 hover:bg-primary-light hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
>
  <span>Synchronize Access</span>
  <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
</button>
```

**Reglas de botón principal:**
- Fondo: `bg-primary`
- Texto: `text-white text-xs font-black uppercase tracking-[0.4em]`
- Sombra: `shadow-xl shadow-primary/20`
- Hover: `hover:bg-primary-light hover:scale-[1.02]`
- Active: `active:scale-95`
- Icono: `group-hover:translate-x-2 transition-transform`

#### Botón Secundario (Cancel/Link)
```tsx
<button className="text-[9px] font-black text-primary/60 uppercase tracking-widest hover:text-primary transition-colors">
  Cancel
</button>
```

#### Botones OAuth (Google/Microsoft)
- Usar componentes `GoogleAuthButton` y `MicrosoftAuthButton` de `@/components/auth/`
- Grid de 2 columnas: `grid grid-cols-2 gap-3`

### 4.6 Tipografía

#### Headers Principales (Auth Pages)
```tsx
<h1 className="text-4xl font-black text-[#191c1e] tracking-tighter uppercase mb-3">
  Welcome <br />
  <span className="text-primary italic">Back</span>
</h1>
```

#### Subtítulos y Labels
```tsx
<p className="text-[10px] font-black text-[#191c1e]/40 uppercase tracking-[0.4em]">
  Precision Identity Access
</p>
```

#### Badge/Tag
```tsx
<div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/10 bg-primary/[0.03] text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-6">
  <Sparkles className="h-3 w-3" /> Next-Generation Access
</div>
```

#### Links
```tsx
<Link href="/login" className="text-primary font-black uppercase tracking-widest text-[10px] ml-2 hover:text-primary-light transition-colors">
  Log In
</Link>
```

#### Back Link
```tsx
<Link href="/" className="flex items-center justify-center gap-3 text-[10px] font-black text-primary/50 uppercase tracking-[0.4em] mt-10 hover:text-primary transition-colors group">
  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-2" />
  Back to Portal
</Link>
```

### 4.7 Separadores y Divisores

#### Divisor con Texto
```tsx
<div className="flex items-center gap-4 py-2">
  <div className="h-px flex-1 bg-primary/10" />
  <span className="text-[8px] font-black text-primary/30 uppercase tracking-[0.4em]">or email</span>
  <div className="h-px flex-1 bg-primary/10" />
</div>
```

#### Divisor Horizontal
```tsx
<div className="mt-10 pt-8 border-t border-primary/10 flex flex-col items-center gap-4 text-center relative z-10">
```

### 4.8 Alertas y Mensajes

#### Alert de Error
```tsx
<motion.div 
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="mb-8 p-6 bg-red-50 border border-red-200 flex items-center gap-4"
>
  <div className="h-10 w-10 bg-red-100 flex items-center justify-center text-red-600 shrink-0">
    <AlertCircle className="h-5 w-5" />
  </div>
  <p className="text-sm font-bold text-red-800 tracking-tight uppercase">
    {error}
  </p>
</motion.div>
```

#### Alert de Éxito
```tsx
<motion.div 
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="mb-8 p-6 bg-emerald-50 border border-emerald-200 flex items-center gap-4"
>
  <div className="h-10 w-10 bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
    <ShieldCheck className="h-5 w-5" />
  </div>
  <p className="text-sm font-bold text-emerald-800 tracking-tight">
    Account verified. Access granted.
  </p>
</motion.div>
```

### 4.9 Loading States

#### Loading Overlay (Auth Pages)
```tsx
<AnimatePresence>
  {isSubmitting && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-2xl"
    >
      <div className="relative">
        <div className="h-32 w-32 border-[6px] border-primary/10 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <CalendarCheck className="h-10 w-10 text-primary animate-pulse" />
        </div>
      </div>
      <p className="mt-12 text-xs font-black text-[#191c1e] uppercase tracking-[0.5em] animate-pulse">
        Authenticating
      </p>
      <p className="mt-4 text-[10px] font-bold text-[#191c1e]/40 uppercase tracking-widest">
        Securing session...
      </p>
    </motion.div>
  )}
</AnimatePresence>
```

### 4.10 Animaciones (Framer Motion)

#### Entrada de Página
```tsx
<motion.div 
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
>
```

#### Entrada de Alertas
```tsx
<motion.div 
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
>
```

#### Hover en Cards/Links
```tsx
className="hover:scale-105 transition-transform active:scale-95"
```

### 4.11 Sombras (Box Shadows)

| Token | Tailwind Class | Uso |
|-------|----------------|-----|
| Spatial | `shadow-spatial` | Cards principales, modals |
| Ambient | `shadow-ambient` | Elementos flotantes |
| Card | `shadow-card` | Cards del dashboard |
| Float | `shadow-float` | Dropdowns, popovers |
| Modal | `shadow-modal` | Modals grandes |
| Primary | `shadow-xl shadow-primary/20` | Botones principales |

### 4.12 Iconos

- **Librería**: Lucide React
- **Tamaño estándar**: `h-4 w-4` para inputs, `h-5 w-5` para alerts
- **Color default**: `text-primary/30` en inputs, cambia a `text-primary` en focus
- **Iconos comunes**: `Mail`, `Lock`, `Building`, `Globe`, `ShieldCheck`, `AlertCircle`, `CalendarCheck`, `Sparkles`, `ArrowLeft`, `ChevronRight`, `Loader2`, `UserPlus`, `X`

### 4.13 Reglas de Diseño

1. **No usar emojis** a menos que se pida explícitamente
2. **Todo texto de label**: uppercase + tracking-widest o tracking-[0.4em]
3. **Font weight**: font-black para headers, font-bold para body text
4. **Espaciado**: usar mb-3, mb-6, mb-8, mb-10, mb-12 para márgenes
5. **Bordes sutiles**: border-primary/10 o border-primary/20, nunca bordes sólidos gruesos
6. **Fondos con opacidad**: bg-primary/[0.03], bg-primary/[0.08]
7. **Focus rings**: focus:ring-4 focus:ring-primary/10
8. **Transiciones**: transition-all en inputs, transition-transform en botones
9. **Z-index**: z-10 para contenido principal, z-[100] para overlays/modals
10. **Pointer events**: pointer-events-none en elementos decorativos

---

## 5. Rutas y Navegación

### Rutas públicas
- `/` - Landing page
- `/login` - Login
- `/register` - Registro
- `/forgot-password` - Recuperar contraseña
- `/reset-password` - Resetear contraseña
- `/book/[slug]` - Booking público por tenant

### Rutas protegidas (requieren auth)
- `/dashboard/*` - Panel admin (tenant_admin, secretary)
- `/doctor/*` - Panel profesional
- `/register/clinic` - Registro de nueva clínica
- `/superadmin/*` - Panel superadmin (con 2FA)

### Redirecciones (middleware)
- Usuario logueado en `/` o `/login` → `/dashboard` (o `/doctor` si es professional, `/superadmin` si es superadmin)
- Sin auth en rutas protegidas → `/login`
- Superadmin en `/dashboard` → `/superadmin` (excepto `/dashboard/pay`)

---

## 6. Integraciones

### Supabase
- **Auth**: Email/password + OAuth (Google, Microsoft)
- **Database**: PostgreSQL con RLS
- **Server client**: `createServerClient` con cookies SSR
- **Admin client**: Service role key para operaciones admin
- **3 instancias**: server.ts, client.ts, admin.ts, middleware.ts

### Stripe
- **Checkout**: `/api/checkout` crea sesión de checkout
- **Webhooks**: `/api/webhooks/stripe` maneja eventos (checkout.completed, etc.)
- **Billing portal**: `/api/billing/portal` redirige al portal de Stripe
- **Subscription fields**: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `subscription_price_id` en tenants

### WhatsApp
- **Webhook**: `/api/webhooks/whatsapp` recibe mensajes
- **Config**: Por tenant en settings
- **Funcionalidades**: Confirmación de turnos, recordatorios, cancelaciones

### Telegram
- **Webhook**: `/api/webhooks/telegram` (general) y `/api/webhooks/telegram-gastro` (gastro específico)
- **Funcionalidades**: Booking via bot

---

## 7. Funcionalidades Principales

### Gestión de Turnos
- CRUD completo de appointments
- Available slots API para booking
- Estados: pending, confirmed, awaiting_confirmation, cancelled, completed, no_show, rescheduled
- Fuentes: dashboard, whatsapp, telegram
- Recordatorios automáticos (cron job)
- Notificaciones de cancelación

### Gestión de Pacientes/Clientes
- CRUD con drawers para crear/editar
- Historias clínicas (clinical records)
- Búsqueda de pacientes
- WhatsApp opt-in

### Gestión de Profesionales
- CRUD con modal para crear
- Detalle en drawer
- Cambio de contraseña
- Override de configuración

### Gestión de Servicios
- CRUD con duración, precio, estado activo

### Gestión de Ubicaciones
- CRUD de sucursales/consultorios

### Lista de Espera
- Waitlist management
- Followup automático (cron job)

### Settings del Tenant
- Configuración general
- Billing (Stripe)
- Notificaciones
- WhatsApp integration

### Onboarding
- Wizard de onboarding para nuevos tenants
- Tutorial interactivo
- Trial de 14 días (TrialBanner)

---

## 8. Scripts CLI

```bash
npm run dev                    # Next.js dev server
npm run build                  # Build producción
npm run start                  # Start producción
npm run lint                   # ESLint
npm run tunnel                 # ngrok tunnel para webhooks
npm run reminders              # Enviar recordatorios
npm run link:whatsapp          # Link WhatsApp
npm run switch:whatsapp        # Switch WhatsApp provider
npm run seed:gastro            # Setup completo tenant gastro (tenant + professionals + services)
```

---

## 9. Variables de Entorno (.env)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## 10. Convenciones de Código

- **Server Actions**: Para formularios de auth (login/actions.ts, register/actions.ts)
- **API Routes**: Para CRUD y operaciones del dashboard
- **Componentes**: PascalCase, archivos `.tsx`
- **Types**: Interfaces exportadas desde `src/types/index.ts`
- **Validación**: Zod schemas en `src/validation/schemas.ts`
- **i18n**: `useLandingTranslation()` hook con `t()` function
- **Estilos**: Tailwind con clases utilitarias, sin CSS modules
- **Animaciones**: Framer Motion con `motion.div`, `AnimatePresence`

---

## 11. Patrones de Auth

### Login
- Server action `signIn(formData)` con Supabase Auth
- OAuth: GoogleAuthButton, MicrosoftAuthButton
- Loading state: overlay fullscreen con spinner animado
- Manejo de errores via searchParams

### Registro
- Server action `registerAction(formData)`
- Crea tenant + tenant_user + professional
- Envía email de confirmación
- Success page con link a login

### Middleware Auth
- `createServerClient` con cookies
- `supabase.auth.getUser()` para verificar sesión
- Rate limiting: 100 requests/minuto por IP
- Security headers: X-Frame-Options, HSTS, etc.

---

## 12. Componentes Clave

### Modals/Drawers
- `AddProfessionalModal` - Modal para crear profesional
- `ProfessionalDetailDrawer` - Drawer lateral con detalle
- `NewPatientDrawer` - Drawer para crear paciente
- `PatientMedicalRecordDrawer` - Historia clínica
- `AppointmentDetailDrawer` - Detalle de turno
- `QuickAppointmentDrawer` - Crear turno rápido

### Dashboard
- `Sidebar` - Navegación lateral
- `HeaderActions` - Acciones del header
- `StatCard` - Cards de métricas
- `DashboardCharts` - Gráficos (Recharts)
- `OnboardingWizard` - Wizard de onboarding
- `TrialBanner` - Banner de trial
- `WaitlistView` - Vista de lista de espera

### Landing
- `LandingHero` - Hero section
- `LandingFeatures` - Features grid
- `LandingCustomization` - Customización visual
- `RealisticDashboard` - Preview del dashboard
- `WhatsAppChatPreview` - Preview de chat WhatsApp

---

## 13. Notas Importantes

- **No usar emojis** en código ni UI a menos que se pida explícitamente
- **i18n**: Soporte para español, inglés, italiano
- **RLS**: Row Level Security en Supabase para aislamiento multi-tenant
- **Force password change**: Profesionales nuevos deben cambiar contraseña al primer login
- **Trial**: 14 días de trial, manejado con TrialBanner
- **Cron jobs**: Reminders y waitlist followup via `/api/cron/*`
- **Webhooks**: Stripe, WhatsApp, Telegram para eventos en tiempo real
