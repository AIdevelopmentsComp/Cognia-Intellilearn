# 🎓 CognIA IntelliLearn

**Tu Campus Virtual con Inteligencia Artificial**

## 📋 Descripción

CognIA IntelliLearn es una plataforma educativa avanzada que utiliza inteligencia artificial para personalizar el aprendizaje. Ofrece un campus virtual completo con asistente IA, gamificación y análisis de progreso.

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 15.2.2 con App Router
- **Estilos:** TailwindCSS
- **Autenticación:** AWS Cognito
- **IA:** AWS Bedrock
- **Hosting:** AWS S3 + CloudFront

## 🌐 URLs de Producción

- **CloudFront (HTTPS):** https://d2sn3lk5751y3y.cloudfront.net
- **S3 Website (HTTP):** http://intellilearn-final.s3-website-us-east-1.amazonaws.com

## 📁 Estructura del Proyecto

```
app/
├── layout.tsx          # Layout principal con AuthProvider
├── page.tsx           # Landing page
├── globals.css        # Estilos globales
├── auth/
│   └── login/
│       └── page.tsx   # Página de login con Cognito
└── dashboard/
    ├── layout.tsx     # Layout del dashboard con sidebar
    └── page.tsx       # Dashboard principal

components/
├── common/            # Componentes reutilizables
│   ├── header.tsx
│   ├── footer.tsx
│   ├── FloatingAssistant.tsx
│   ├── Sidebar.tsx
│   └── ProtectedRoute.tsx
├── landingPage/       # Componentes de la landing
└── modules/           # Módulos específicos
    ├── auth/
    └── dashboard/
```

## 🛠️ Instalación y Desarrollo

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crear archivo `.env.local` con:
   ```
   NEXT_PUBLIC_AWS_REGION=us-east-1
   NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=tu-pool-id
   NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=tu-client-id
   ```

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

4. **Construir para producción:**
   ```bash
   npm run build
   ```

## 🔐 Autenticación

La aplicación utiliza AWS Cognito para la autenticación de usuarios. El flujo incluye:
- Login con email/password
- Registro de nuevos usuarios
- Recuperación de contraseña
- Sesiones persistentes

## 🎨 Diseño

El diseño se mantiene fiel a los mockups de Figma con:
- Paleta de colores principal: #132944, #3C31A3
- Tipografía: Arial, Helvetica, sans-serif
- Componentes responsivos
- Animaciones suaves

## 📱 Características

- ✅ Landing page informativa
- ✅ Sistema de autenticación completo
- ✅ Dashboard con sidebar navegable
- ✅ Asistente IA flotante
- ✅ Diseño responsivo
- ✅ Módulos de cursos (implementados)
- ✅ Sistema de gamificación (implementado)
- ✅ Analytics de progreso (implementado)
- ✅ Gestión de contenido
- ✅ Tareas y certificados
- ✅ Perfil de usuario

## 🚀 Despliegue

El proyecto está configurado para desplegarse automáticamente en AWS S3 con CloudFront:

```bash
npm run build
aws s3 sync out s3://intellilearn-final/ --delete
```

## 📄 Licencia

© 2025 CognIA. Todos los derechos reservados.

## 🏗️ Estado de Migración

**Status:** COMPLETED ✅

### Tareas Completadas:
- ✅ Migración completa a Next.js 15.2.2 con App Router
- ✅ Todas las páginas del dashboard implementadas
- ✅ Sistema de autenticación AWS Cognito integrado
- ✅ Corrección de isActive con usePathname en Sidebar
- ✅ Resolución de problemas de localStorage para build estático
- ✅ Eliminación de código basura (scripts, backups, archivos obsoletos)
- ✅ Despliegue exitoso en AWS S3 + CloudFront
- ✅ Logos y assets correctamente configurados

### Estructura Final:
- `app/` - Todas las rutas migradas con App Router
- `components/` - Componentes optimizados con 'use client' donde necesario
- `lib/` - Servicios y utilidades actualizadas
- `public/` - Assets estáticos organizados

---

**Desarrollado por:** Equipo CognIA  
**Versión:** 1.0.0  
**Última actualización:** Julio 2025
