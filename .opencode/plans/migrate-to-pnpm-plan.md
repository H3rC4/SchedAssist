# 🔄 PLAN: Migración de npm a pnpm

> **Fecha:** 2026-06-13
> **Objetivo:** Migrar SchedAssist de npm a pnpm para mejorar seguridad y performance
> **Tiempo estimado:** 30-45 minutos
> **Riesgo:** Bajo (cambios reversibles)

---

## 🎯 ¿Por qué migrar a pnpm?

### Seguridad
- ✅ **Verificación criptográfica SHA-512** de cada paquete
- ✅ **Previene ataques de supply chain** (como los hacks de npm)
- ✅ **No duplica paquetes** (estructura de archivos más segura)
- ✅ **Lockfile más estricto** que npm

### Performance
- ✅ **2-3x más rápido** que npm en install
- ✅ **Menos espacio en disco** (packages compartidos)
- ✅ **Mejor caching** entre proyectos

### Compatibilidad
- ✅ **100% compatible** con `package.json` existente
- ✅ **Compatible con Next.js**, Vercel, y todas las herramientas actuales
- ✅ **Lee `package-lock.json`** si existe (para migración gradual)

---

## 📋 CHECKLIST PASO A PASO

### FASE 1: Preparación (5 minutos)

- [ ] **1.1** Hacer backup del proyecto
  ```bash
  # Guardar estado actual por si necesitamos rollback
  git add .
  git commit -m "chore: backup antes de migrar a pnpm"
  git push origin develop
  ```

- [ ] **1.2** Verificar que estás en la rama correcta
  ```bash
  git branch
  # Debe estar en: develop
  ```

- [ ] **1.3** Verificar que no hay cambios sin commitear
  ```bash
  git status
  # Debe decir: "nothing to commit, working tree clean"
  ```

---

### FASE 2: Instalar pnpm Globalmente (3 minutos)

> **⚠️ IMPORTANTE:** Usar el instalador oficial de pnpm, no npm.

- [ ] **2.1** Instalar pnpm (elige tu sistema operativo)

  **Windows (PowerShell):**
  ```powershell
  iwr https://get.pnpm.io/install.ps1 -useb | iex
  ```

  **macOS/Linux (curl):**
  ```bash
  curl -fsSL https://get.pnpm.io/install.sh | sh -
  ```

  **macOS (Homebrew):**
  ```bash
  brew install pnpm
  ```

  **Linux (apt):**
  ```bash
  curl -fsSL https://get.pnpm.io/install.sh | sh -
  ```

- [ ] **2.2** Verificar instalación
  ```bash
  pnpm --version
  # Debe mostrar: 9.x.x o superior
  ```

- [ ] **2.3** Verificar que pnpm está en el PATH
  ```bash
  which pnpm
  # macOS/Linux: /usr/local/bin/pnpm o ~/.local/share/pnpm/pnpm
  # Windows: C:\Users\TuUsuario\AppData\Local\pnpm\pnpm.exe
  ```

---

### FASE 3: Limpiar Instalación de npm (2 minutos)

- [ ] **3.1** Borrar `node_modules` existente
  ```bash
  # Desde la raíz del proyecto
  rm -rf node_modules
  # Windows PowerShell: Remove-Item -Recurse -Force node_modules
  ```

- [ ] **3.2** Borrar `package-lock.json` (lo regeneraremos con pnpm)
  ```bash
  rm package-lock.json
  # Windows: Remove-Item package-lock.json
  ```

  > **Nota:** `pnpm-lock.yaml` reemplazará a `package-lock.json`

- [ ] **3.3** Limpiar cache de npm (opcional pero recomendado)
  ```bash
  npm cache clean --force
  ```

---

### FASE 4: Instalar Dependencias con pnpm (5-10 minutos)

- [ ] **4.1** Instalar todas las dependencias del proyecto
  ```bash
  pnpm install
  ```

  **Qué hace:**
  - Lee `package.json`
  - Verifica cada paquete con SHA-512
  - Crea `pnpm-lock.yaml`
  - Instala en `.pnpm/` (estructura optimizada)
  - Crea symlinks en `node_modules/`

