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

## 🚀 [v1.3.4] - The Integrity Update — Master Sync & Audit Pro
**Fecha:** 26 de febrero de 2026

### 📊 Libro Maestro & Sincronización Inteligente
- **Sincronización Bidireccional:** Implementación de IDs únicos (Cédulas de Sistema) en el Libro Maestro para evitar duplicados en cargas recurrentes.
- **Asistente de Importación Pro:** Nuevo flujo de validación que detecta fechas mal formadas y resume los cambios antes de tocar la base de datos.
- **Normalización de Fechas:** Traductor inteligente que entiende múltiples formatos (DD-MM-YY, DD/MM/YYYY, etc) usando la lógica de "Rango de 24h" para evitar duplicados por zona horaria.

### 🛡️ Centro de Auditoría & Máquina del Tiempo
- **Panel de Reversión:** Nueva sección en **Ajustes > Seguridad** para visualizar el historial detallado de sincronizaciones.
- **Botón de Pánico:** Capacidad de deshacer cargas completas de Excel con un solo clic, realizando una limpieza quirúrgica de los registros inyectados en ese lote específico.
- **Rastreo de Operaciones:** Auditoría detallada de quién, qué y cuándo se inyectaron datos al sistema a través de lotes (Batches).

### 🔐 Seguridad Administrativa & Gestión de Equipo
- **Admin Reset Force:** El Administrador Supremo ahora puede forzar el cambio de contraseña de cualquier usuario del equipo desde el panel de Ajustes.
- **Visibilidad Inteligente:** Implementación de toggle de "ojo" (`Eye/EyeOff`) en campos de contraseña para garantizar precisión en los resets.
- **Control de Acceso (Registro Público):** Rediseño del interruptor maestro con indicadores visuales de estado (Puerta Abierta/Cerrada) y tamaño optimizado para control táctil.

### 🖋️ Reportes de Élite & Identidad
- **Firma Híbrida Digital:** Soporte para subir firmas reales en formato imagen (PNG transparente) directamente en los Ajustes de Reportes.
- **Signature Style Fallback:** Uso automático de tipografía elegante ("Great Vibes") para firmas manuales cuando no se dispone de una imagen cargada.
- **Identidad Dinámica en PDF:** Firma responsable y pie de página 100% configurables desde el sistema, eliminando textos genéricos.

### 🎨 UI/UX & Notificaciones
- **Floating Island Notifications:** Rediseño global de las notificaciones Toast a un estilo "Isla Flotante", con más espacio, mejores márgenes responsivos y mayor seguridad al separar el botón de cerrar de las acciones.
- **Nivelación de Interfaz:** Ajustes de precisión en el Dashboard para garantizar la alineación milimétrica de los botones de exportación y registro.
- **Optimización de Fuentes:** Migración a `next/font/google` para mejorar el rendimiento de carga y cumplir con estándares de producción de Vercel.
