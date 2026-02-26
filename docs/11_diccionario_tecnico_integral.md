# 11. Diccionario Técnico Integral (Enciclopedia del Código)

Este documento contiene la explicación **absoluta y granular** de cada átomo de ChurchFlow. Su propósito es servir como la fuente única de verdad para entender la ingeniería detrás del sistema.

---

## 🏗️ 1. EL ESQUEMA DE DATOS (Prisma / Base de Datos)
Archivo: `prisma/schema.prisma`

### Modelos (Tablas):
- **`User`**: Gestiona las credenciales de acceso.
    - `permissions`: Objeto JSON que define qué partes de la app puede ver el usuario.
- **`Member`**: Directorio de personas.
    - `monthlyDue`: Monto que el miembro se compromete a dar mensualmente.
- **`Transaction`**: Cada movimiento de dinero.
    - `categoryId`: Vincula el movimiento a un propósito (Ofrenda, Gasto, etc).
    - `eventId`: Si no es nulo, la transacción pertenece a un "Proyecto" y no a la Caja General.
- **`AuditLog`**: El cerebro de la "Máquina del Tiempo".
    - `metadata`: Guarda un JSON con los IDs de registros creados en lote para permitir la reversión.
- **`Settings`**: Configuración única del sistema.
    - `signatureUrl`: Almacena la imagen de la firma del responsable en Base64.

---

## 🧠 2. EL SISTEMA NERVIOSO CENTRAL (Layout y Estado Global)

### 2.1 El Contenedor Maestro (`app/layout.tsx`)
**Función principal:** Envuelve a toda la app y decide quién entra y quién no.
- **`AppStructure`**: Componente interno que maneja la lógica de redirección.
    - **Variable `isPublicPath`**: Comprueba si el usuario está en `/login` o `/register`.
    - **Lógica de `useEffect`**: Si no hay sesión y no es ruta pública, manda al usuario al Login.
- **Fuentes (`inter`, `greatVibes`)**: Cargan las tipografías de Google de forma optimizada.

### 2.2 El Inyector de Identidad (`lib/ConfigProvider.tsx`)
**Función principal:** Aplica los colores de la base de datos al CSS.
- **Función `hexToRgb`**: Convierte el color de marca (ej: #FF6B1A) en números para cálculos.
- **Lógica de Brillo (YIQ)**: Fórmula matemática que decide si el texto sobre el color de marca debe ser Blanco o Negro para ser legible.

---

## 📊 3. EL PANEL DE MANDO (Dashboard - `app/page.tsx`)

### Variables de Estado (State):
- **`transactions`, `members`, `events`**: Arreglos que guardan toda la info traída de la API.
- **`importSummary`**: Objeto que guarda cuántas filas nuevas encontró el asistente de Excel.

### Funciones Clave:
- **`fetchData()`**: Función asíncrona que hace un barrido total de la base de datos al cargar la página.
- **`exportToExcelMaster()`**: 
    - Usa la clase `ExcelJS.Workbook`.
    - Crea 4 pestañas: Resumen, Libro Diario, Proyectos y Miembros.
    - **Lógica de ID**: Inserta el ID de base de datos en la última columna para trazabilidad futura.
- **`handleMasterImport(e)`**:
    - Lee el archivo subido usando `FileReader`.
    - **Sub-función `safeParseDate`**: Intenta convertir cualquier texto raro en una fecha válida de JavaScript.
- **`confirmMasterImport()`**: Envía los datos limpios al servidor en un solo "Lote" (Batch).

---

## 📈 4. EL HUD DE TRADING (`app/presentation/page.tsx`)

### Ingeniería Visual:
- **`useCountUp(target)`**: Hook personalizado que usa `requestAnimationFrame` para animar los números del 0 al total con una curva de aceleración suave.
- **`buildCandles(transactions)`**: 
    - **Lógica**: Agrupa transacciones por día.
    - **Variables**: `open` (saldo inicial del día), `close` (saldo final), `high` (pico máximo), `low` (pico mínimo).
- **`HealthGauge` (El Velocímetro)**: 
    - **Variable `netRatio`**: Divide el balance entre los ingresos totales.
    - **Cálculo de Ángulo**: Convierte el porcentaje de salud en grados (de -90 a 90) para mover la aguja física del HUD.

---

## 🖋️ 5. MOTOR DE DOCUMENTACIÓN PDF (`app/reports/page.tsx`)

### Lógica de Generación:
- **Función `generatePDF()`**: Instancia la clase `jsPDF`.
- **`drawSignature()`**: 
    - **Variable `settings.signatureUrl`**: Si existe, usa `doc.addImage`.
    - **Fallback**: Si no existe, usa `doc.setFont('times', 'italic')` para simular la firma con texto.
- **Ciclo de Pie de Página**: Un `for` que recorre todas las páginas del documento para estampar el lema de la iglesia y el número de página en el fondo negro inferior.

---

## 📡 6. LA CAPA DE COMUNICACIÓN (API Layer)

### Sincronización Pro (`app/api/admin/master-import/route.ts`)
- **Lógica de Transacción (`tx`)**: Usa `prisma.$transaction`. Si una sola fila falla, NADA se guarda. Esto protege la integridad.
- **Filtro de IDs**: Si el objeto tiene un `id` que ya existe en la DB, el sistema hace un `continue` (lo salta) para no duplicar.

### Máquina del Tiempo (`app/api/admin/audit/revert/route.ts`)
- **Lógica de Reversión**: 
    - Recibe un `auditId`.
    - Busca en la columna `metadata` los arreglos `txIds` y `memIds`.
    - Ejecuta un `deleteMany` para borrar todos esos registros de golpe.

---

## 🎨 7. ESTILOS Y COMPONENTES UI (`components/ui/`)

### Notificaciones (`toast.tsx`)
- **Componente `ToastViewport`**: Define la zona de la pantalla donde aparecen las alertas.
- **Variable `toastVariants`**: Contiene los estilos visuales (Success, Destructive, Default). 
    - Se modificó para ser `w-auto` y tener `max-w-[calc(100vw-2rem)]` para que siempre flote como una "isla".

### Barra Lateral (`Sidebar.tsx`)
- **Variable `NAV_ITEMS`**: Array de objetos que define el orden y los iconos del menú.
- **Lógica de Mobile**: Usa el estado `isOpen` para aplicar una transformación de CSS (`translateX`) que esconde o muestra el menú en celulares.

---

## 🔄 8. FLUJO DE LA INFORMACIÓN (Data Lifecycle)

1.  **Acción del Usuario:** El usuario sube un Excel en `app/page.tsx`.
2.  **Procesamiento Local:** El navegador limpia los datos y los muestra en el `ImportAssistant`.
3.  **Envío:** Se hace un `fetch` POST a `/api/admin/master-import`.
4.  **Validación Server:** La API comprueba que el usuario sea ADMIN.
5.  **Persistencia:** Prisma guarda los datos en la base de datos PostgreSQL.
6.  **Auditoría:** Se crea una entrada en `AuditLog` con los IDs de lo que se guardó.
7.  **Actualización:** La web recibe el OK y vuelve a llamar a `fetchData()` para refrescar los números en pantalla sin recargar la página.

---
*Este diccionario es la guía definitiva del ADN de ChurchFlow. Cada línea de código tiene un propósito documentado aquí.*
