# Landing Page Redesign - Prompt for Tomorrow

## Goal
Recrear la landing page siguiendo exactamente el modelo `landing-final.html`

## Reference Model
Archivo: `D:/proyectos/SaaS/landing-final.html`

## Estructura Exacta del Modelo

| Sección | Background | Texto |
|---------|------------|-------|
| NAV | bg-white (#ffffff) | #005c55 |
| HERO | gradient #001f1c → #005c55 | white |
| FEATURES | bg-white (#ffffff) | dark (#1e293b) |
| WHATSAPP | #001f1c (very dark) | white |
| TECH STACK | #f1f5f9 (slate-100) | #005c55 |
| CTA | bg-white | #005c55 |
| FOOTER | bg-white | #475569 |

## Color Palette
- Primary: #005c55 (deep green)
- Accent: #0d9488 (teal-400)
- Dark BG: #001f1c
- Light BG: #f8fafc
- Text dark: #1e293b
- Text muted: #64748b

## Pasos para Mañana

1. Cargar skill: `magic-ui-generator`
2. Generar componentes siguiendo la estructura arriba
3. Reemplazar los componentes actuales en `src/components/landing/`
4. Actualizar `src/app/page.tsx` con los nuevos componentes
5. Verificar build con `npm run build`
6. Commit y push

## Notas Adicionales
- Usar imágenes reales de scheduled.com
- Mantener traducciones EN/ES/IT existentes
- Usar Tailwind CSS现有的
- Mantenerla responsive (mobile first)