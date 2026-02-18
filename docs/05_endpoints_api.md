# 5. Endpoints de la API

## 5.1. Visión General

La API del sistema está construida siguiendo los principios de REST y se encuentra completamente dentro del directorio `app/api/`. Todos los endpoints están protegidos y requieren una sesión de usuario válida, gestionada por NextAuth.js. La autenticación se verifica en cada solicitud.

A continuación se documenta cada endpoint, agrupado por recurso.

---

## 5.2. Autenticación (`/api/auth`)

Estos endpoints son gestionados automáticamente por **NextAuth.js**.

- **`POST /api/auth/callback/[provider]`**: Maneja el callback de los proveedores de OAuth.
- **`GET /api/auth/session`**: Devuelve la sesión del usuario actual. Es muy utilizado en el frontend para verificar si el usuario está logueado.
- **`POST /api/auth/signin/[provider]`**: Inicia el flujo de inicio de sesión.
- **`POST /api/auth/signout`**: Cierra la sesión del usuario.
- **`GET /api/auth/providers`**: Devuelve la lista de proveedores de autenticación configurados.
- **`GET /api/auth/error`**: Página a la que se redirige en caso de un error de autenticación.

---

## 5.3. Registro de Usuarios (`/api/register`)

### `POST /api/register`
- **Descripción:** Registra un nuevo usuario en el sistema.
- **Request Body:**
  ```json
  {
    "email": "nuevo.usuario@ejemplo.com",
    "password": "una-contraseña-segura"
  }
  ```
- **Respuestas:**
  - **`201 Created`**: Devuelve el objeto del nuevo usuario (sin la contraseña).
  - **`400 Bad Request`**: Si faltan el email o la contraseña.
  - **`409 Conflict`**: Si ya existe un usuario con ese email.
  - **`500 Internal Server Error`**: Si falla el registro por un error del servidor.

---

## 5.4. Miembros (`/api/members`)

### `GET /api/members`
- **Descripción:** Obtiene una lista de todos los miembros. Permite filtrar por rol.
- **Query Params (opcional):** `?role=Joven` o `?role=Directiva`.
- **Respuesta `200 OK`:**
  ```json
  [
    {
      "id": "uuid-del-miembro",
      "name": "Nombre del Miembro",
      "phone": "123456789",
      "role": "Joven",
      "createdAt": "2026-02-15T12:00:00.000Z"
    }
  ]
  ```

### `POST /api/members`
- **Descripción:** Crea un nuevo miembro.
- **Request Body:**
  ```json
  {
    "name": "Nuevo Miembro",
    "phone": "987654321",
    "role": "Joven"
  }
  ```
- **Respuesta `201 Created`**: Devuelve el objeto del miembro recién creado.

### `GET /api/members/[id]`
- **Descripción:** Obtiene los detalles de un miembro específico por su ID.
- **Respuesta `200 OK`**: Devuelve el objeto del miembro, incluyendo una lista de sus transacciones asociadas.

### `PUT /api/members/[id]`
- **Descripción:** Actualiza los datos de un miembro específico.
- **Request Body:**
  ```json
  {
    "name": "Nombre Actualizado",
    "phone": "111222333",
    "role": "Directiva"
  }
  ```
- **Respuesta `200 OK`**: Devuelve el objeto del miembro actualizado.

### `DELETE /api/members/[id]`
- **Descripción:** Elimina un miembro. Falla si el miembro tiene transacciones asociadas para mantener la integridad de los datos.
- **Respuestas:**
  - **`204 No Content`**: Si se elimina con éxito.
  - **`409 Conflict`**: Si el miembro tiene transacciones y no puede ser eliminado.

---

## 5.5. Categorías (`/api/categories`)

### `GET /api/categories`
- **Descripción:** Obtiene una lista de todas las categorías. Permite filtrar por tipo.
- **Query Params (opcional):** `?type=income` o `?type=expense`.
- **Respuesta `200 OK`**:
  ```json
  [
    {
      "id": "uuid-de-categoria",
      "name": "Ofrenda",
      "type": "income"
    }
  ]
  ```

### `POST /api/categories`
- **Descripción:** Crea una nueva categoría.
- **Request Body:**
  ```json
  {
    "name": "Transporte",
    "type": "expense"
  }
  ```
- **Respuesta `201 Created`**: Devuelve el objeto de la categoría recién creada.

### `PUT /api/categories/[id]`
- **Descripción:** Actualiza el nombre de una categoría específica.
- **Request Body:**
  ```json
  {
    "name": "Transporte y Viáticos"
  }
  ```