- [ ] **4.2** Verificar que se instaló correctamente
  ```bash
  ls node_modules
  # Debe existir: next, react, supabase, etc.
  ```

- [ ] **4.3** Verificar que el lockfile se creó
  ```bash
  ls -la pnpm-lock.yaml
  # Debe existir el archivo
  ```

- [ ] **4.4** Ejecutar auditoría de seguridad
  ```bash
  pnpm audit
  # Revisa vulnerabilidades conocidas
  ```

---

### FASE 5: Verificar que el Proyecto Funciona (5 minutos)

- [ ] **5.1** Probar el build de producción
  ```bash
  pnpm run build
  # Debe completar sin errores
  ```

- [ ] **5.2** Probar el dev server
  ```bash
  pnpm run dev
  # Debe iniciar en http://localhost:3000
  ```

- [ ] **5.3** Probar linting
  ```bash
  pnpm run lint
  # Debe pasar sin errores
  ```

- [ ] **5.4** Probar un script CLI
  ```bash
  pnpm run reminders
  # o cualquier otro script del package.json
  ```

---

### FASE 6: Actualizar Vercel (5 minutos)

> **⚠️ CRÍTICO:** Si no hacés esto, Vercel seguirá usando npm.

- [ ] **6.1** Ir a Vercel Dashboard
  - https://vercel.com/dashboard
  - Seleccionar proyecto: `schedassist`

- [ ] **6.2** Ir a Settings → General
  - Buscar sección **"Build & Development Settings"**

- [ ] **6.3** Cambiar el install command
  - **Install Command:** Cambiar de `npm install` a `pnpm install`

- [ ] **6.4** (Opcional) Cambiar otros comandos si querés
  - **Build Command:** `pnpm run build` (o dejar el default)
  - **Dev Command:** `pnpm run dev` (o dejar el default)

- [ ] **6.5** Guardar cambios
  - Click en "Save"

---

### FASE 7: Commit y Deploy (5 minutos)

- [ ] **7.1** Verificar qué archivos cambiaron
  ```bash
  git status
  # Debe mostrar:
  # - deleted: package-lock.json
  # - new file: pnpm-lock.yaml
  # - modified: node_modules/ (ignorado por git)
  ```

- [ ] **7.2** Commit de los cambios
  ```bash
  git add .
  git commit -m "chore: migrate from npm to pnpm

  - Replace package-lock.json with pnpm-lock.yaml
  - pnpm provides better security (SHA-512 verification)
  - Faster installs and less disk space
  - Compatible with existing package.json"
  ```

- [ ] **7.3** Push a develop
  ```bash
  git push origin develop
  ```

- [ ] **7.4** Esperar deploy automático en Vercel
  - Vercel detectará el cambio
  - Usará `pnpm install` automáticamente
  - Deploy debería completarse en 2-3 minutos

---

### FASE 8: Verificación Post-Deploy (5 minutos)

- [ ] **8.1** Verificar que el sitio carga
  - Ir a https://www.schedassist.com
  - Debe cargar normalmente

- [ ] **8.2** Verificar que el login funciona
  - Intentar login con una cuenta existente
  - Debe funcionar normalmente

- [ ] **8.3** Verificar que los webhooks funcionan
  - WhatsApp: Enviar un mensaje de prueba
  - Telegram: Enviar un mensaje al bot
  - Deben procesarse normalmente

- [ ] **8.4** Verificar logs de Vercel
  - Dashboard → Deployments → Click en el último deploy
  - Buscar "pnpm install" en los logs
  - Debe completar sin errores

---

## 🆘 ROLLBACK (Si algo sale mal)

Si necesitás volver a npm:

```bash
# 1. Borrar pnpm-lock.yaml y node_modules
rm pnpm-lock.yaml
rm -rf node_modules

# 2. Volver al commit anterior
git log --oneline
# Buscar el commit "chore: backup antes de migrar a pnpm"
git checkout <hash-del-commit-anterior>

# 3. Reinstalar con npm
npm install

# 4. En Vercel, cambiar install command de vuelta a "npm install"
```

---

## 📊 COMPARACIÓN: Antes vs Después

