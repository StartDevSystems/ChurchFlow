# Sistema de Gestión Financiera para Ministerio de Jóvenes


## Descripción del Proyecto
Esta aplicación es un sistema híbrido de gestión financiera para el ministerio de jóvenes de una iglesia. Permite:


- Control manual completo desde un dashboard web
- Automatización opcional de balances, reportes y backups (tipo MCP)
- Registro de miembros, ingresos, gastos
- Generación automática de reportes PDF
- Preparada para escalar a multi-iglesia en el futuro


## Tecnologías
- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- Framer Motion (animaciones suaves)
- Prisma ORM con SQLite (base de datos local)
- jsPDF (generación de reportes PDF)
- date-fns (manejo de fechas)
- Node.js / npm


## Estructura del Proyecto



/components <- Componentes reutilizables del dashboard
/pages <- Rutas de la aplicación
/prisma <- Modelo de datos Prisma
/scripts <- Scripts automáticos tipo MCP (generación de reportes, backups, balances)
/public <- Imágenes y assets
/styles <- Archivos de Tailwind y CSS
/.env <- Configuración de base de datos
/dev.db <- Base de datos SQLite (inicial)
package.json
README.md



## Funcionalidades


### Dashboard Principal
- Total ingresos
- Total gastos
- Balance actual (ingresos - gastos)
- Resumen del mes
- Vista clara y moderna (Tailwind + Framer Motion)


### Módulo de Miembros
- Crear / Editar / Eliminar miembro
- Listado completo
- Datos: Nombre, Teléfono, Fecha de registro


### Módulo de Transacciones
- Crear transacción: tipo `income` o `expense`
- Categoría, monto, fecha, descripción
- Asociar miembro opcional
- Listado con filtros por tipo y fecha
- Cálculos automáticos de balance


### Reportes
- Filtro por rango de fechas
- Totales de ingresos, gastos y balance
- Tabla detallada
- Generación PDF con un solo clic (jsPDF)


### Automatizaciones (tipo MCP, opcionales)
- Scripts Node.js en `/scripts`:
  - `generateReport.ts` → genera PDF automáticamente
  - `backupDb.ts` → copia automática de dev.db
  - `updateBalance.ts` → recalcula balances automáticamente
- Se pueden activar desde CLI o desde botones en el dashboard (híbrido)
- Híbrido: puedes usar manualmente o dejar que corran automáticamente


### Diseño y Experiencia de Usuario
- Sidebar fija y navegación clara
- Modo oscuro
- Animaciones suaves al scroll y transiciones
- Componentes reutilizables
- Preparado para agregar Three.js en página landing opcional (solo efectos visuales, dashboard limpio)


## Base de Datos Prisma (SQLite)
**Modelos:**


