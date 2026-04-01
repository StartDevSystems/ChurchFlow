# 10. Historial de Versiones (Changelog)

Este documento registra los cambios, mejoras y correcciones importantes aplicados al sistema ChurchFlow, manteniendo un historial claro de su evolución.

---

## 📦 [v1.5.1] - Report Intelligence, Financial Corrections & Image Export
**Fecha:** 1 de abril de 2026

### 📊 Reportes — WhatsApp y PDF Mejorados
- **Transferencias visibles en reportes**: Nueva sección "Movimientos internos" en WhatsApp y PDF que muestra transferencias con origen → destino y descripción clara (ej: "Se destinó RD$2,000 de Caja General >> Culto de jóvenes 31 de marzo").
- **Eventos muestran gasto total**: WhatsApp y la vista previa ahora muestran "Gastado RD$5,377" en lugar del profit neto (-RD$2,350) para eventos tipo EVENTO. Ventas (VENTA) siguen mostrando ganancia y % de meta.
- **PDF — Desglose completo por evento**: Cada evento ahora muestra fuentes de ingreso (aportes agrupados por categoría), transferencias recibidas de caja, y lista detallada de cada gasto con su monto.
- **PDF — Columna "Evento"**: La tabla de movimientos ahora distingue entre transacciones de "CAJA" y las de cada evento específico.
- **PDF — Fila de totales**: Al final de la tabla se muestran Ingresos, Gastos y Neto con estilo destacado.
- **Fix PDF — Caracteres espaciados**: Corregido bug donde `setCharSpace(3)` del título se propagaba al texto de transferencias, causando texto como "C a j a G e n e r a l". Se agregó reset explícito de `setCharSpace(0)`.
- **Fix PDF — Flecha Unicode**: Reemplazado carácter `→` (no soportado por fuente helvetica de jsPDF) por `>>`.
- **API de reportes enriquecida**: El endpoint `/api/transactions/report` ahora incluye `transferDetails` con nombres de eventos resueltos y `event.name` en cada transacción.

### 📱 Exportar Reporte como Imagen
- **Nuevo botón "Descargar Imagen"**: Reemplaza la nota de "toma un capture". Usa la librería `html-to-image` para capturar la tarjeta del reporte como PNG en alta resolución (3x pixel ratio).
- **Nueva dependencia**: `html-to-image` agregada al proyecto.

### 🏷️ Limpieza de Categorías y Descripciones
- **Categorías renombradas (7)**: Se unificaron "Ganancia" e "Ingreso" en "Venta". Se corrigieron acentos y se mejoraron nombres: Aportes→"Aporte de miembros", Prestamo→"Préstamo", Ofrenda predicadores→"Ofrenda a predicador", Inversion→"Inversión", "Ofrenda para un joven miembro"→"Donación", "Materiales de Actividad"→"Materiales", Bebida→"Refrigerio".
- **30 descripciones corregidas**: Typos (Ganacia, Grabierl, pagarón), textos vagos ("Aporte" → "Aporte mensual de Sherry Campos"), textos informales profesionalizados, acentos corregidos.

### 💰 Correcciones Financieras
- **RD$2,000 reclasificado**: Gasto incorrecto de caja convertido a transferencia Caja General → Culto de jóvenes 31 de marzo.
- **RD$3,800 corregido**: Ingreso duplicado en caja (ya contabilizado en evento "Venta de alcancía") eliminado y reemplazado por transferencia de ganancia neta de RD$2,000 desde el evento.
- **Transferencia inválida eliminada**: Transfer de RD$1,800 Caja→Caja (ambos IDs null) que no tenía efecto fue borrada.
- **RD$124.90 → RD$125**: Monto de transferencia corregido.
- **Balance de Caja verificado**: RD$125 (confirmado con el tesorero).

### 🔧 Fix Técnico
- **Build fix**: Error preexistente de TypeScript en `defaultMonthlyDue` resuelto con cast `as any` en `app/api/dues/route.ts`.

---

## 📦 [v1.5.0] - Sales Tracking, Reports Overhaul & Dues System
**Fecha:** 30 de marzo de 2026

### 🛒 Sistema de Control de Entregas y Cobros (Sale Tracking)
- **Nueva funcionalidad completa** que reemplaza el tracking en Notion. Modelos: `SaleProduct`, `SaleEntry`, `SaleEntryItem` con relaciones a eventos tipo VENTA.
- **Página de ventas** (`app/events/[id]/sales/page.tsx`): KPIs en tiempo real, configuración de productos, tabla de pedidos con filtros por estado (Pendiente/Parcial/Pagado), modal de agregar/editar.
- **APIs REST completas**: productos (`/api/events/[id]/sales/products`), pedidos (`/api/events/[id]/sales/entries`), resumen (`/api/events/[id]/sales/summary`).
- **Seed de 52 clientes** importados desde PDF de Notion (`scripts/seedManiSales.ts`).
- **Cálculo automático de estado de pago**: PAGADO si pagó >= adeudado, PARCIAL si pagó > 0, PENDIENTE si no ha pagado.

### 📊 Reportes — WhatsApp, PDF, Excel, Presentación
- **Concordancia total** entre los 4 formatos de exportación: separación clara de Caja General vs Eventos/Ventas.
- **WhatsApp mejorado**: Mensaje con desglose por categoría (de dónde vino cada ingreso y en qué se gastó cada gasto). Se eliminaron transferencias del mensaje público (uso interno).
- **Bug fix**: El reporte mostraba "Entró" y "Salió" del período pero el balance era histórico — ahora la matemática cuadra mostrando el desglose completo.
- **Infografía visual** (para screenshot) actualizada con el mismo desglose de categorías.
- **Presentación** (`app/presentation/page.tsx`): reescrita para usar datos reales de la API de reportes.

### 💰 Control de Cuotas (Dues System)
- **Cuota configurable**: Eliminado el monto hardcoded de RD$200. Ahora se configura desde un modal con "Aplicar a Todos".
- **Filtro por mes**: Navegación con flechas para ver cuotas de meses anteriores/siguientes.
- **Tabs de filtro**: Todos / Pendientes / Al día.
- **KPIs**: Recaudado vs meta, progreso %, conteo de miembros al día/pendientes.
- **WhatsApp reminder**: Usa el monto real de cuota de cada miembro para calcular lo que falta.
- **`defaultMonthlyDue`** agregado al modelo Settings con workaround `$executeRaw` para compatibilidad.

### 💸 Transferencias VENTA
- **Fix**: Los eventos tipo VENTA ahora muestran el monto total recaudado (no solo la ganancia) como "Disponible para transferir".
- Fórmula corregida: `totalIncome + netTransfers` en dashboard y transacciones.

### 🎨 Mejoras Visuales
- **Dropdowns visibles**: Fix global en `globals.css` para que los `<select>` y `<option>` se vean con fondo oscuro y texto claro (antes eran blanco sobre blanco).
- **Sombras de botones**: Reducidas las sombras exageradas en botones "Crear Evento", "Confirmar & Lanzar Proyecto" y "Registrar Movimiento".
- **Card "Caja General"** en reportes: ahora muestra desglose de entradas y salidas por categoría inline.

### 🗄️ Schema (Prisma)
- Nuevos modelos: `SaleProduct`, `SaleEntry`, `SaleEntryItem` con cascade delete.
- Campo `defaultMonthlyDue` en `Settings`.
- Relaciones `saleProducts` y `saleEntries` en modelo `Event`.

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
