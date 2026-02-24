# 🗄️ Modelo de Datos - Versión 1.3 Pro

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

---

## Relaciones Clave
1. **Member -> Transactions**: Un miembro puede tener múltiples aportes (Ingresos) o gastos asociados.
2. **Event -> Transactions**: Permite la conciliación de fondos por actividad específica.
3. **User -> AuditLog**: Rastrea qué administrador realizó cada cambio en el sistema.
