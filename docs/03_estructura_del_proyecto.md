# 3. Estructura del Proyecto

## 3.1. Visión General

El proyecto sigue la estructura estándar de una aplicación Next.js 14 utilizando el **App Router**. Esta estructura organiza el código de manera lógica y predecible, separando la configuración, la lógica del servidor, los componentes de la interfaz de usuario y los archivos públicos.

A continuación se detalla el propósito de cada carpeta y archivo importante en el directorio raíz.

## 3.2. Archivos de Configuración (Raíz)

- **`.eslintrc.json`**: Archivo de configuración para **ESLint**, la herramienta de linting de código. Define las reglas y estándares para mantener la calidad y consistencia del código JavaScript y TypeScript.
- **`.gitignore`**: Especifica los archivos y carpetas que deben ser ignorados por el control de versiones Git (ej. `node_modules`, `.next`, archivos de entorno).
- **`next.config.mjs`**: Archivo de configuración principal de Next.js. Permite personalizar el comportamiento del framework (ej. redirecciones, configuración de imágenes, etc.).
- **`package.json`**: El manifiesto del proyecto Node.js. Contiene metadatos como el nombre del proyecto, la versión, y las listas de dependencias (`dependencies` y `devDependencies`). Lo más importante es que define los `scripts` que se pueden ejecutar con `npm run` (ej. `dev`, `build`, `postinstall`).
- **`package-lock.json`**: Archivo generado automáticamente por `npm` que registra la versión exacta de cada dependencia instalada. Asegura que las instalaciones sean consistentes en diferentes entornos.
- **`postcss.config.mjs`**: Archivo de configuración para **PostCSS**, una herramienta para transformar CSS con plugins. En este proyecto, se utiliza principalmente para procesar **Tailwind CSS**.
- **`tailwind.config.ts`**: Archivo de configuración de **Tailwind CSS**. Aquí se personaliza el tema (colores, fuentes, espaciados) y se habilitan plugins.
- **`tsconfig.json`**: Archivo de configuración de **TypeScript**. Define las opciones del compilador, como el `target` de JavaScript, las rutas de los módulos (`paths`) y las reglas de tipado estricto.

## 3.3. Directorios Principales

### `app/`
Es el corazón de la aplicación y la base del App Router de Next.js.

- **`layout.tsx`**: Define el layout principal que envuelve a toda la aplicación. Es donde se declara la estructura `<html>` y `<body>`, se importan los proveedores de temas (`ThemeProvider`) y se renderiza el `Sidebar`.
- **`page.tsx`**: Es el componente de la página principal, correspondiente a la ruta raíz (`/`). En este caso, es el Dashboard.
- **`app/api/`**: Contiene todas las **API Routes** del backend. Cada subcarpeta define un endpoint. Por ejemplo:
    - `app/api/transactions/route.ts` maneja las peticiones a `/api/transactions`.
    - `app/api/transfers/route.ts` maneja las transferencias entre fondos (v2).
- **`app/(rutas)/`**: Cada subcarpeta dentro de `app` (que no sea `api`) define una ruta en la interfaz de usuario. Por ejemplo:
    - `app/members/page.tsx` corresponde a la URL `/members`.
    - `app/members/new/page.tsx` corresponde a la URL `/members/new`.
    - `app/members/edit/[id]/page.tsx` es una ruta dinámica que corresponde a URLs como `/members/edit/123`.

### `components/`
Contiene todos los componentes de React reutilizables.

- **`Sidebar.tsx`**: El componente de la barra de navegación lateral, presente en toda la aplicación.
- **`ThemeProvider.tsx`**: Componente que envuelve la aplicación para gestionar el tema (claro/oscuro) usando `next-themes`.
- **`components/ui/`**: Esta subcarpeta contiene los componentes de UI base o "atómicos", inspirados en la filosofía de `shadcn/ui`. Son componentes genéricos como `Button.tsx`, `Card.tsx`, `Input.tsx`, `Table.tsx`, etc., que se utilizan para construir interfaces más complejas.

### `lib/`
Carpeta para librerías de ayuda, utilidades y configuraciones reutilizables en el lado del servidor.

- **`auth.ts`**: Contiene la configuración de **NextAuth.js**, incluyendo los proveedores de autenticación y las opciones del adaptador de Prisma.
- **`prisma.ts`**: Inicializa y exporta una única instancia global del cliente de Prisma (`PrismaClient`). Esto previene que se creen múltiples conexiones a la base de datos en un entorno de desarrollo.
- **`utils.ts`**: Contiene funciones de utilidad reutilizables en toda la aplicación, como `cn` (para combinar clases de Tailwind) o `formatCurrency`.

### `prisma/`
Directorio dedicado a la configuración y gestión de la base de datos con Prisma.

- **`schema.prisma`**: El archivo más importante de Prisma. Define el proveedor de la base de datos, el generador del cliente, y lo más importante, los **modelos de datos** (`User`, `Member`, `Transaction`, `Event`, `Transfer`, etc.) que se mapean a las tablas de la base de datos.
- **`dev.db`**: El archivo de la base de datos **SQLite**. Contiene todos los datos reales de la aplicación en el entorno de desarrollo.
- **`migrations/`**: Carpeta donde Prisma guarda el historial de migraciones de la base de datos. Cada subcarpeta representa una migración y contiene un archivo `.sql` con las instrucciones para replicar los cambios en el esquema.

### `scripts/`
Contiene scripts de TypeScript independientes para realizar tareas de automatización o mantenimiento.

- **`backupDb.ts`**: Script para realizar copias de seguridad de la base de datos.
- **`generateReport.ts`**: Script para generar reportes financieros automáticamente.
- **`updateBalance.ts`**: Script para realizar cálculos de balance.

### `public/`
Carpeta para servir archivos estáticos públicamente. Cualquier archivo aquí es accesible directamente desde la URL raíz. Ideal para imágenes (`logo de los jovenes.jpeg`), favicons, fuentes, etc.

### `styles/`
Contiene los archivos de estilos globales.

- **`globals.css`**: Archivo CSS donde se importan las directivas base de Tailwind CSS y se pueden definir estilos globales para toda la aplicación.

### `node_modules/` y `.next/`
- **`node_modules/`**: Carpeta generada por `npm` que contiene todas las dependencias del proyecto. Es ignorada por Git.
- **`.next/`**: Carpeta generada por Next.js durante el desarrollo y la compilación. Contiene la salida del build, cachés y optimizaciones. También es ignorada por Git.
