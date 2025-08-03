# 🔧 Corrección de Navegación para Next.js Static Export

## 📅 Fecha: 2 de Agosto, 2025

## 🐛 Problema Reportado

"cuando le doy click a my courses me devuelve al dashboard"

## 🔍 Causa Raíz

Next.js con exportación estática genera archivos HTML con extensión `.html`:
- `/dashboard` → `/dashboard.html`
- `/dashboard/courses` → `/dashboard/courses.html`
- `/dashboard/courses/123` → `/dashboard/courses/123.html`

El componente `Link` de Next.js no maneja automáticamente estas extensiones en static export.

## ✅ Solución Implementada

### 1. Creación de Componente StaticLink

Creé un nuevo componente `components/common/StaticLink.tsx` que:
- Intercepta la navegación del Link de Next.js
- Añade automáticamente `.html` a las rutas internas
- Mantiene el comportamiento normal para enlaces externos

```typescript
// Ejemplo de uso
<StaticLink href="/dashboard/courses">
  My Courses
</StaticLink>
// Navega a: /dashboard/courses.html
```

### 2. Actualizaciones Realizadas

#### **Sidebar.tsx**
- Reemplazado `Link` con `StaticLink` para toda la navegación principal
- Afecta a: My Progress, My Courses, My Tasks, Certificates, Profile

#### **Courses.tsx**
- Reemplazado `Link` con `StaticLink` para navegación a cursos individuales
- Afecta a: Enlaces "Continuar aprendiendo" y "Comenzar curso"

## 🚀 Comportamiento Esperado

Ahora cuando hagas clic en:
- **"My Courses"** → Navegará correctamente a `/dashboard/courses.html`
- **Un curso específico** → Navegará a `/dashboard/courses/{id}.html`
- **Cualquier enlace del sidebar** → Navegará a la página correcta con `.html`

## 📝 Notas Técnicas

### Por qué es necesario

Next.js Static Export tiene limitaciones:
1. No hay servidor para manejar rutas dinámicas
2. Los archivos se sirven como HTML estático desde S3/CloudFront
3. Las rutas deben coincidir exactamente con los nombres de archivo

### Alternativas consideradas

1. **Usar `trailingSlash: true` en next.config.js**
   - Pro: Next.js maneja automáticamente las rutas
   - Contra: Cambia todas las URLs a directorios (`/dashboard/` en vez de `/dashboard`)

2. **Configurar redirects en CloudFront**
   - Pro: Transparente para el usuario
   - Contra: Requiere configuración adicional de infraestructura

3. **Cambiar a SSR/SSG con servidor**
   - Pro: Routing nativo de Next.js funciona perfectamente
   - Contra: Requiere servidor (más costo y complejidad)

## 🔄 Estado del Deployment

El deployment está en progreso. Una vez completado:
1. Verificar en CloudFront: https://d2j7zvp3tz528c.cloudfront.net
2. Probar navegación a "My Courses"
3. Verificar que no hay loops de redirección

## 🎯 Próximos Pasos

Si persisten problemas de navegación:
1. Verificar que todos los componentes usen `StaticLink`
2. Revisar la configuración de CloudFront para archivos index
3. Considerar implementar `trailingSlash: true` si es necesario

---

**Actualización**: Los cambios han sido implementados y están siendo desplegados.