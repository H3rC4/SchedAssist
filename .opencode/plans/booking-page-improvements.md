# Plan: Mejorar Booking Page (White-Label)

> **Fecha:** 2026-05-27
> **Estado:** Fase 1 completada, pendientes Fases 2-4

---

## ✅ Fase 1: Componentización (COMPLETADA)

### Componentes creados en `src/components/booking/`:

| Componente | Archivo | Función |
|------------|---------|---------|
| BookingHeader | `BookingHeader.tsx` | Header con logo/nombre del tenant |
| ProgressBar | `ProgressBar.tsx` | Barra de progreso de 5 pasos |
| LocationSelector | `LocationSelector.tsx` | Selección de sede |
| ServiceSelector | `ServiceSelector.tsx` | Selección de servicio |
| ProfessionalSelector | `ProfessionalSelector.tsx` | Selección de profesional |
| DateTimePicker | `DateTimePicker.tsx` | Fecha y hora (9 días + slots) |
| ClientInfoForm | `ClientInfoForm.tsx` | Formulario datos del paciente |
| BookingSummary | `BookingSummary.tsx` | Resumen inferior |
| BookingSuccess | `BookingSuccess.tsx` | Pantalla de éxito |
| BookingBots | `BookingBots.tsx` | Botones flotantes WhatsApp/Telegram |
| BookingWelcome | `BookingWelcome.tsx` | Mensaje de bienvenida del tenant |

### Pendiente: Refactorizar `src/app/book/[slug]/page.tsx` para usar los componentes

---

## 🔲 Fase 2: White-Label Real (PENDIENTE)

### 2.1 Favicon dinámico del tenant
- **Archivo:** `src/app/book/[slug]/layout.tsx`
- **Cambio:** Inyectar `<link rel="icon" href={tenant.settings?.favicon_url || '/favicon.ico'} />`
- **Fallback:** Si no hay favicon, generar uno con la inicial del tenant

### 2.2 Meta tags mejorados
- **Archivo:** `src/app/book/[slug]/layout.tsx`
- **Cambios:**
  - `<title>`: `Reservá en {tenant.name}` (sin "SchedAssist")
  - `<meta name="description">`: descripción del tenant
  - OpenGraph completo (title, description, image, url)
  - Twitter Card tags

### 2.3 Custom domain ready
- **Archivo:** `src/middleware.ts`
- **Cambio:** Detectar si viene de custom domain y mapear al tenant correcto
- **DB:** Agregar campo `custom_domain` a `tenants`

---

## 🔲 Fase 3: UX Improvements (PENDIENTE)

### 3.1 Calendario real
- **Archivo:** `src/components/booking/DateTimePicker.tsx`
- **Cambio:** Reemplazar grid de 9 días por mini calendario con navegación mes a mes
- **Referencia:** Usar diseño similar al del dashboard

### 3.2 Resumen sticky lateral (desktop)
- **Archivo:** `src/app/book/[slug]/page.tsx` (layout)
- **Cambio:** En desktop (>768px), mostrar resumen fijo a la derecha con:
  - Servicio seleccionado
  - Profesional
  - Fecha/hora
  - Precio
  - Progress bar

### 3.3 Avatar de profesional con iniciales
- **Archivo:** `src/components/booking/ProfessionalSelector.tsx`
- **Cambio:** Mostrar avatar circular con iniciales del profesional (color aleatorio basado en nombre)
- **No foto:** Solo iniciales + color de fondo

### 3.4 Loading states con skeleton
- **Archivos:** Todos los componentes
- **Cambio:** Reemplazar spinner básico por skeleton cards que simulan el contenido

### 3.5 Error handling mejorado
- **Archivo:** `src/app/book/[slug]/page.tsx`
- **Cambio:** Mensajes de error claros para:
  - Tenant no encontrado
  - Sin servicios activos
  - Sin profesionales activos
  - Error de conexión

---

## 🔲 Fase 4: Features Extra (PENDIENTE)

### 4.1 "Reservar de nuevo" con datos pre-llenados
- **Archivo:** `src/components/booking/ClientInfoForm.tsx`
- **Cambio:** Guardar datos del paciente en localStorage y pre-llenar al volver

### 4.2 WhatsApp float button con mensaje pre-armado
- **Archivo:** `src/components/booking/BookingBots.tsx`
- **Cambio:** Agregar botón de WhatsApp que abre chat con mensaje: "Hola, quiero reservar un turno en {tenant.name}"

### 4.3 Confirmación por email con link de cancelación
- **Archivo:** `src/app/api/appointments/public/route.ts`
- **Cambio:** Enviar email de confirmación con:
  - Detalles de la cita
  - Link para cancelar (token único)
  - Link para reagendar

---

## 📋 Próximo paso (mañana)

1. Refactorizar `page.tsx` para usar los componentes de Fase 1
2. Implementar Fase 2 (white-label real)
3. Continuar con Fase 3 y 4
