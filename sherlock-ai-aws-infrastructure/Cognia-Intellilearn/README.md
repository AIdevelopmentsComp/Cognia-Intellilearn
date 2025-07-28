# 🚀 CognIA IntelliLearn

**Plataforma EdTech inteligente con IA y Ciudad 3D interactiva**

## ✨ Características principales

- 🎨 **Diseño neumórfico** completo con soporte dark/light mode
- 🏙️ **Ciudad 3D interactiva** con colores CognIA en landing page
- 🔐 **AWS Cognito** para autenticación segura
- 🤖 **Google Gemini AI** integrado para asistente educativo
- 📚 **Sistema de cursos dinámico** con contenido generativo
- 📊 **Dashboard completo** con analytics en tiempo real
- 📱 **Responsive design** optimizado para todos los dispositivos
- ⚡ **Despliegue automático** con GitHub Actions

## 🎯 Stack tecnológico

### Frontend
- **Next.js 15.2.2** + React 19 + TypeScript
- **TailwindCSS v4** + Framer Motion 12
- **Three.js** para ciudad 3D interactiva
- **React Hook Form** + Zod validation

### Backend & Cloud
- **AWS Cognito** (Autenticación)
- **AWS S3** (Almacenamiento)
- **AWS CloudFront** (CDN)
- **Google Gemini 1.5 Flash** (IA)
- **Firebase AI** (Servicios adicionales)

### DevOps
- **GitHub Actions** (CI/CD)
- **AWS S3** + **CloudFront** (Hosting)
- **Despliegue automático** en cada push

## 🌐 URLs del proyecto

- **🌍 Aplicación**: https://d2sn3lk5751y3y.cloudfront.net/
- **📦 Repositorio**: https://github.com/AIdevelopmentsComp/Cognia-Intellilearn
- **☁️ S3 Bucket**: `intellilearn-final`
- **🚀 CloudFront**: `E1UF9C891JJD1F`

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│   AWS S3 +      │
│                 │    │                  │    │   CloudFront    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AWS Cognito   │◀───│   Next.js App    │───▶│  Google Gemini  │
│ (Autenticación) │    │  (Frontend +     │    │      AI         │
│                 │    │   Three.js)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Despliegue automático

El proyecto utiliza GitHub Actions para despliegue automático:

1. **Push a `master`** → Activa workflow
2. **Build con Next.js** → Genera archivos estáticos
3. **Deploy a S3** → Sube archivos al bucket
4. **Invalidate CloudFront** → Actualiza CDN
5. **✅ Listo!** → Aplicación actualizada

## 🎨 Características de diseño

### Ciudad 3D interactiva
- Colores CognIA (azul #3C31A3)
- Animación de partículas
- Interacción con mouse
- Edificios generados proceduralmente

### Diseño neumórfico
- Sombras suaves y profundidad
- Modo claro y oscuro
- Botones y componentes consistentes
- Sidebar colapsible

## 🤖 Integración con IA

- **Gemini 1.5 Flash** para asistente conversacional
- **Generación de contenido** educativo dinámico
- **Análisis de progreso** personalizado
- **Recomendaciones inteligentes**

## 📊 Dashboard y Analytics

- Visualización de progreso de cursos
- Estadísticas de aprendizaje
- Gráficos interactivos con Recharts
- Datos en tiempo real

---

**🏢 Desarrollado por AIdevelopmentsComp**  
**🌟 Parte del ecosistema Sherlock AI**
