# 2. Arquitectura del Sistema

## 2.1. Descripción General

La aplicación está construida sobre una arquitectura moderna de **stack completo (full-stack) basada en JavaScript**, utilizando el framework **Next.js**. Esta elección permite una integración monolítica pero desacoplada entre el frontend y el backend, donde ambos coexisten en el mismo proyecto pero operan en capas distintas.

El enfoque principal es el de una **Aplicación de Página Única (SPA - Single Page Application)** con renderizado del lado del servidor (SSR) e generación de sitios estáticos (SSG) gracias a Next.js, lo que garantiza tanto un rendimiento óptimo como un buen posicionamiento en buscadores (aunque esto último sea más relevante para la landing page que para el dashboard).

## 2.2. Componentes de la Arquitectura

### 2.2.1. Frontend (Capa de Presentación)

- **Framework Principal:** **React 18** a través de **Next.js 14**, utilizando el **App Router**. Esta es la base sobre la cual se construye toda la interfaz de usuario. El App Router permite una estructura de rutas basada en directorios y facilita la creación de layouts anidados y el manejo de estados de carga.
- **Lenguaje:** **TypeScript**. Se utiliza en todo el frontend para asegurar un tipado estricto, lo que reduce errores en tiempo de ejecución y mejora la mantenibilidad y la experiencia de desarrollo.
- **Estilos:** **Tailwind CSS**. Se emplea un enfoque "utility-first" para la estilización, lo que permite construir interfaces complejas y personalizadas de manera rápida y consistente sin salir del HTML. La configuración se procesa con **PostCSS**.
- **Componentes UI:** El sistema utiliza componentes reutilizables construidos internamente, siguiendo principios de diseño atómico y con una estética inspirada en **shadcn/ui**. Esto incluye componentes base como `Button`, `Card`, `Input`, etc., que se encuentran en `/components/ui`.
- **Animaciones:** **Framer Motion**. Se integra para añadir animaciones y transiciones suaves, mejorando la experiencia de usuario (UX) en el dashboard.
- **Gestión de Temas:** **Next-Themes** se utiliza para manejar el cambio entre modo claro y oscuro de manera persistente.

### 2.2.2. Backend (Capa Lógica y de Datos)

- **Entorno de Ejecución:** **Node.js**. Next.js se ejecuta sobre Node.js.
- **API:** La lógica de backend se implementa a través de **API Routes de Next.js**, que son funciones serverless (lambdas) desplegadas automáticamente. Estas rutas se encuentran en `/app/api/`. Cada endpoint maneja una lógica de negocio específica (ej. obtener transacciones, crear un miembro).
- **Autenticación:** La seguridad de los endpoints y la gestión de sesiones de usuario se manejan con **NextAuth.js**. Se utiliza la estrategia de **Credentials** con tokens **JWT**. Se ha eliminado el uso de `PrismaAdapter` para optimizar la compatibilidad con el esquema actual y evitar dependencias innecesarias de tablas de sistema.

### 2.2.3. Capa de Persistencia (Base de Datos)

- **Base de Datos:** **PostgreSQL (Supabase)**. Se utiliza como motor de base de datos principal alojado en la nube. Esta elección permite escalabilidad, alta disponibilidad y acceso remoto seguro.
- **Conexión:** Se utiliza **Prisma Connection Pooling** a través del puerto **6543** para optimizar el uso de conexiones en entornos serverless (Vercel).
- **ORM (Object-Relational Mapping):** **Prisma**. Actúa como la capa de abstracción entre la lógica de la aplicación y la base de datos PostgreSQL. Prisma permite realizar consultas a la base de datos de manera segura y tipada, utilizando un esquema declarativo (`/prisma/schema.prisma`) para definir los modelos de datos.
- **Cliente de Base de Datos:** El **Prisma Client**, generado a partir del esquema, se utiliza en toda la aplicación (principalmente en las API Routes) para interactuar con la base de datos.

### 2.2.4. Scripts y Automatizaciones

- **Entorno de Scripts:** Se utiliza **ts-node** para ejecutar scripts de TypeScript directamente en un entorno de Node.js, sin necesidad de una compilación previa.
- **Ubicación:** Los scripts para tareas de automatización (backups, generación de reportes, etc.) residen en la carpeta `/scripts`. Estos pueden ser invocados tanto desde la línea de comandos a través de `npm run` como desde la propia interfaz de la aplicación.

## 2.3. Flujo de Datos (Ejemplo: Cargar el Dashboard)

1.  El usuario navega a la página principal (`/`).
2.  El componente de React (`app/page.tsx`) se renderiza en el cliente.
3.  Un hook `useEffect` se dispara y ejecuta una llamada `fetch` al endpoint `/api/transactions`.
4.  La API Route (`app/api/transactions/route.ts`) recibe la solicitud.
5.  NextAuth.js intercepta la llamada para verificar si el usuario tiene una sesión activa (token).
6.  Si el usuario está autorizado, la ruta utiliza el **Prisma Client** para hacer una consulta a la base de datos SQLite (`prisma.transaction.findMany(...)`).
7.  Prisma traduce la consulta, la ejecuta en el archivo `dev.db` y devuelve los datos.
8.  La API Route responde con los datos en formato JSON.
9.  El frontend recibe el JSON, procesa los datos (calcula totales, agrupa por categorías) y actualiza el estado de React con `useState`.
10. La interfaz de usuario se re-renderiza para mostrar las estadísticas, gráficos y listas con los datos obtenidos.

![Diagrama de Arquitectura](https://i.imgur.com/example.png) *Nota: Se puede generar un diagrama visual para complementar esta sección.*