```prisma
model Member {
  id        String   @id @default(uuid())
  name      String
  phone     String
  createdAt DateTime @default(now())
  transactions Transaction[]
}


model Transaction {
  id        String   @id @default(uuid())
  type      TransactionType
  category  String
  amount    Float
  date      DateTime
  description String
  memberId  String?
  member    Member? @relation(fields: [memberId], references: [id])
  createdAt DateTime @default(now())
}


enum TransactionType {
  income
  expense
}
Scripts / MCP

Ejecutar scripts desde CLI:

npm run generate-report
npm run backup-db
npm run update-balance

Los scripts también se pueden disparar desde botones en el dashboard (híbrido)

Instrucciones de instalación y ejecución

Instalar dependencias:

npm install

Inicializar Prisma y base de datos:

npx prisma migrate dev --name init

Ejecutar la app en modo desarrollo:

npm run dev

Abrir navegador en:

http://localhost:3000
Futuras mejoras

Multi-iglesia (SaaS)

Registro de ubicación GPS para eventos

Alertas automáticas por WhatsApp / correo

Landing page con Three.js para presentación

Notas finales

Esta app está diseñada para ser híbrida: puedes manejar todo manualmente desde el dashboard o dejar que los scripts automáticos (tipo MCP) hagan el trabajo por ti.



---


# ✅ Qué hacer después


1. Guarda esto como `README.md` en tu carpeta.  
2. Abre Gemini CLI en la carpeta y usa **el prompt**:



Genera toda la aplicación según las instrucciones del README.md en esta carpeta.



- Gemini leerá el README y creará el proyecto completo con dashboard, automatizaciones y scripts.  


---


💡 Tip de Maicol: Así siempre tienes un **blueprint completo**. Cada vez que quieras mejorar, solo actualizas el README y Gemini puede regenerar/actualizar la app.


---


Si quieres, en el siguiente paso te puedo hacer un **plan visual de carpetas y archivos completos** con **s**
---

## Actualizaciones y Nuevas Funcionalidades

### Desarrollo Inicial (Basado en README original)
Se ha completado la implementación de la aplicación base, que incluye:
-   **Configuración del Proyecto:** Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion.
-   **Base de Datos (Prisma con SQLite):**
    -   Schema inicial de `Member` y `Transaction` con `TransactionType` enum.
    -   Inicialización del cliente Prisma (`lib/prisma.ts`).
-   **API Routes:**
    -   `/api/members`: GET (listar), POST (crear).
    -   `/api/transactions`: GET (listar con filtros por tipo), POST (crear).
    -   `/api/transactions/report`: POST (generar datos de reporte por rango de fechas y calcular totales).
-   **Componentes UI:** `Button`, `Card`, `Input`, `Label`, `Select`, `Textarea`, `Popover`, `Calendar`, `AlertDialog`, `ProgressBar`, `Checkbox` (creados para ser reutilizables y consistentes con `shadcn/ui`).
-   **Páginas UI:**
    -   `/`: Dashboard (muestra resúmenes financieros y transacciones recientes).
    -   `/members`: Listado de miembros.
    -   `/members/new`: Formulario para crear nuevos miembros.
    -   `/transactions`: Listado de transacciones con filtros.
    -   `/transactions/new`: Formulario para crear nuevas transacciones.
    -   `/reports`: Interfaz para generar reportes por rango de fechas y descargar PDF.
-   **Scripts de Automatización:**
    -   `scripts/backupDb.ts`: Copia de seguridad de la base de datos.
    -   `scripts/generateReport.ts`: Generación de reportes PDF mensuales.
    -   `scripts/updateBalance.ts`: Cálculo y visualización del balance actual.
-   **Estilización:** Configuración completa de Tailwind CSS para modo oscuro y sistema de temas.

### Funcionalidad de Edición y Eliminación
Se ha añadido la capacidad de editar y eliminar registros existentes:
-   **API Routes (Individuales):**
    -   `/api/members/[id]`: GET (obtener miembro por ID), PUT (actualizar miembro), DELETE (eliminar miembro).
    -   `/api/transactions/[id]`: GET (obtener transacción por ID), PUT (actualizar transacción), DELETE (eliminar transacción).
-   **Páginas UI:**
    -   `/members`: Se añadieron botones de "Editar" y "Eliminar" en cada fila de la tabla.
    -   `/members/edit/[id]`: Página para editar los detalles de un miembro existente.
    -   `/transactions`: Se añadieron botones de "Editar" y "Eliminar" en cada fila de la tabla.
    -   `/transactions/edit/[id]`: Página para editar los detalles de una transacción existente.
-   **Confirmación:** Integración del componente `AlertDialog` para confirmación de eliminación.

### Seguimiento de Cuotas (Nueva Funcionalidad)
Se ha implementado un sistema para el seguimiento visual de las cuotas de los jóvenes, incluyendo:
-   **Modelo de Datos:**
    -   Se añadió el campo `role` (String, con valor por defecto "Joven") al modelo `Member` en `prisma/schema.prisma`.
    -   Se aplicó la migración correspondiente a la base de datos.
-   **API de Miembros:** Las rutas de creación y actualización de miembros (`/api/members` y `/api/members/[id]`) se actualizaron para manejar el campo `role`.
-   **UI de Miembros:**
    -   Las páginas de "Crear" y "Editar Miembro" (`/members/new` y `/members/edit/[id]`) ahora incluyen un selector para asignar el rol (Joven/Directiva).
    -   La página de listado de miembros (`/members`) muestra el rol de cada miembro en la tabla.
-   **API de Cuotas:**
    -   Nueva ruta API `/api/dues` que retorna el listado de miembros "Joven" junto con el total aportado en transacciones de categoría "Cuota".
-   **UI de Cuotas:**
    -   Se añadió un enlace "Cuotas" al `Sidebar` de navegación.
    -   Se creó la página `/dues` que muestra el progreso de cada joven hacia la meta de 160, utilizando el nuevo componente `ProgressBar`.
-   **Registro de Transacciones de Cuota Mejorado:**
    -   La página "Nueva Transacción" (`/transactions/new`) se modificó para que, al seleccionar la categoría "Cuota", permita elegir **múltiples** jóvenes mediante casillas de verificación.
    -   Se añadió un botón "Seleccionar Todos los Jóvenes" para agilizar el proceso.
    -   La lógica de envío crea una transacción individual de "cuota" para cada joven seleccionado.

### Mejoras Recientes
Se han implementado mejoras significativas en la visualización de datos y la flexibilidad del sistema:
-   **Solución de Autenticación:** Se corrigió el error `JWEDecryptionFailed` al configurar `NEXTAUTH_SECRET` y `NEXTAUTH_URL`, asegurando un inicio de sesión estable.
-   **Adaptación de Colores en Gráficos:** Los gráficos del Dashboard (`/`) ahora ajustan automáticamente sus colores (ejes, leyendas, tooltips y etiquetas) para ser legibles en modos claro y oscuro.
-   **Página de "Estadísticas" Mejorada:**
    *   Se añadió una nueva página `/stats` accesible desde la barra lateral.
    *   Esta página ahora funciona como un **perfil financiero completo por miembro**, mostrando el total de ingresos, total de gastos y el balance neto.
    *   Incluye un desglose mensual interactivo con un gráfico de barras agrupadas (ingresos vs. gastos) para cada miembro.
    *   El sistema ahora procesa **todas las transacciones de ingresos y gastos** vinculadas a un miembro para estas estadísticas.
-   **Página de "Cuotas" Inclusiva:** La página `/dues` ahora muestra a **todos los miembros** (Jóvenes y Directiva), no solo a los jóvenes, para el seguimiento de la categoría "Cuota".
-   **Reutilización de Código:** La función `formatCurrency` se movió a `lib/utils.ts` para una mejor organización.

### Historial de Versiones (Changelog)

#### `v1.1.0` - Gestión de Categorías y Mejoras de UI
*Fecha: 13 de Febrero, 2026*

- **Gestión de Categorías Dinámicas:**
    - Se ha creado un nuevo módulo en `/admin/categories` que permite al administrador crear, editar y eliminar categorías de ingresos y gastos.
    - El formulario de "Nueva Transacción" ahora utiliza un menú desplegable para seleccionar la categoría.
- **Página de "Estadísticas" Mejorada:**
    - La página de estadísticas ahora funciona como un perfil financiero 360° por miembro, mostrando `Total de Aportes`, `Total de Gastos` y un `Balance Neto`.
    - El gráfico de detalle ahora muestra barras agrupadas de ingresos vs. gastos para un análisis mensual completo.
- **Página de "Cuotas" Inclusiva:**
    - La página `/dues` ahora muestra a todos los miembros (Jóvenes y Directiva).
- **Adaptación de Colores en Gráficos:**
    - Todos los gráficos del Dashboard ahora se adaptan correctamente a los modos claro y oscuro.
- **Corrección de Bugs:**
    - Solucionado el error `Objects are not valid as a React child` que ocurría en el Dashboard.
    - Solucionado el error de autenticación `JWEDecryptionFailed` al configurar un `NEXTAUTH_SECRET` estable.

### Próximas Funcionalidades (Plan de Desarrollo)
Basado en las peticiones del usuario, estas son las próximas grandes mejoras a implementar:

1.  **Autenticación y Autorización (En Curso):**
    *   **Objetivo:** Proteger la aplicación, permitir el acceso seguro de usuarios y definir diferentes niveles de permisos (roles).
    *   **Estado Actual:**
        *   Modelo `User` añadido a `prisma/schema.prisma` y migrado a la base de datos.
        *   NextAuth.js instalado y configurado.
        *   Páginas de login, registro y logout creadas.
        *   Todas las rutas API protegidas.
        *   Páginas UI protegidas (redirección a login si no autenticado).
2.  **Mejoras en el Dashboard (Completado):**
    *   **Objetivo:** Proporcionar una visión más rica y visual de los datos financieros.
    *   **Estado Actual:**
        *   Gráficos de tendencias mensuales (ingresos vs. gastos) implementados.
        *   Gráficos de desglose por categorías (ingresos y gastos) implementados.
3.  **Gestión Avanzada de Transacciones:**
    *   Implementar transacciones recurrentes.
    *   Mejorar la validación de formularios y la retroalimentación de errores.
4.  **Gestión de Categorías Dinámicas (Nueva Idea):**
    *   **Objetivo:** Permitir al administrador crear, editar y eliminar categorías para los ingresos y gastos.
    *   **Mejora:** En el formulario de transacciones, reemplazar el campo de texto de "Categoría" por un menú desplegable (`<select>`) que se popule con las categorías existentes. Esto mejora la consistencia de los datos y la experiencia de usuario.
5.  **Eventos Financieros (Módulo de Fondos/Proyectos):**
    *   **Objetivo:** Permitir el seguimiento financiero de actividades y fondos designados.
    *   **Descripción:** Crear un módulo de "Eventos" o "Proyectos" (ej. Campamentos, Recaudaciones) y la capacidad de asociar transacciones (ingresos, gastos) a cada uno. Generar reportes específicos por evento para analizar su rentabilidad y el balance de fondos.
6.  **Nuevo Tipo de Transacción "Gasto Cubierto por Tercero":**
    *   **Objetivo:** Registrar gastos del ministerio que son pagados directamente por un miembro, sin afectar el balance principal de la iglesia.
    *   **Descripción:** Añadir un nuevo tipo de transacción que permita registrar el monto, la categoría y el miembro que cubrió el gasto. Este tipo de transacción no alteraría el balance total del ministerio, pero sí se reflejaría como un aporte del miembro en sus estadísticas y como un gasto cubierto en los reportes del evento/fondo asociado.
7.  **Notificaciones Automatizadas:**
    *   **Objetivo:** Implementar un sistema de notificaciones proactivo.
    *   **Descripción:** Configurar envíos automáticos (ej. por correo electrónico, futura integración con WhatsApp) de recordatorios de cuotas pendientes o alertas sobre el presupuesto.
8.  **Roles y Permisos Avanzados:**
    *   **Objetivo:** Definir y aplicar niveles de acceso detallados basados en roles de usuario.
    *   **Descripción:** Expandir el modelo de `User` para incluir roles como "Tesorero", "Líder", "Miembro", cada uno con diferentes capacidades (ej. Tesorero puede editar todo, Líder solo ver reportes, Miembro solo ver su perfil).
9.  **Presupuesto:**
    *   Capacidad de establecer presupuestos para categorías de gastos.
    *   Seguimiento del presupuesto frente al gasto real.
10. **Otras Mejoras de UI/UX:**
    *   Búsqueda global para listas de miembros/transacciones.
    *   Mejorar las visualizaciones de la página "Cuotas".
    *   Añadir el logo de la aplicación.
11. **Preparativos para Despliegue:**
    *   Documentar los pasos de despliegue.
    *   Asegurar que las variables de entorno estén configuradas para producción.
12. **Otras Ideas (Futuras):** Python (si surge un caso de uso claro), efectos de scroll, Three.js (para landing page opcional).

### Problemas Actuales / En Curso
-   **Bug:** Error "Failed to create member" al intentar crear un nuevo miembro.
    *   **Estado:** Se ha modificado la API de creación de miembros (`/api/members/route.ts`) para que registre un error detallado en la consola del servidor. Se está esperando que el usuario proporcione este log para diagnosticar y corregir el problema.

### Cómo Trabaja el Asistente CLI

Como tu asistente de desarrollo de software, sigo un proceso estructurado para garantizar que las tareas se completen de manera efectiva y segura:

1.  **Entender la Solicitud:** Analizo tus instrucciones y el contexto del proyecto (código, `README.md`, etc.) para comprender a fondo el objetivo.
2.  **Planificar la Solución:** Desarrollo un plan detallado paso a paso. Para tareas complejas, creo una lista de subtareas (`TODOs`) que comparto contigo para transparencia. **Siempre discuto los cambios importantes o nuevas funcionalidades contigo antes de implementarlas.**
3.  **Ejecutar la Implementación:** Escribo o modifico el código utilizando las herramientas disponibles, adhiriéndome a las mejores prácticas de codificación y al estilo existente de tu proyecto.
4.  **Verificar el Trabajo:** Reviso los cambios en busca de errores (sintaxis, lógica) y confirmo que cumplan con los requisitos. Si es posible, sugiero o realizo pruebas.
5.  **Reportar y Confirmar:** Te informo sobre el trabajo realizado, te pido que verifiques los cambios y espero tus comentarios o la siguiente instrucción. Tú mantienes el control total sobre el proceso.