- **Respuesta `200 OK`**: Devuelve el objeto de la categoría actualizada.

### `DELETE /api/categories/[id]`
- **Descripción:** Elimina una categoría. Falla si la categoría está siendo utilizada por alguna transacción.
- **Respuestas:**
  - **`204 No Content`**: Si se elimina con éxito.
  - **`409 Conflict`**: Si la categoría está en uso.

---

## 5.6. Transacciones (`/api/transactions`)

### `GET /api/transactions`
- **Descripción:** Obtiene una lista de todas las transacciones. Permite filtrar por tipo.
- **Query Params (opcional):** `?type=income` o `?type=expense`.
- **Respuesta `200 OK`**: Devuelve un array de objetos de transacción, incluyendo los objetos anidados de `member` y `category`.

### `POST /api/transactions`
- **Descripción:** Crea una nueva transacción.
- **Request Body:**
  ```json
  {
    "type": "income",
    "categoryId": "uuid-de-categoria",
    "amount": 50.00,
    "date": "2026-02-15T10:00:00.000Z",
    "description": "Ofrenda del domingo",
    "memberId": "uuid-del-miembro" // Opcional
  }
  ```
- **Respuesta `201 Created`**: Devuelve el objeto de la transacción recién creada.

### `GET /api/transactions/[id]`
- **Descripción:** Obtiene los detalles de una transacción específica.
- **Respuesta `200 OK`**: Devuelve el objeto de la transacción.

### `PUT /api/transactions/[id]`
- **Descripción:** Actualiza una transacción existente.
- **Request Body:** Similar al `POST`, con todos los campos a actualizar.
- **Respuesta `200 OK`**: Devuelve el objeto de la transacción actualizada.

### `DELETE /api/transactions/[id]`
- **Descripción:** Elimina una transacción de forma permanente.
- **Respuesta `204 No Content`**: Si se elimina con éxito.

### `POST /api/transactions/report`
- **Descripción:** Genera los datos para un reporte financiero en un rango de fechas.
- **Request Body:**
  ```json
  {
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-31T23:59:59.999Z"
  }
  ```
- **Respuesta `200 OK`**: Devuelve un objeto con la lista de transacciones en ese rango y los totales calculados (`totalIncome`, `totalExpenses`, `balance`).

---

## 5.7. Eventos (`/api/events`)

### `GET /api/events`
- **Descripción:** Obtiene una lista de todos los eventos.
- **Respuesta `200 OK`**: Devuelve un array de objetos de evento.

### `POST /api/events`
- **Descripción:** Crea un nuevo evento.
- **Request Body:**
  ```json
  {
    "name": "Campamento de Verano 2026",
    "description": "Campamento anual de jóvenes.",
    "startDate": "2026-07-15T00:00:00.000Z",
    "endDate": "2026-07-18T23:59:59.999Z" // Opcional
  }
  ```
- **Respuesta `201 Created`**: Devuelve el objeto del evento recién creado.

### `GET /api/events/[id]`
- **Descripción:** Obtiene los detalles de un evento específico.
- **Respuesta `200 OK`**: Devuelve el objeto del evento.

### `PUT /api/events/[id]`
- **Descripción:** Actualiza un evento existente.
- **Request Body:** Similar al `POST`, con los campos a actualizar.
- **Respuesta `200 OK`**: Devuelve el objeto del evento actualizado.

### `DELETE /api/events/[id]`
- **Descripción:** Elimina un evento. Falla si el evento tiene transacciones asociadas.
- **Respuestas:**
  - **`204 No Content`**: Si se elimina con éxito.
  - **`409 Conflict`**: Si el evento tiene transacciones y no puede ser eliminado.

---

## 5.8. Endpoints de Lógica de Negocio

### `GET /api/dues`
- **Descripción:** Endpoint especializado para la página de "Cuotas". Devuelve una lista de todos los miembros junto con el total que han contribuido en transacciones cuya categoría es "Cuota".
- **Respuesta `200 OK`**:
  ```json
  [
    {
      "id": "uuid-del-miembro",
      "name": "Nombre del Miembro",
      "phone": "123456789",
      "role": "Joven",
      "totalContributed": 120.50
    }
  ]
  ```

### `GET /api/stats`
- **Descripción:** Endpoint para la página de "Estadísticas". Procesa todas las transacciones y las agrupa por miembro, calculando el total de ingresos, total de gastos, balance neto y un desglose mensual para cada uno.
- **Respuesta `200 OK`**: Devuelve una estructura de datos compleja con las estadísticas financieras de cada miembro.
