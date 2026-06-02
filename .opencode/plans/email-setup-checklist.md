# 📋 PLAN: Email Marca Blanca - Pasos a Seguir

> **Fecha:** 2026-06-02
> **Estado:** En progreso - Pendiente configuración manual

---

## 📊 Resumen del Estado

| Componente | Estado |
|------------|--------|
| Código backend (server actions) | ✅ Listo |
| Código frontend (páginas auth) | ✅ Listo |
| API endpoints (register, verify, reset) | ✅ Listos |
| Servicio de email (Resend) | ✅ Código listo |
| Tablas en BD | ⚠️ Necesita verificación |
| Dominio Resend verificado | ❌ Pendiente usuario |
| Variable RESEND_FROM_EMAIL | ❌ Pendiente usuario |

---

## ✅ LO QUE YO YA HICE (Código Completado)

### 1. Server Actions (Auth)
- `src/app/(auth)/register/actions.ts` - Registro atómico con rollback
- `src/app/(auth)/login/actions.ts` - Verifica email_confirm antes de login
- `src/app/(auth)/forgot-password/actions.ts` - Envío de email de reset
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

---

## 👤 LO QUE VOS TENÉS QUE HACER (Configuración Manual)

### Paso 1: Verificar Tablas en Supabase
Ir a **Supabase Dashboard → SQL Editor** y ejecutar:

```sql
-- Verificar si las tablas existen
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'email_verification_tokens'
) as verification_tokens_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'password_reset_tokens'
) as reset_tokens_exists;
```

Si alguna devuelve `false`, crear la tabla faltante:

```sql
-- Para email_verification_tokens (si no existe)
CREATE TABLE email_verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage verification tokens"
  ON email_verification_tokens FOR ALL
  USING (true);

-- Para password_reset_tokens (si no existe)
CREATE TABLE password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage reset tokens"
  ON password_reset_tokens FOR ALL
  USING (true);
```

### Paso 2: Configurar Dominio en Resend
1. Ir a [resend.com/domains](https://resend.com/domains)
2. Clic "Add Domain"
3. Ingresar `schedassist.com`
4. Copiar los registros DNS que te dé Resend
5. Ir a tu proveedor de DNS (donde tengas el dominio)
6. Agregar los registros DNS (SPF, DKIM, etc.)
7. Volver a Resend y clic "Verify"
8. Esperar a que se verifique (puede tardar hasta 48hs)

### Paso 3: Agregar Variable de Entorno en Vercel
Ir a **Vercel Dashboard → Tu proyecto → Settings → Environment Variables**:

Agregar:
```
Key: RESEND_FROM_EMAIL
Value: SchedAssist <tu-email-verificado@schedassist.com>
```

Si todavía no verificaste el dominio, usá el email con el que te registraste en Resend:
```
Key: RESEND_FROM_EMAIL
Value: SchedAssist <hernan@email.com>
```

### Paso 4: Hacer Deploy
```bash
cd /mnt/d/proyectos/SaaS
git checkout develop
git pull origin develop
# Vercel debería hacer deploy automático al hacer push
```

O si es manual:
```bash
git push origin develop
```

### Paso 5: Probar el Flujo Completo
1. Ir a `https://www.schedassist.com/register`
2. Crear una cuenta nueva con tu email real
3. Verificar que redirija a pantalla de "verifica tu email"
4. Revisar tu bandeja de entrada (y spam)
5. Hacer clic en el link de verificación
6. Verificar que te redirija al login
7. Hacer login con las credenciales creadas
8. Verificar que entre al dashboard

### Paso 6: Probar Reset de Contraseña
1. Ir a `https://www.schedassist.com/login`
2. Clic en "Olvidé mi contraseña"
3. Ingresar tu email
4. Revisar la bandeja para el email de reset
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
- [ ] Verificar/crear tablas en Supabase
- [ ] Configurar dominio en Resend (o usar email personal)
- [ ] Agregar `RESEND_FROM_EMAIL` en Vercel
- [ ] Hacer deploy
- [ ] Probar registro completo
- [ ] Probar reset de contraseña
- [ ] Verificar que llegan los emails

### Para mí (ya hecho):
- [x] Server actions con rollback
- [x] Páginas auth con brand identity
- [x] API endpoints
- [x] Servicio de email con templates
- [x] Cron job de cleanup
- [x] Plan de implementación

---

**Última actualización:** 2026-06-02
**Próximo paso:** Vos configurás Resend y Vercel, yo verifico que todo funcione
