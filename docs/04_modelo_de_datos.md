# 4. Modelo de Datos

## 4.1. Esquema de Prisma
El sistema utiliza **Supabase (PostgreSQL)** como motor de persistencia. A continuación se detallan los modelos principales.

### User (Usuarios del Sistema)
Gestiona el acceso y la identidad.
- `id`: Identificador único.
- `email`: Correo electrónico (único).
- `firstName` / `lastName`: Nombre y apellido reales.
- `image`: Foto de perfil en formato Base64.
- `role`: Nivel de acceso (`ADMIN` o `USER`).
- `permissions`: Objeto JSON con permisos específicos de visualización.

### Settings (Configuración Global)
Almacena las preferencias de la iglesia.
- `churchName`: Nombre oficial.
- `churchSubtitle`: Lema o ubicación.
- `logoUrl`: Imagen oficial de la marca.
- `primaryColor`: Color de énfasis en formato HEX.
- `currencySymbol`: Símbolo monetario (ej. RD$).
- `lowBalanceAlert`: Umbral para alertas de saldo bajo.

### Member (Miembros del Ministerio)
- `name`: Nombre completo.
- `phone`: Contacto.
- `role`: Rol eclesiástico (ej. Joven, Líder).

### Transaction (Movimientos Financieros)
- `type`: `income` (Ingreso) o `expense` (Gasto).
- `amount`: Monto numérico.
- `date`: Fecha del movimiento.
- `categoryId`: Relación con la categoría.
- `memberId`: (Opcional) Miembro vinculado.
- `eventId`: (Opcional) Evento vinculado (Fondo separado).

### Event (Eventos/Campamentos)
Actúan como fondos independientes con su propio balance.
