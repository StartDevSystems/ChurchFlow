# 10. Historial de Versiones (Changelog)

Este documento registra los cambios, mejoras y correcciones importantes aplicados al sistema ChurchFlow, manteniendo un historial claro de su evolución.

---

## 🚀 [v1.3.3] - UI/UX Pro Update & Layout Refactor
**Fecha:** 24 de febrero de 2026

### ✨ Mejoras Visuales y UX
- **Login Responsivo (Mobile First):** Rediseño completo de la pantalla de acceso (`app/login/page.tsx`). El personaje animado ahora se adapta perfectamente a dispositivos móviles (apilado verticalmente) y mantiene su diseño lado a lado en pantallas grandes.
- **Corrección "Ghost Sidebar":** Se eliminó el "parpadeo" de la barra lateral al cerrar sesión.
- **Barra de Acciones en Miembros:** Rediseño "Premium" de la sección de botones en el directorio de miembros, agrupando las herramientas de datos en cápsulas visuales.

### 🛠️ Refactorización de Núcleo
- **Estructura Inteligente:** Se unificó la lógica de autenticación y el layout principal en un solo componente `AppStructure` dentro de `app/layout.tsx`. Esto centraliza el manejo de rutas públicas y privadas.

### 📊 Gestión de Datos
- **Importación Masiva de Miembros:** Recuperación y mejora del sistema de importación desde Excel/CSV.
- **Descarga de Plantilla:** Se agregó un botón dedicado para obtener la plantilla oficial de Excel para carga de miembros.

### 🗑️ Control Administrativo
- **Borrado de Eventos (Poder Admin):** Implementación de borrado en cascada para eventos. Al eliminar un evento, el sistema limpia automáticamente sus transacciones, asistencias y transferencias asociadas.
- **Borrado de Transacciones:** Se agregó el botón de eliminar individualmente para cada transacción y transferencia en la tabla principal, con ventana de confirmación de seguridad.

### 🏎️ Rendimiento (Performance)
- **Optimización de Scroll:** Se configuró un delay de 250ms en el sensor táctil del Dashboard para permitir un scroll fluido en móviles sin interferir con el sistema de Drag-and-Drop.
- **Memoización de Cálculos:** Uso de `useMemo` para optimizar los cálculos financieros del Dashboard, reduciendo la carga del procesador y eliminando el lag.

---

## 🛡️ [v1.4.0] - The Government Grade Update: Fortress & Integrity
**Fecha:** 02 de marzo de 2026

### 🔐 Blindaje de Servidor (Enterprise Security)
- **Middleware de Control de Tráfico:** Implementación de una capa de seguridad global que detecta y bloquea bots automáticamente (Scrapy, Selenium, etc.) con respuesta **403 Forbidden**.
- **Seguridad en API (REST Standard):** Rediseño del manejo de sesiones en las rutas de API. Ahora el sistema devuelve errores JSON profesionales (**401 Unauthorized**) en lugar de redirecciones HTML, cumpliendo con los estándares de seguridad para aplicaciones gubernamentales.

### 💎 Integridad de Datos (Atomic Transactions)
- **Cero Corrupción de Datos:** Implementación de `prisma.$transaction` en todos los módulos críticos (Transacciones, Miembros, Eventos, Categorías). Esto asegura que la operación principal y el registro de auditoría ocurran en un solo bloque atómico: o se guardan ambos o no se guarda nada (Rollback).
- **Validación Estricta con Zod:** Introducción de esquemas de validación de datos en tiempo real. El servidor ahora rechaza de forma proactiva cualquier intento de inyección de datos malformados o incompletos (**400 Bad Request**).

### 🛠️ Estabilidad & Despliegue (Hotfix)
- **Resolución de Incidente Vercel:** Se corrigió una incompatibilidad de tipos en `ZodError` detectada durante el proceso de build en producción (migración de `.errors` a `.issues`).
- **Worker de Notificaciones Asíncrono:** Se desacopló el envío de alertas del flujo principal de la base de datos para garantizar respuestas de servidor ultra rápidas y evitar bloqueos por latencia de red.
