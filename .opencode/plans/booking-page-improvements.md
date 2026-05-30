# Plan: Mejorar Booking Page (White-Label)

> **Fecha:** 2026-05-27
> **Última actualización:** 2026-05-30
> **Estado:** Todas las fases completadas

---

## ✅ Fase 1: Componentización + Refactor (COMPLETADA)

### Refactor 2026-05-29:
- page.tsx de 686 → 278 líneas (reestructurado con componentes)
- `useBookingData` hook (lógica de fetching/booking separada)
- `BookingStates` component (loading/not-found states)

---

## ✅ Fase 2: White-Label Real (COMPLETADA 2026-05-29)

### 2.1 Favicon dinámico ✅
### 2.2 Meta tags mejorados ✅
- `<title>`: `Reservá en {tenant.name}`
- OpenGraph completo
- Twitter Cards
- Schema.org JSON-LD mejorado

### 2.3 Custom domain ready ✅
- Configurado para aceptar dominios personalizados vía CNAME y variables de entorno
- Middleware actualizado para resolver tenant por dominio personalizado
- Documentación agregada en docs/custom-domain.md

---

## ✅ Fase 3: UX Improvements (COMPLETADA 2026-05-29)

### 3.1 Calendario real ✅
- Nuevo componente `DateGrid.tsx` con navegación mes a mes
- DateTimePicker actualizado

### 3.2 Resumen sticky lateral (desktop) ✅
- BookingSummary ya es sticky

### 3.3 Avatar de profesional con iniciales ✅
- `ProfessionalAvatar.tsx` con getInitials() y getAvatarColor()
- Color basado en hash del nombre

### 3.4 Loading states with skeleton ✅
- `BookingSkeletons.tsx` con SkeletonCard, SkeletonCalendar, SkeletonSlots, SkeletonForm

### 3.5 Error handling mejorado ✅
- Componentes nuevos: `BookingError` con retry functionality
- Hook mejorado: `useBookingData` ahora tracking de errores diferenciados (network/server/not_found/generic)
- UI de errores: Mensajes específicos, botones de retry, manejo de errores in-line para carga de slots
- Locale fix: Corrección de locales hardcodeados en BookingSuccess y ClientInfoForm
- Estados de loading: Mejor manejo de estados intermedios durante el flujo

---

## ✅ Fase 4: Features Extra (COMPLETADA 2026-05-30)

### 4.1 "Reservar de nuevo" con datos pre-llenados ✅
- Guardar datos del paciente en localStorage y pre-llenar al volver
- Reset limpio: El botón "Nueva Cita" ahora resetea correctamente el estado en lugar de hacer hard reload

### 4.2 WhatsApp float button con mensaje pre-armado ✅
- Enlaces inteligentes:
  - Si existe `whatsapp_bot_url` → usa ese link directo (comportamiento existente)
  - Si no existe bot pero sí `whatsapp_phone` → genera link `wa.me` con mensaje pre-armado
- Mensaje contextual: "Hola, quiero reservar un turno en {tenant.name}"
- Soporte multiidioma: Mensaje disponible en español, inglés e italiano
- Mantiene funcionalidad existente: Los bots de Telegram siguen funcionando como antes

### 4.3 Confirmación por email con link de cancelación ✅
- Integración de Resend: Servicio de email moderno instalado y configurado
- Token de cancelación único: Generado y almacenado con cada appointment público
- Email de confirmación profesional:
  * Template HTML responsivo con colores del tenant
  * Información clara de la cita (fecha, hora, profesional)
  * Enlace destacado para cancelar/reprogramar
  * Versión de texto plano incluida
- Endpoint público de cancelación: `/api/appointments/cancel/[token]` valida token y procesa cancelación
- Integración no bloqueante: El booking no falla si el email falla (solo se loggea el error)

---

## 📋 Estado General

| Fase | Estado |
|------|--------|
| Fase 1: Componentización | ✅ Completa |
| Fase 2: White-Label | ✅ Completa |
| Fase 3: UX Improvements | ✅ Completa |
| Fase 4: Features Extra | ✅ Completa |

---

## ✅ Todas las tareas de la booking page completadas

Todas las mejoras planificadas para la booking page han sido implementadas:
- ✅ Fase 1: Componentización + Refactor
- ✅ Fase 2: White-Label Real (incluyendo custom domain)
- ✅ Fase 3: UX Improvements (incluyendo mejor error handling)
- ✅ Fase 4: Features Extra (pre-llenado, WhatsApp inteligente, email de confirmación)

### 📝 Próximos pasos sugeridos:
1. Configurar la variable de entorno `RESEND_API_KEY` en .env con una clave real
2. Verificar el dominio de envío en Resend para mejor deliverability
3. Monitorear los logs de email en las primeras 24-48 horas después del lanzamiento

---