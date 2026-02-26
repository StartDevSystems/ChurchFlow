# 08. Manual Genético de ChurchFlow (Documentación Técnica Profunda)

Este documento es el **Plano Maestro de Ingeniería** del sistema. No es una guía de uso, es una radiografía del código para que cualquier programador pueda modificar el comportamiento íntimo de la aplicación.

---

## 🏗️ 1. NÚCLEO FINANCIERO (Cálculos y Balances)

### 1.1 El Motor del Dashboard (`app/page.tsx`)
Toda la inteligencia financiera del resumen inicial vive aquí.
- **Cálculo de Totales:** Busca el bloque `useMemo(() => { ... }, [transactions, transfers])`.
    - **Línea ~150:** Aquí se filtran las transacciones por `type === 'income'` y `type === 'expense'`.
    - **Lógica de Caja:** El balance final se calcula restando el acumulado de gastos al de ingresos, incluyendo las transferencias de "Caja General".
- **Widgets de Estadísticas:** Los KPIs (Ingresos Mes, Gastos Mes) están en la función `renderStats()`. Cada tarjeta usa una variable de color dinámica:
    - `text-green-500` para ingresos.
    - `text-red-500` para gastos.

### 1.2 Formateo de Datos (`lib/utils.ts`)
- **Moneda:** La función `formatCurrency(amount)` usa el estándar `en-US` pero con moneda `USD` (que visualmente es igual al peso dominicano). Para cambiar el símbolo de "RD$", edita el retorno de esta función.

---

## 📊 2. MOTOR DE SINCRONIZACIÓN EXCEL (Bidireccional)

### 2.1 Exportador (Generación del Libro Maestro)
Ubicado en `app/page.tsx` -> función `exportToExcelMaster`.
- **Diseño de Hojas:** El archivo usa la librería `ExcelJS`.
- **Coordenadas de Datos:**
    - Fila 1: Título de la Iglesia (Color de marca aplicado).
    - Fila 3: Encabezados técnicos.
    - Fila 4 en adelante: Datos reales.
- **Mapeo de Columnas (Libro Diario):**
    - Col 1: `#` (Índice visual).
    - Col 2: `FECHA`.
    - Col 7: `MONTO`.
    - Col 8: `ID_SISTEMA` (ID único de base de datos para evitar duplicados).

### 2.2 Importador (Backend)
Ubicado en `app/api/admin/master-import/route.ts`.
- **Algoritmo Anti-Duplicados:**
    - Primero busca por `id` (si la fila del Excel tiene ID_SISTEMA).
    - Si no hay ID, busca por coincidencia exacta de `description` + `amount` + `date` (Rango de 24h).
- **Mapeo de Categorías:** Si una categoría escrita en Excel no existe en la web, el sistema la CREA automáticamente en la línea ~65.

---

## 📈 3. HUD DE PRESENTACIÓN (Estilo Trading)

### 3.1 Animaciones y Física
Ubicado en `app/presentation/page.tsx`.
- **Contadores (CountUp):** La función `useCountUp(target)` controla la velocidad de los números. Usa una fórmula de *Cubic Easing* para que el número empiece rápido y frene suavemente.
- **Gráfico de Velas (CandleChart):** 
    - La lógica de "Vela Verde" (Ganancia) vs "Vela Roja" (Pérdida) se define en la función `buildCandles`.
    - Si el `close > open`, la vela es verde.

### 3.2 El Velocímetro Financiero (Health Gauge)
- **Cálculo de Salud:** Se basa en el `netRatio`. 
    - **Línea ~850:** `healthScore = barWidth * 0.7 + (isPositive ? 30 : 0)`.
    - Esta fórmula premia el balance positivo con 30 puntos extra de "salud".

---

## 🖋️ 4. MOTOR DE REPORTES PDF (jsPDF)

### 4.1 Geometría del Reporte
Ubicado en `app/reports/page.tsx` -> función `generatePDF`.
- **Variables de Página:** `W` (Ancho), `H` (Alto), `M` (Margen de 14mm).
- **Colores (Paleta Sport-Brutalist):** Definidos en la constante `C`. Si quieres cambiar el naranja de los reportes sin afectar la web, edita `C.orange`.

### 4.2 El Bloque de Firma (Firma Híbrida)
Ubicado en la función interna `drawSignature`.
- **Coordenadas de Imagen:** `doc.addImage(..., M + 5, sigY + 8, 40, 12)`.
    - `40`: Ancho de la firma en mm.
    - `12`: Alto de la firma en mm.
- **Tipografía Fallback:** Si no hay imagen, usa la fuente `times` en modo `italic`. La previsualización web usa `var(--font-great-vibes)`.

---

## 🔐 5. SEGURIDAD Y AUDITORÍA (Máquina del Tiempo)

### 5.1 Sistema de Reversión (Lotes)
Ubicado en `app/api/admin/audit/revert/route.ts`.
- **Batching:** Cuando haces una carga de Excel, el sistema agrupa todos los IDs creados en un campo JSON llamado `metadata`.
- **Borrado Quirúrgico:** La función de reversión no borra "lo último que se hizo", sino que busca **exactamente** los IDs guardados en el `AuditLog` del lote seleccionado. No afecta a las transacciones creadas manualmente entre medio.

### 5.2 Reset de Contraseñas
- **Backend:** `app/api/admin/users/reset-password/route.ts`. Usa `bcrypt` con 10 rondas de encriptación.
- **Frontend:** El modal de reset usa un `state` llamado `showPassReset`. El "ojito" de visibilidad cambia el `type` del input entre `password` y `text`.

---

## 🎨 6. SISTEMA DE ESTILOS (Tailwind & Global)

### 6.1 Variables Globales (`styles/globals.css`)
- **Fondo General:** `bg-[#0a0c14]`.
- **Sombras Apple:** Buscas las clases que usan `shadow-2xl` y `backdrop-blur`. 
- **Efecto Glassmorphism:** Se logra con `bg-white/5` + `border-white/10` + `backdrop-blur-xl`.

### 6.2 Tematización Dinámica (`lib/ConfigProvider.tsx`)
Este componente inyecta los colores de la base de datos en el CSS del navegador.
- **Lógica YIQ:** Calcula el brillo del color de marca para decidir si el texto sobre botones debe ser negro o blanco.

---

## 📂 7. BASE DE DATOS (Prisma Schema)

Archivo: **`prisma/schema.prisma`**
- **Model Member:** Contiene `monthlyDue` (cuota) y `birthDate`.
- **Model Transaction:** Relacionado con `Category` y `Event` mediante IDs únicos.
- **Model Settings:** Registro único (`id: 'system-settings'`) que guarda toda la configuración global del sistema.

---

## 🚀 8. GUÍA DE MANTENIMIENTO (Comandos)

| Acción | Comando |
| :--- | :--- |
| **Actualizar Tablas** | `npx prisma db push` |
| **Limpiar Caché Vercel** | `Remove-Item -Recurse -Force .next` |
| **Generar Cliente DB** | `npx prisma generate` |
| **Modo Desarrollo** | `npm run dev` |

---
*Este manual es el alma técnica de ChurchFlow. Úsalo con sabiduría para mantener la integridad del ministerio.*
