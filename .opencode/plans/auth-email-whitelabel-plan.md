# Plan: Implementar Sistema de Email Marca Blanca para Autenticación

> **Fecha:** 2026-05-30
> **Estado:** Plan de implementación para reemplazar emails de auth de Supabase por emails personalizados vía Resend

---

## 🎯 Objetivo

Reemplazar todos los emails de autenticación enviados por Supabase Auth (registro, verificación de email, recuperación de contraseña) por emails personalizados enviados mediante nuestro servicio Resend, haciendo que **todo el sistema de comunicación sea 100% marca blanca** con el branding y colores específicos de cada tenant.

---

## 📋 Estado Actual

✅ **Ya Implementado:**
- Servicio de Email (`src/services/email.service.ts`) con integración de Resend
- Emails de confirmación de booking con link de cancelación (funcionando)
- Placeholder `RESEND_API_KEY` en `.env`

❌ **Pendiente de Implementar:**
- Endpoints personalizados para flujo de auth
- Actualización de páginas de auth para usar nuestros endpoints
- Templates de email específicos para eventos de auth
- Flujo completo de registro, verificación y recuperación de contraseña

---

## 🛠️ Pasos de Implementación

### Fase 1: Configuración Inicial (Requerido por el usuario)
1. **Obtener clave real de Resend**
   - Registrarse en [resend.com](https://resend.com)
   - Crear API key en la sección de API Keys
2. **Actualizar variable de entorno**
   - Reemplazar `RESEND_API_KEY=re_placeholder_key_here_replace_with_real_key` en `.env` con la clave real
   - Opcional pero recomendado: verificar un dominio de envío en Resend (ej: `mail.schedassist.com`)

### Fase 2: Creación de Endpoints de Auth Personalizados
Crearemos los siguientes endpoints en `src/app/api/auth/`:

#### 2.1 Registro de Usuario con Verificación de Email
**Archivo:** `src/app/api/auth/register/route.ts`
```typescript
// POST /api/auth/register
// - Crea usuario en Supabase Auth (con email_confirm=false)
// - Genera token de verificación y lo guarda en BD
// - Envía email de verificación vía Resend
// - NO redirige automáticamente (el frontend maneja la respuesta)
```

#### 2.2 Verificación de Email
**Archivo:** `src/app/api/auth/verify-email/[token]/route.ts`
```typescript
// GET /api/auth/verify-email/[token]
// - Valida token de verificación
// - Marca email como confirmado en Supabase Auth
// - Redirige a página de éxito o muestra error
```

#### 2.3 Solicitud de Recuperación de Contraseña
**Archivo:** `src/app/api/auth/request-reset/route.ts`
```typescript
// POST /api/auth/request-reset
// - Recibe email del usuario
// - Genera token de reseteo y lo guarda en BD (tabla password_reset_tokens)
// - Envía email de reseteo vía Resend
```

#### 2.4 Restablecimiento de Contraseña
**Archivo:** `src/app/api/auth/reset-password/[token]/route.ts`
```typescript
// POST /api/auth/reset-password/[token]
// - Valida token de reseteo
// - Actualiza contraseña en Supabase Auth
// - Invalida el token usado
// - Redirige a login con mensaje de éxito
```

### Fase 3: Creación de Templates de Email
Extendemos `src/services/email.service.ts` con métodos específicos para auth:

#### 3.1 Email de Verificación de Registro
```typescript
static async sendVerificationEmail(
  to: string,
  tenantName: string,
  verificationLink: string,
  tenantSettings: any
): Promise<{ success: boolean; data?: any; error?: string }>
```

#### 3.2 Email de Recuperación de Contraseña
```typescript
static async sendPasswordResetEmail(
  to: string,
  tenantName: string,
  resetLink: string,
  tenantSettings: any
): Promise<{ success: boolean; data?: any; error?: string }>
```

#### 3.2 Plantillas HTML Profesionales
- Usar colores y branding del tenant (igual que en booking confirmation)
- Instrucciones claras y amigables
- Enlaces destacados con botones de llamado a la acción
- Versión de texto plano incluida
- Footer con información de contacto del tenant

### Fase 4: Actualización de Páginas de Auth
Modificaremos las páginas existentes para usar nuestros endpoints en lugar de los métodos built-in de Supabase Auth.

#### 4.1 Página de Registro
**Archivo:** `src/app/(auth)/register/page.tsx`
- Reemplazar `supabase.auth.signUp` con llamada a `/api/auth/register`
- Manejar respuesta: mostrar mensaje de éxito y instrucciones para verificar email
- Eliminar redirección automática que dependía del email de Supabase

#### 4.2 Página de Olvidé mi Contraseña
**Archivo:** `src/app/(auth)/forgot-password/page.tsx`
- Reemplazar `supabase.auth.resetPasswordForEmail` con llamada a `/api/auth/request-reset`
- Mostrar mensaje de éxito con instrucciones para revisar email

#### 4.3 Página de Restablecimiento de Contraseña
**Archivo:** `src/app/(auth)/reset-password/page.tsx`
- Extraer token de la URL
- Llamar a `/api/auth/reset-password/[token]` con el token y nueva contraseña
- Manejar respuesta y redirigir a login

#### 4.4 Página de Verificación de Email (Nueva)
**Archivo:** `src/app/(auth)/verify-email/[token]/page.tsx` (opcional)
- Alternativamente, manejar en el mismo endpoint API con redirect
- Mostrar página de éxito/error después de verificar

### Fase 5: Flujo de Trabajo Completo
#### 5.1 Registro de Nuevo Usuario
1. Usuario envía formulario de registro
2. Llamada a `/api/auth/register`
3. Sistema crea usuario en Supabase Auth (con email no verificado)
4. Genera y guarda token de verificación único
5. Envía email de verificación vía Resend
6. Frontend muestra mensaje: "Te hemos enviado un email de verificación..."
7. Usuario hace clic en enlace del email
8. Llamada a `/api/auth/verify-email/[token]`
9. Sistema marca email como verificado en Supabase Auth
10. Redirige a página de login o muestra mensaje de éxito

#### 5.2 Recuperación de Contraseña
1. Usuario envía email en formulario de "Olvidé mi contraseña"
2. Llamada a `/api/auth/request-reset`
3. Sistema busca usuario por email
4. Genera y guarda token de reseteo único
5. Envía email de reseteo vía Resend
6. Frontend muestra mensaje: "Te hemos enviado instrucciones para restablecer tu contraseña..."
7. Usuario hace clic en enlace del email
8. Llamada a `/api/auth/reset-password/[token]` con nueva contraseña
9. Sistema actualiza contraseña en Supabase Auth
10. Invalida el token usado
11. Redirige a login con mensaje: "Tu contraseña ha sido actualizada exitosamente"

### Fase 6: Manejo de Errores y Edge Cases
- Tokens expirados o inválidos
- Intentos múltiples de registro con mismo email
- Usuarios que intentan acceder a enlaces de verificación/reset ya usados
- Problemas de entrega de email (logging y retry básico)
- Sesiones de usuario durante el flujo

### Fase 7: Testing y Verificación
- Probar flujo completo de registro → verificación → login
- Probar flujo completo de solicitud de reset → actualización de contraseña
- Verificar que emails lleguen con branding correcto del tenant
- Probar con diferentes idiomas de tenant (es, en, it)
- Verificar que no queden "huellas" de Supabase en los emails (desde dominio, contenido genérico, etc.)

---

## 📦 Recursos Necesarios

1. **Clave real de Resend** (el usuario indicó que ya la tiene lista para poner en .env)
2. **Tiempo de desarrollo:** Estimado 3-4 horas para implementación completa
3. **Pruebas:** Necesario probar con cuentas de prueba reales

---

## ✅ Estado de Finalización

Al completar este plan, tendremos:
- ✅ Emails de booking confirmación (ya hecho)
- ✅ Emails de registro y verificación de email (marca blanca)
- ✅ Emails de recuperación y restablecimiento de contraseña (marca blanca)
- ✅ 100% de comunicación por email siendo marca blanca con tenant branding
- ✅ Control total sobre contenido, diseño y entregabilidad de emails
- ✅ Preparación para futuras notificaciones por email (recordatorios, newsletters, etc.)

---

## 📝 Próximos Pasos Sugeridos Después de Este Plan

1. Implementar autenticación de dos factores (2FA) con emails personalizados
2. Añadir capacidad de envío de newsletters o announcements a pacientes
3. Implementar sistema de plantillas de email editable desde el dashboard del tenant
4. Añadir tracking de apertura y clicks de emails mediante webhooks de Resend