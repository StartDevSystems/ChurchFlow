# 🗄️ Modelo de Datos - Versión 1.5.1

El sistema utiliza una arquitectura de datos relacional optimizada para auditoría y análisis de rendimiento.

## Entidades Principales

### 👤 Member (Miembro)
Representa a los jóvenes y líderes del ministerio.
- `position`: (String) Cargo ministerial (ej: Músico, Adorador, Ujier). Sustituye visualmente al "Rango".
- `status`: (String) Estado de actividad: `ACTIVO`, `INACTIVO`, `OBSERVACION`.
- `birthDate`: (DateTime) Fecha de nacimiento para el sistema de alertas y marquesina.
- `monthlyDue`: (Float) Compromiso financiero mensual sugerido.
- `image`: (String/Base64) Foto de perfil de alta resolución.

### ⚙️ Settings (Configuración Global)
Un registro único con `id: 'system-settings'`.
- `calculatorName`: (String) Nombre personalizado para la herramienta de presupuestos (ej: "Calculadora Bendecida").
- `primaryColor`: (String) Color Hex que define la identidad visual del sistema.
- `whatsappMessageTemplate`: (String) Plantilla dinámica para recordatorios automáticos.
- `lowBalanceAlert`: (Float) Umbral para notificaciones de fondos bajos.

### 🛡️ AuditLog (Auditoría)
Registro automático de todas las acciones sensibles.
- `action`: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`.
- `entity`: Tabla afectada (Member, Transaction, etc.).
- `details`: Descripción humana de la acción.

### 📅 Attendance (Asistencia)
Vinculado a `Member` y `Event`.
- Utilizado para calcular el **Score de Fidelidad** en el Perfil Pro.

### 💸 Transfer (Transferencia)
Movimiento interno de fondos entre Caja General y Eventos.
- `amount`: (Float) Monto transferido.
- `description`: (String) Descripción clara del movimiento (ej: "Se destinaron RD$2,000 de caja para completar la ofrenda del predicador").
- `date`: (DateTime) Fecha del movimiento.
- `fromEventId`: (String?) ID del evento origen. `null` = Caja General.
- `toEventId`: (String?) ID del evento destino. `null` = Caja General.

**Regla:** No debe existir una transferencia donde ambos campos sean `null` (Caja→Caja no tiene sentido).

### 🛒 SaleProduct (Producto de Venta)
Catálogo de productos para eventos tipo VENTA.
- `eventId`: (String) Evento al que pertenece.
- `name`: (String) Nombre del producto.
- `price`: (Float) Precio unitario.
- `unitDescription`: (String?) Descripción de la unidad (ej: "por paquete").

### 🧾 SaleEntry (Registro de Venta)
Venta individual a un cliente en un evento tipo VENTA.
- `eventId`: (String) Evento de la venta.
- `clientName`: (String) Nombre del cliente.
- `amountPaid`: (Float) Monto pagado.
- `paymentStatus`: (String) `PENDIENTE`, `PARCIAL`, `PAGADO`.
- `items`: Relación a `SaleEntryItem[]` (productos y cantidades).

---

## Relaciones Clave
1. **Member -> Transactions**: Un miembro puede tener múltiples aportes (Ingresos) o gastos asociados.
2. **Event -> Transactions**: Permite la conciliación de fondos por actividad específica.
3. **Event -> Transfers**: Un evento puede recibir fondos de Caja (toEventId) o enviar fondos a Caja (fromEventId).
4. **Event -> SaleProducts -> SaleEntries**: Eventos tipo VENTA tienen catálogo de productos y registros de ventas.
5. **User -> AuditLog**: Rastrea qué administrador realizó cada cambio en el sistema.

## Flujo Financiero
```
Caja General (eventId = null)
├── Ingresos: Aportes, Cuotas, Ventas externas
├── Gastos: Operativos, Donaciones, Materiales
└── Transferencias ←→ Eventos
    ├── Caja → Evento: Asignar presupuesto
    └── Evento → Caja: Trasladar ganancia

Evento (eventId = UUID)
├── Ingresos directos: Aportes específicos para el evento
├── Gastos: Inversiones, compras del evento
└── Transferencias: Recibe de Caja o devuelve a Caja
```
