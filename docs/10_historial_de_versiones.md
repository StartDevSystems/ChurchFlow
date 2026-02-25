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

## 🍏 [PWA/iOS Fix] - Optimización de Iconos
**Fecha:** 24 de febrero de 2026

### 📱 Mejoras PWA (Progressive Web App)
- **Compatibilidad con Apple (iOS):** Se agregó la etiqueta `<link rel="apple-touch-icon" href="/icon-512.jpeg" />` para asegurar que los dispositivos iPhone muestren correctamente el logo de la iglesia.
- **Renombrado de Assets:** Se cambió el nombre del logo a `icon-512.jpeg` para cumplir con estándares de la industria y evitar errores de ruta en Safari.
