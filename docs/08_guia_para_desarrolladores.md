# 08. Guía Maestra para Desarrolladores (ADN del Proyecto)

Esta guía es el **Mapa Genético** de ChurchFlow. Está diseñada para que cualquier desarrollador pueda localizar, entender y modificar cualquier átomo del sistema con precisión quirúrgica.

---

## 🏗️ 1. Arquitectura de Carpetas (El Mapa del Tesoro)

| Carpeta / Archivo | Propósito General | ¿Qué buscar aquí? |
| :--- | :--- | :--- |
| `app/` | Rutas y Páginas | Todo lo que el usuario ve en pantalla. |
| `app/api/` | Backend (Servidor) | La lógica que guarda, borra y procesa datos. |
| `components/` | Piezas de UI | Botones, tablas, menús y componentes visuales. |
| `lib/` | Utilidades y Núcleo | Conexión a DB, Autenticación y Formateo. |
| `prisma/` | Base de Datos | Definición de tablas y campos (Schema). |
| `public/` | Assets Estáticos | Logos, iconos de PWA y manifiesto de instalación. |
| `styles/` | Estética Global | Colores de marca, fuentes y estilos de Tailwind. |

---

## 🎨 2. Capa Visual (Identidad y Estilo)

### 2.1 Colores y Temas
Si necesitas cambiar los colores base del sistema, el archivo maestro es **`styles/globals.css`**.
- **Variables CSS:** Busca la sección `:root`. Allí definimos `--brand-primary` (Naranja), `--brand-secondary` y el fondo `--background`.
- **Contrastes:** La lógica que decide si el texto es blanco o negro sobre un color de marca está en **`lib/ConfigProvider.tsx`**.

### 2.2 Tipografías
- **Fuentes Modernas:** Se cargan en **`app/layout.tsx`** usando `next/font/google`.
- **Firma Elegante:** La fuente cursiva de los reportes es la variable `greatVibes` en el mismo archivo. Si quieres cambiarla por otra, impórtala ahí.

### 2.3 Componentes Base (UI)
Viven en **`components/ui/`**.
- **Notificaciones (Toast):** Si quieres cambiar el tamaño o la velocidad de las alertas, edita `toast.tsx`.
- **Botones y Tablas:** Si quieres que todos los botones tengan bordes más cuadrados o más redondos, edita `Button.tsx`.

---

## 🧠 3. Capa de Lógica (El Cerebro)

### 3.1 Procesamiento Financiero
- **Cálculo de Totales:** La lógica que suma ingresos y resta gastos para el Dashboard vive en **`app/page.tsx`** dentro de los `useMemo`.
- **Formateo de Moneda:** La función que añade el "RD$" y las comas está en **`lib/utils.ts`** como `formatCurrency`.

### 3.2 Motor de Sincronización (Excel)
Es una de las piezas más complejas del sistema.
- **Exportación:** El diseño de las columnas del Excel vive en **`app/page.tsx`** (función `exportToExcelMaster`).
- **Importación (Backend):** La lógica que evita duplicados y procesa el archivo vive en **`app/api/admin/master-import/route.ts`**. Si quieres cambiar qué columnas se leen, edita este archivo.

### 3.3 Máquina del Tiempo (Auditoría)
- **Rastreo:** Cada vez que el sistema guarda algo en lote, crea un registro en `AuditLog`. La lógica de reversión (borrado quirúrgico) vive en **`app/api/admin/audit/revert/route.ts`**.

---

## 📂 4. Capa de Datos (Base de Datos)

El archivo **`prisma/schema.prisma`** es la única fuente de verdad.
- **Añadir Campos:** Si quieres que los Miembros tengan un campo "Dirección", añádelo en `model Member`.
- **Actualizar DB:** Después de cualquier cambio en este archivo, DEBES ejecutar `npx prisma db push` en la consola.

---

## 🛠️ 5. Guía de Modificación Rápida (Recetario)

### "¿Cómo añado una nueva pestaña al menú lateral?"
1. Abre **`components/Sidebar.tsx`**.
2. Busca la constante `NAV_ITEMS` (para usuarios normales) o `ADMIN_ITEMS` (para administradores).
3. Añade un nuevo objeto con `href`, `label` e `icon`.

### "¿Cómo cambio el diseño del PDF de reportes?"
1. Abre **`app/reports/page.tsx`**.
2. Busca la función `generatePDF`.
3. Allí verás el código de `jsPDF`. Puedes cambiar posiciones (X, Y), tamaños de letra y colores del bloque negro superior.

### "¿Cómo cambio el límite de registros que se ven en una tabla?"
1. Busca la página correspondiente (ej: `app/transactions/page.tsx`).
2. Busca la función `.slice(0, 10)` o similar y cambia el número por el que desees.

### "¿Cómo modifico las reglas de los eventos (Proyectos)?"
1. La lógica de estado (ACTIVO/FINALIZADO) vive en **`app/events/page.tsx`**.
2. El borrado en cascada (que borra todo al borrar el evento) se configura en la API: **`app/api/events/[id]/route.ts`**.

---

## 🚀 6. Despliegue y Producción (Vercel)

El sistema está optimizado para **Vercel**.
- **Errores de Compilación:** Si el build falla por "entities", asegúrate de usar `&quot;` en lugar de comillas dobles dentro de etiquetas de texto en archivos `.tsx`.
- **Variables de Entorno:** Los secretos (como la URL de la base de datos) NO están en el código. Se configuran en el panel de Vercel bajo la sección **Environment Variables**.

---
*Este documento es dinámico y debe actualizarse con cada nueva funcionalidad core que se inyecte al sistema.*
