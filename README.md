# Sistema de Gestión Financiera - Ministerio de Jóvenes

## 🚀 Descripción General
Esta aplicación es un sistema integral de gestión financiera diseñado específicamente para el ministerio de jóvenes de una iglesia. Ofrece un control total sobre ingresos, gastos, miembros y eventos, combinando una interfaz web moderna con potentes capacidades de automatización.

### 🌟 Características Principales
- **Dashboard Interactivo:** Resumen financiero en tiempo real con gráficos de tendencias y desgloses por categoría.
- **Gestión de Eventos (Fondos Separados):** Capacidad para gestionar las finanzas de eventos específicos (campamentos, retiros, etc.) de forma independiente al Fondo General de la iglesia.
- **Seguimiento de Cuotas:** Monitoreo visual del progreso de los aportes de cada miembro.
- **Reportes Profesionales:** Generación de reportes PDF detallados por rango de fechas.
- **Perfil Financiero por Miembro:** Vista de 360° de los aportes y gastos vinculados a cada persona.
- **Administración de Categorías:** Control total sobre las categorías de ingresos y gastos para mantener la consistencia.

---

## 🛠️ Tecnologías Utilizadas
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos:** [Prisma ORM](https://www.prisma.io/) con **SQLite**
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [Radix UI](https://www.radix-ui.com/) + Componentes personalizados (inspirados en shadcn/ui)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Autenticación:** [NextAuth.js](https://next-auth.js.org/)
- **PDF:** [jsPDF](https://github.com/parallax/jsPDF) + [autoTable](https://github.com/simonbengtsson/jspdf-autotable)
- **Fechas:** [date-fns](https://date-fns.org/)

---

## 📂 Estructura del Código y Desarrollo

### 🏛️ Arquitectura de Archivos
- **/app**: Lógica de rutas y API.
  - **/api**: Endpoints del servidor (Transactions, Members, Events, Stats, Categories).
  - **/events**: Módulo de gestión de eventos y sus finanzas.
  - **/transactions**: Módulo de registro y edición de movimientos financieros.
  - **/members**: Gestión de perfiles de miembros y roles.
  - **/stats**: Perfiles financieros detallados y gráficos por miembro.
- **/components**: Componentes de la interfaz.
  - **/ui**: Componentes base reutilizables (Botones, Tablas, Tarjetas, etc.).
  - `Sidebar.tsx`: Navegación principal.
- **/prisma**: Definición del modelo de datos (`schema.prisma`) y migraciones.
- **/lib**: Utilidades compartidas y clientes (Prisma, Auth, Formateo de moneda).
- **/scripts**: Automatizaciones (Backups, Generación de reportes automáticos).

### 🎨 Diseño y Experiencia de Usuario (UX)
- **Interfaz Premium:** Diseño modernizado con una estética limpia, profesional y personalizada.
- **Totalmente Responsivo:** Optimizado para una experiencia fluida en celulares, tablets y computadoras.
- **Navegación Inteligente:** Sidebar dinámico que se adapta al dispositivo (menú hamburguesa en móviles).
- **Modo Oscuro/Claro:** Soporte nativo que respeta las preferencias del usuario con una paleta de colores vibrante.

### ⚙️ Lógica del Backend (API)
- **Filtrado Inteligente:** La API de transacciones permite filtrar por tipo, evento o miembro.
- **Integridad de Datos:** Relaciones estrictas en la base de datos entre transacciones, miembros y eventos.
- **Seguridad:** Todas las operaciones de escritura y lectura están protegidas por sesión de usuario a través de NextAuth.

---

## 🌐 Despliegue y Base de Datos (Febrero 2026)

Este proyecto ha sido migrado de **SQLite** a **PostgreSQL (Supabase)** para permitir su despliegue en la web.

### 🚀 Estado del Despliegue
- **Hosting:** Vercel (`https://sociedad-jovenes.vercel.app`)
- **Base de Datos:** Supabase (ID: `kydllcrcsmovpvgrsdko`)
- **Estado Actual:** ✅ **OPERATIVO**. Conexión establecida con éxito mediante Pooler de Supabase.

### 🔑 Configuración Requerida en Vercel
Para mantener la estabilidad, las variables en Vercel deben ser:

1. **DATABASE_URL**: URL del Pooler (Puerto 6543) con host `aws-1-us-east-1.pooler.supabase.com` y `?pgbouncer=true`.
2. **DIRECT_URL**: URL del Pooler (Puerto 5432) para migraciones.
3. **NEXTAUTH_URL**: `https://sociedad-jovenes.vercel.app`
4. **NEXTAUTH_SECRET**: Clave secreta para sesiones.

---

## 🛠️ Instalación y Ejecución

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```

2. **Configurar Base de Datos:**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Iniciar en Desarrollo:**
   ```bash
   npm run dev
   ```

---

## 📝 Notas de las Últimas Actualizaciones

### Módulo de Eventos (Fondos Separados)
Se ha implementado una funcionalidad crucial: la capacidad de separar los gastos de un evento del balance general. 
- Al crear una transacción, ahora puedes elegir a qué evento asociarla.
- Si no se asocia a ningún evento, la transacción se considera parte del **Fondo General**.
- Cada evento tiene su propio "Dashboard" interno donde se ve su balance neto, sus ingresos y sus gastos sin mezclarse con otros fondos.

### Perfil Financiero por Miembro
En la sección de estadísticas, ahora puedes ver exactamente cuánto ha aportado y cuánto ha gastado cada miembro a lo largo del tiempo, con gráficos mensuales detallados.

### Corrección de Errores y Estabilidad
- Se corrigió el error de sintaxis en la API de transacciones que impedía mostrar los movimientos de los eventos.
- Se mejoró el selector de categorías en la edición de transacciones para asegurar la integridad de los datos.

 
