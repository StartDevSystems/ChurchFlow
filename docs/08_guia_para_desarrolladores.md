# 8. Guía para Desarrolladores

## 8.1. Introducción

¡Bienvenido al equipo de desarrollo! Esta guía te proporcionará toda la información necesaria para configurar tu entorno de desarrollo local, entender el flujo de trabajo y empezar a contribuir al proyecto.

## 8.2. Requisitos Previos

Asegúrate de tener instalado el siguiente software en tu sistema:

- **Node.js** (versión 20.x o superior)
- **npm** (generalmente se instala con Node.js)
- **Git**

## 8.3. Configuración del Entorno Local

### 1. Clonar el Repositorio
```bash
git clone <URL-del-repositorio>
cd Web-Iglesia
```

### 2. Configurar Variables de Entorno
Crea un archivo llamado `.env` en la raíz del proyecto. Este archivo es ignorado por Git y contendrá las claves secretas y configuraciones de tu entorno local.

Copia y pega el siguiente contenido en tu archivo `.env`:

```env
# URL de la base de datos. Para el desarrollo local con SQLite, esta es la configuración correcta.
DATABASE_URL="file:./dev.db"

# Secreto para NextAuth.js. Genera una clave segura.
# Puedes usar el comando `openssl rand -base64 32` en tu terminal para crear una.
NEXTAUTH_SECRET="tu-secreto-aqui"

# URL canónica de tu aplicación. Para desarrollo local, es localhost:3000.
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Instalar Dependencias
Este proyecto utiliza un script `postinstall` que ejecuta `prisma generate` automáticamente después de la instalación.

```bash
npm install
```
Al finalizar la instalación, deberías ver un mensaje que indica que el Cliente de Prisma se ha generado.

### 4. Configurar la Base de Datos
La primera vez que configures el proyecto, o cada vez que haya un cambio en el esquema de la base de datos, necesitarás ejecutar una migración.

```bash
npx prisma migrate dev
```
Este comando:
- Creará la base de datos SQLite (`dev.db`) si no existe.
- Aplicará todas las migraciones pendientes para crear las tablas.
- Asegurará que tu base de datos esté sincronizada con `prisma/schema.prisma`.

## 8.4. Ejecución del Proyecto

- **Iniciar el servidor de desarrollo:**
  ```bash
  npm run dev
  ```
  La aplicación estará disponible en `http://localhost:3000`. El servidor se recargará automáticamente cada vez que hagas un cambio en el código.

- **Crear un build de producción:**
  ```bash
  npm run build
  ```
  Este comando compila y optimiza la aplicación para producción. La salida se genera en la carpeta `.next`.

- **Ejecutar el build de producción:**
  ```bash
  npm run start
  ```
  Inicia un servidor de producción con la versión compilada.

## 8.5. Flujos de Trabajo Comunes

### Modificar el Modelo de Datos
El esquema de la base de datos se gestiona con Prisma. Sigue estos pasos para hacer un cambio:

1.  **Edita el esquema:** Abre `prisma/schema.prisma` y modifica los modelos (añade un campo, una tabla, etc.).
2.  **Crea una nueva migración:** Ejecuta el siguiente comando en tu terminal. Reemplaza `<nombre-descriptivo>` con una breve descripción del cambio.
    ```bash
    npx prisma migrate dev --name <nombre-descriptivo>
    ```
3.  **Verifica el Cliente de Prisma:** El cliente de Prisma debería actualizarse automáticamente gracias al script `postinstall`. Si por alguna razón necesitas hacerlo manualmente, ejecuta `npx prisma generate`.

### Añadir una Nueva Página UI
1.  Dentro de la carpeta `app`, crea una nueva carpeta con el nombre de la ruta (ej. `app/nuevo-modulo/`).
2.  Dentro de esa carpeta, crea un archivo `page.tsx`.
3.  Escribe tu componente de React en ese archivo. Next.js lo mapeará automáticamente a la URL `/nuevo-modulo`.

### Añadir un Nuevo Endpoint de API
1.  Dentro de `app/api`, crea una nueva carpeta para tu recurso (ej. `app/api/facturas/`).
2.  Dentro de esa carpeta, crea un archivo `route.ts`.
3.  Exporta funciones asíncronas con los nombres de los métodos HTTP que quieras manejar (`GET`, `POST`, `PUT`, `DELETE`).

    ```typescript
    import { NextResponse } from 'next/server';

    export async function GET(request: Request) {
      // Tu lógica aquí
      return NextResponse.json({ message: "Hola Mundo" });
    }
    ```

## 8.6. Convenciones de Código y Estilos

- **Lenguaje:** Utiliza **TypeScript** en todo el proyecto.
- **Formato y Calidad:** El código se formatea y valida con **ESLint**. Asegúrate de tener la extensión de ESLint en tu editor para ver los errores en tiempo real.
- **Estilos:** Se utiliza **Tailwind CSS**. Evita escribir CSS tradicional. En su lugar, utiliza las clases de utilidad de Tailwind directamente en tus componentes JSX. Para combinar clases de manera condicional, utiliza la utilidad `cn` de `lib/utils.ts`.
- **Componentes:**
    - Los componentes de UI atómicos y reutilizables (botones, inputs, etc.) van en `components/ui/`.
    - Los componentes más complejos y específicos de una sección (como `Sidebar.tsx`) van directamente en `components/`.
- **Commits:** Sigue un estilo de mensajes de commit convencional (ej. `feat: Añadir módulo de facturas`, `fix: Corregir error en cálculo de balance`).
