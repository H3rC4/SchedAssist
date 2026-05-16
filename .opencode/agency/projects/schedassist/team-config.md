# SchedAssist - Configuración de Equipo

> Configuración específica del proyecto **SchedAssist** para OpenCode Agency.  
> Sobreescribe o extiene los valores por defecto de la agencia.

---

## 🏥 Sobre el Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | SchedAssist |
| **Tipo** | SaaS de gestión de turnos clínicos |
| **Stack** | Next.js 14.2.3, React 18, TypeScript 5.4, Tailwind 3.4, Supabase, PostgreSQL, Stripe |
| **Multi-tenant** | Sí (RLS por tenant) |
| **Auth** | Supabase Auth (email + OAuth Google/Microsoft) |
| **Pagos** | Stripe (subscriptions) |
| **Mensajería** | WhatsApp (WHAPI.cloud + Cloud API), Telegram (webhooks) |
| **i18n** | es, en, it (custom LanguageContext) |
| **Deploy** | Vercel |
| **Monitoreo** | Básico (pendiente) |

---

## ⚙️ Overrides de Departamentos

### Arquitectura de Software
- **Prioridad:** Multi-tenant shared-schema con RLS.
- **Restricción:** Monolito Next.js (no microservicios por ahora).
- **Escalabilidad:** Vertical primero, horizontal cuando > 1000 tenants.

### SEO
- **Rutas públicas activas:** `/`, `/book/[slug]`
- **Rutas NO indexables:** `/dashboard/*`, `/doctor/*`, `/superadmin/*`
- **Prioridad:** SEO local (clínicas por ciudad/barrio).
- **Idiomas:** es (principal), en, it.

### Diseño + Imágenes
- **Design system:** `schedassist-brand` es OBLIGATORIO.
- **Colores sagrados:** Primary `#005c55`, Surface `#f7f9fb`.
- **No emojis** en UI (regla del proyecto).
- **Assets:** Landing page necesita imágenes médicas/clínicas profesionales.

### Backend
- **APIs:** Server Actions para auth, API Routes para CRUD.
- **Auth:** Supabase SSR con cookies.
- **RLS:** OBLIGATORIO en todas las tablas tenant-scoped.
- **Validación:** Zod en todos los inputs.

### Base de Datos
- **Engine:** PostgreSQL (Supabase).
- **Tablas clave:** tenants, tenant_users, professionals, clients, appointments, services, locations, clinical_records, waitlists.
- **Índices críticos:** tenant_id en TODO. professional_id + date en appointments.

### Integraciones APIs
- **Obligatorias:** Stripe, WhatsApp (WHAPI.cloud).
- **Opcionales:** Google Calendar (pendiente), Telegram (ya implementado parcialmente).
- **Skill Discovery:** Si se agrega email transaccional, marcar como NEEDED.

### Animaciones 3D + Motion
- **Uso actual:** Framer Motion para micro-interacciones.
- **Landing page:** Animaciones sutiles (no intrusivas).
- **Dashboard:** Sin animaciones 3D (performance primero).
- **Futuro:** Spline 3D para hero section de landing.

### Calidad
- **Cobertura mínima:** 70% (realista para proyecto existente).
- **Lint:** ESLint + Prettier (existente).
- **i18n compliance:** TODA nueva UI debe tener es/en/it.

---

## 🚀 Flujos Específicos de SchedAssist

### Flujo: Nuevo Tenant (Onboarding)
1. **PLAN:** Arquitectura + DB + Brand + Frontend
2. **BUILD:** DB (schema) → Backend (APIs) → Frontend (wizard) → Integrations (Stripe checkout) → i18n → QA
3. **Notas:** Onboarding wizard ya existe. Extender, no reescribir.

### Flujo: Agendar Turno (Booking)
1. **PLAN:** Frontend + Backend + Integrations (WhatsApp)
2. **BUILD:** DB (appointments) → Backend (slots API) → Frontend (calendar) → Integrations (WhatsApp confirm) → i18n → QA
3. **SEO:** `/book/[slug]` debe ser SEO-friendly.

### Flujo: Recordatorios Automáticos
1. **PLAN:** Backend + Integrations
2. **BUILD:** DB (logs) → Backend (cron job) → Integrations (WhatsApp API)
3. **Notas:** Skill de WhatsApp obligatoria. Si se agrega email, NEEDED.

---

## ❌ Restricciones del Proyecto

- **NO cambiar arquitectura a microservicios** sin aprobación explícita del usuario.
- **NO agregar dependencias pesadas** sin justificar bundle size.
- **NO modificar schema existente** con datos sin backup/migración reversible.
- **NO cambiar colores del brand** sin aprobación.
- **NO deploy a producción** sin QA aprobado.

---

## 📋 Checklist de Inicio de Tarea (CEO)

Antes de activar cualquier modo en SchedAssist:

- [ ] ¿Es ruta pública? → Incluir SEO Director en PLAN.
- [ ] ¿Nueva integración? → Verificar Skill Discovery.
- [ ] ¿Cambio de schema? → Backup + migración reversible.
- [ ] ¿Nueva dependencia npm? → Verificar bundle size.
- [ ] ¿Cambio visual? → Incluir Brand Designer.
- [ ] ¿Texto nuevo? → Incluir i18n Agent.

---

## 📁 Archivos de Referencia Importantes

| Archivo | Rol |
|---------|-----|
| `AGENTS.md` | Contexto completo del proyecto |
| `src/types/index.ts` | Tipos TypeScript |
| `src/validation/schemas.ts` | Schemas Zod |
| `src/lib/supabase/` | Clientes Supabase |
| `src/components/LanguageContext.tsx` | i18n context |
| `tailwind.config.ts` | Config Tailwind con tokens de color |

---

## 🔗 Skills Prioritarias para SchedAssist

### Must-have (siempre disponibles)
- `dev-director`, `dev-scout`, `dev-frontend`, `dev-backend`
- `dev-database`, `postgresql-optimization`
- `nextjs-supabase-auth`, `saas-multi-tenant`
- `zod-validation-expert`, `i18n-agent`
- `stripe-integration`, `whapi`, `whatsapp-automation`
- `schedassist-brand`, `dev-ui-ux-designer`
- `react-best-practices`, `nextjs-app-router-patterns`

### Nice-to-have (activar según necesidad)
- `google-calendar-automation`
- `chatbot-appointment`
- `threejs-animation`, `animejs-animation`
- `seo-technical`, `seo-content`, `seo-schema`
- `postgresql-optimization`
- `magic-animator`, `dev-animation`

### NEEDED (marcar si se detectan)
- Email transaccional (SendGrid/AWS SES)
- Analytics avanzado (Segment/Mixpanel)
- Error tracking (Sentry)

---

*Última actualización: 2026-05-13*
