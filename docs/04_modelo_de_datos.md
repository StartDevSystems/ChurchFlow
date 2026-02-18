# 4. Modelo de Datos (Prisma)

## 4.1. Descripción General

El modelo de datos es el corazón de la aplicación y define la estructura de la información que se almacena. Se gestiona a través del ORM **Prisma**, que actúa como una capa de abstracción sobre la base de datos **SQLite**.

El esquema completo está definido en el archivo `prisma/schema.prisma`. A continuación, se detalla cada uno de los modelos y sus relaciones.

## 4.2. Configuración del Proveedor

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}
```

- **`datasource`**: Se define el tipo de base de datos a utilizar (`sqlite`) y la ruta al archivo que la contiene (`dev.db`).
- **`generator`**: Se especifica que se debe generar el **Prisma Client** en JavaScript/TypeScript, que es el cliente que la aplicación utiliza para realizar las consultas.

## 4.3. Modelos de Datos

### `User`
Representa a un usuario que puede acceder al sistema. Es fundamental para la autenticación y autorización.

```prisma
model User {
  id       String @id @default(uuid())
  email    String @unique
  password String
  role     String @default("USER") // ADMIN, USER, etc.
}
```
- **`id`**: Identificador único universal (UUID).
- **`email`**: Correo electrónico del usuario, utilizado para el login. Debe ser único.
- **`password`**: Hash de la contraseña del usuario.
- **`role`**: Rol del usuario dentro del sistema (ej. "USER", "ADMIN"), para gestionar permisos.

### `Member`
Representa a un miembro del ministerio de jóvenes.

```prisma
model Member {
  id           String        @id @default(uuid())
  name         String
  phone        String
  role         String        @default("Joven") // "Joven" or "Directiva"
  createdAt    DateTime      @default(now())
  transactions Transaction[]
}
```
- **`id`**: Identificador único.
- **`name`**: Nombre completo del miembro.
- **`phone`**: Número de teléfono.
- **`role`**: Rol del miembro dentro del ministerio ("Joven" o "Directiva").
- **`createdAt`**: Fecha y hora de creación del registro.
- **`transactions`**: Relación uno a muchos. Un miembro puede tener múltiples transacciones asociadas.

### `Category`
Representa las categorías a las que puede pertenecer una transacción (ej. "Ofrenda", "Venta de Comida", "Transporte").

```prisma
model Category {
  id           String        @id @default(uuid())
  name         String
  type         TransactionType // 'income' or 'expense'
  transactions Transaction[]

  @@unique([name, type])
}
```
- **`id`**: Identificador único.
- **`name`**: Nombre de la categoría.
- **`type`**: Asocia la categoría a un tipo de transacción (`income` o `expense`).
- **`transactions`**: Relación uno a muchos. Una categoría puede tener múltiples transacciones.
- **`@@unique([name, type])`**: Define una restricción única compuesta. No puede haber dos categorías con el mismo nombre y el mismo tipo.

### `Transaction`
Es el modelo central de la aplicación. Representa cualquier movimiento financiero, ya sea un ingreso o un gasto.

```prisma
model Transaction {
  id          String   @id @default(uuid())
  type        TransactionType
  amount      Float
  date        DateTime
  description String
  
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])

  memberId    String?
  member      Member?  @relation(fields: [memberId], references: [id])
  
  eventId     String?
  event       Event?   @relation(fields: [eventId], references: [id])

  createdAt   DateTime @default(now())
}
```
- **`id`**: Identificador único.
- **`type`**: Tipo de transacción, definido por el enum `TransactionType`.
- **`amount`**: Monto de la transacción.
- **`date`**: Fecha en que se realizó la transacción.
- **`description`**: Descripción detallada de la transacción.
- **Relaciones:**
    - **`category`**: Relación muchos a uno. Cada transacción **debe** pertenecer a una `Category`. `categoryId` es la clave foránea.
    - **`member`**: Relación muchos a uno opcional. Una transacción **puede** estar asociada a un `Member`.
    - **`event`**: Relación muchos a uno opcional. Una transacción **puede** estar asociada a un `Event`.

### `Event`
Representa una actividad o proyecto específico que puede tener sus propias finanzas asociadas (ej. "Campamento 2026").

```prisma
model Event {
  id           String        @id @default(uuid())
  name         String
  description  String?
  startDate    DateTime
  endDate      DateTime?
  createdAt    DateTime      @default(now())
  transactions Transaction[]
}
```
- **`id`**: Identificador único.
- **`name`**: Nombre del evento.
- **`description`**: Descripción opcional.
- **`startDate` / `endDate`**: Fechas de inicio y fin del evento.
- **`transactions`**: Relación uno a muchos. Un evento puede tener múltiples transacciones asociadas.

## 4.4. Enums

### `TransactionType`
Define los dos tipos posibles de transacciones en el sistema.

```prisma
enum TransactionType {
  income
  expense
}
```
- **`income`**: Ingreso de dinero.
- **`expense`**: Gasto de dinero.
