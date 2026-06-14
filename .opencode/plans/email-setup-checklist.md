# 📋 PLAN: Email Marca Blanca - Pasos a Seguir

> **Fecha:** 2026-06-03
> **Actualizado:** 2026-06-13
> **Estado:** ✅ COMPLETADO - Dominio verificado

---

## 📊 Resumen del Estado

| Componente | Estado |
|------------|--------|
| Código backend (server actions) | ✅ Listo |
| Código frontend (páginas auth) | ✅ Listo |
| API endpoints (register, verify, reset) | ✅ Listos |
| Servicio de email (Resend) | ✅ Código listo |
| Tablas en BD | ✅ Verificadas |
| Dominio Resend verificado | ✅ Verificado |
| Variable RESEND_FROM_EMAIL | ✅ Configurada |

---

## ✅ LO QUE YO YA HICE (Código Completado)

### 1. Server Actions (Auth)
- `src/app/(auth)/register/actions.ts` - Registro atómico con rollback + links de verificación corregidos
- `src/app/(auth)/login/actions.ts` - Verifica email_confirm antes de login
- `src/app/(auth)/forgot-password/actions.ts` - Envío de email de reset + links de reset corregidos
- `src/app/(auth)/reset-password/actions.ts` - Reset de contraseña

### 2. API Endpoints
- `src/app/api/auth/register/route.ts` - Endpoint de registro
- `src/app/api/auth/verify-email/[token]/route.ts` - Verificación de email
- `src/app/api/auth/request-reset/route.ts` - Solicitud de reset
- `src/app/api/auth/reset-password/[token]/route.ts` - Reset de contraseña

### 3. Páginas Auth (Brand Identity)
- `src/app/(auth)/register/page.tsx` - Registro con diseño SchedAssist
- `src/app/(auth)/login/page.tsx` - Login con mensajes de verificación
- `src/app/(auth)/forgot-password/page.tsx` - Olvidé contraseña
- `src/app/(auth)/reset-password/page.tsx` - Restablecer contraseña

### 4. Servicio de Email
- `src/services/email.service.ts` - Templates con branding del tenant

### 5. Seguridad
- Rollback automático si falla el registro
- Limpieza de usuarios huérfanos
- Cron job de cleanup nocturno

### 6. Archivos de Plan
- `.opencode/plans/auth-email-whitelabel-plan.md` - Plan completado
- `.opencode/plans/schedassist-master-plan.md` - Actualizado

### 7. Fixes realizados hoy (03/06/2026)
- Corrección de links en emails de verificación y reset (faltaba `/api/auth/` en la URL)
- Deploy de los fixes a las ramas develop y main

---

## 👤 LO QUE VOS TENÉS QUE HACER (Configuración Manual)

### Paso 1: Verificar Tablas en Supabase
✅ **YA HECHO** - Las tablas `email_verification_tokens` y `password_reset_tokens` ya existen en tu base de datos.

### Paso 2: Configurar Dominio en Resend
✅ **COMPLETADO** - Dominio `schedassist.com` verificado en Resend

### Paso 3: Agregar Variable de Entorno en Vercel
✅ **YA HECHO** - Ambas variables están configuradas:
- `RESEND_API_KEY` = tu API key de Resend
- `RESEND_FROM_EMAIL` = `SchedAssist <hernanenriquecaballero@gmail.com>` (usando tu email personal como fallback mientras se verifica el dominio)

### Paso 4: Hacer Deploy
✅ **YA HECHO** - Los cambios están deployed en:
- Rama **develop** (último deploy: 7bf8b2a)
- Rama **main** (último deploy: 0764429)

### Paso 5: Probar el Flujo Completo
1. Esperar a que el dominio `schedassist.com` esté **verificado** en Resend (verde y dice "Verified")
2. Ir a `https://www.schedassist.com/register`
3. Crear una cuenta nueva con tu email real (preferiblemente Gmail para mejor deliverability)
4. Verificar que redirija a pantalla de "verifica tu email"
5. Revisar tu bandeja de entrada (y spam) por el email de verificación
6. Hacer clic en el link de verificación
7. Verificar que te redirija al login
8. Hacer login con las credenciales creadas
9. Verificar que entre al dashboard

### Paso 6: Probar Reset de Contraseña
1. Ir a `https://www.schedassist.com/login`
2. Clic en "Olvidé mi contraseña"
3. Ingresar tu email (el mismo con el que te registraste)
4. Revisar la bandeja para el email de reset (revisá spam si no llega)
5. Hacer clic en el link
6. Ingresar nueva contraseña
7. Verificar que te redirija al login
8. Hacer login con la nueva contraseña

---

## 🔧 SI ALGO FALLA

### Error "User already registered"
- Ir a Supabase Dashboard → Authentication → Users
- Buscar el email y eliminar el usuario
- Volver a intentar el registro

### Error "Could not find table"
- Verificar que las tablas existen (Paso 1)
- Si no existen, crearlas con el SQL del Paso 1

### No llega el email de verificación
1. Verificar que `RESEND_FROM_EMAIL` está configurada en Vercel
2. Verificar que el dominio está verificado en Resend
3. Revisar la carpeta de spam
4. Revisar los logs de Vercel → Functions → api/auth/register
5. Si el dominio no está verificado, usar un email personal como fallback

### Error en el build de Vercel
- Verificar que no hay errores de TypeScript
- Revisar los logs del build en Vercel Dashboard → Deployments

---

## 📝 NOTAS IMPORTANTES

1. **Los emails de prueba**: Si usás un email de prueba en Resend (sin dominio verificado), solo podés enviar al email con el que te registraste

2. **Dominio verificado**: Hasta que verifiques el dominio en Resend, los emails pueden fallar o ir a spam

3. **Variables de entorno**: Asegurate que todas estén configuradas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (NUEVA)

4. **Cron jobs**: El cleanup de usuarios huérfanos se ejecuta automáticamente a las 3am

5. **Rollback**: Si el registro falla después de crear el usuario, se hace rollback automático

---

## 🎯 CHECKLIST FINAL

### Para vos:
- [x] Dominio `schedassist.com` verificado en Resend
- [ ] Probar registro completo con email de Gmail
- [ ] Probar reset de contraseña
- [ ] Verificar que llegan los emails de verificación y reset

### Para mí (ya hecho):
- [x] Server actions con rollback y links corregidos
- [x] Páginas auth con brand identity
- [x] API endpoints
- [x] Servicio de email con templates
- [x] Cron job de cleanup
- [x] Plan de implementación
- [x] Verificación de tablas en Supabase
- [x] Configuración de RESEND_API_KEY y RESEND_FROM_EMAIL en Vercel
- [x] Deploy a ramas develop y main
- [x] Corrección de links de verificación y reset (faltaba /api/auth/)

---

**Última actualización:** 2026-06-13
**Próximo paso:** Probar registro y reset de contraseña con dominio verificado