| Aspecto | npm | pnpm |
|---------|-----|------|
| Velocidad de install | Lento | 2-3x más rápido |
| Espacio en disco | 100% | ~50% (packages compartidos) |
| Verificación criptográfica | SHA-1 (débil) | SHA-512 (fuerte) |
| Prevención de supply chain | Baja | Alta |
| Compatibilidad con Next.js | ✅ | ✅ |
| Compatibilidad con Vercel | ✅ | ✅ |
| Comando de install | `npm install` | `pnpm install` |
| Lockfile | `package-lock.json` | `pnpm-lock.yaml` |
| Versión del proyecto | `npm run dev` | `pnpm run dev` |

---

## 🔧 COMANDOS ÚTILES DE pnpm

### Instalación
```bash
pnpm install              # Instalar todas las dependencias
pnpm add <package>        # Agregar nueva dependencia
pnpm add -D <package>     # Agregar devDependency
pnpm add -g <package>     # Instalar globalmente
pnpm remove <package>     # Remover dependencia
```

### Scripts
```bash
pnpm run dev              # Ejecutar script "dev"
pnpm run build            # Ejecutar script "build"
pnpm run <script>         # Ejecutar cualquier script
pnpm <script>             # Atajo para pnpm run <script>
```

### Seguridad
```bash
pnpm audit                # Ver vulnerabilidades
pnpm audit --fix          # Arreglar automáticamente
pnpm outdated             # Ver paquetes desactualizados
pnpm update               # Actualizar paquetes
```

### Limpieza
```bash
pnpm store prune          # Limpiar packages no usados del store
pnpm clean                # Limpiar node_modules y cache
```

---

## 📁 ARCHIVOS QUE CAMBIAN

| Archivo | Acción |
|---------|--------|
| `package-lock.json` | 🗑️ Eliminado |
| `pnpm-lock.yaml` | 🆕 Creado |
| `node_modules/` | 🔄 Regenerado (estructura diferente) |
| `.gitignore` | ℹ️ No cambia (ya ignora node_modules) |
| `package.json` | ℹ️ No cambia |

---

## ⚠️ NOTAS IMPORTANTES

1. **No mezclar npm y pnpm** en el mismo proyecto
   - Una vez que migres, todos deben usar pnpm
   - Si alguien clona el repo, debe usar `pnpm install`, no `npm install`

2. **Vercel detecta pnpm automáticamente**
   - Si tenés `pnpm-lock.yaml`, Vercel sabe que usás pnpm
   - Pero es mejor ser explícito en la configuración

3. **El `package.json` NO cambia**
   - Todos los scripts siguen iguales
   - Todas las dependencias siguen iguales
   - Solo cambia el package manager

4. **CI/CD en GitHub Actions**
   - Si tenés GitHub Actions, cambiar:
   ```yaml
   - uses: pnpm/action-setup@v3
     with:
       version: 9
   - run: pnpm install --frozen-lockfile
   ```

5. **Para nuevos clones del repo:**
   ```bash
   git clone <repo>
   cd schedassist
   pnpm install  # NO usar npm install
   pnpm run dev
   ```

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE MIGRAR

1. **Documentar en README.md** que el proyecto usa pnpm
2. **Agregar a `.github/CODEOWNERS`** que pnpm-lock.yaml requiere review
3. **Considerar agregar `engines` a package.json:**
   ```json
   "engines": {
     "node": ">=18.0.0",
     "pnpm": ">=9.0.0"
   }
   ```
4. **Agregar `preinstall` script** para prevenir uso de npm:
   ```json
   "scripts": {
     "preinstall": "npx only-allow pnpm"
   }
   ```

---

## 📞 SOPORTE

Si tenés problemas durante la migración:

1. **Revisar logs:** `pnpm install --reporter=ndjson`
2. **Limpiar cache:** `pnpm store prune`
3. **Forzar reinstalación:** `rm -rf node_modules pnpm-lock.yaml && pnpm install`
4. **Documentación oficial:** https://pnpm.io/

---

**Última actualización:** 2026-06-13
**Próximo paso:** Ejecutar FASE 1 - Preparación
