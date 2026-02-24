# 10. Historial de Versiones (Changelog)

Este documento registra los cambios, mejoras y correcciones importantes aplicados al sistema ChurchFlow, manteniendo un historial claro de su evolución.

---

## 🚀 [v1.3.3] - UI/UX Pro Update & Layout Refactor
**Fecha:** 24 de febrero de 2026

### ✨ Mejoras Visuales y UX
- **Login Responsivo (Mobile First):** Rediseño completo de la pantalla de acceso (`app/login/page.tsx`). El personaje animado ahora se adapta perfectamente a dispositivos móviles (apilado verticalmente) y mantiene su diseño lado a lado en pantallas grandes.
- **Corrección "Ghost Sidebar":** Se eliminó el "parpadeo" de la barra lateral al cerrar sesión.

### 🛠️ Refactorización de Núcleo
- **Estructura Inteligente:** Se unificó la lógica de autenticación y el layout principal en un solo componente `AppStructure` dentro de `app/layout.tsx`. Esto centraliza el manejo de rutas públicas y privadas.

---

## 🍏 [PWA/iOS Fix] - Optimización de Iconos (Rama `fix/ios-icons`)
**Fecha:** 24 de febrero de 2026

### 📱 Mejoras PWA (Progressive Web App)
- **Compatibilidad con Apple (iOS):** Se agregó la etiqueta `<link rel="apple-touch-icon" href="/icon-512.jpeg" />` para asegurar que los dispositivos iPhone muestren correctamente el logo de la iglesia al instalar la aplicación en la pantalla de inicio.
- **Renombrado de Assets:** Se cambió el nombre del archivo de imagen principal de `logo de los jovenes.jpeg` a `icon-512.jpeg` (sin espacios) para evitar problemas de rutas en navegadores estrictos (Safari).
- **Actualización de Referencias:** Se actualizaron `manifest.json`, `schema.prisma`, `Sidebar.tsx`, y la API de configuraciones para apuntar al nuevo asset.

---

## ⚡ [Performance] - Optimización de Scroll y Cálculos (Rama `perf/dashboard-fix`)
**Fecha:** 24 de febrero de 2026

### 🏎️ Mejoras de Rendimiento en Dashboard
- **Scroll Inteligente en Móviles:** Se ajustaron los sensores de la librería `@dnd-kit/core`. El `TouchSensor` ahora requiere un "delay" de 250ms, lo que permite a los usuarios hacer scroll vertical libremente en sus celulares sin arrastrar accidentalmente los componentes (widgets).
- **Memoización de Datos Financieros:** Se implementó `useMemo` en `app/page.tsx` para cachear los cálculos pesados (Balance Total, Ingresos del Mes, Gastos, Tendencias). El sistema ahora solo recalcula la matemática cuando cambian las transacciones, reduciendo drásticamente el lag (Re-renders) al interactuar con la página.
