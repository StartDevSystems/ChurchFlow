# 7. Manual de Usuario

## 7.1. Introducción
Este manual describe las funcionalidades del Sistema de Gestión Financiera desde la perspectiva del usuario final y el administrador.

## 7.2. Mi Perfil Personal
Cada usuario tiene un espacio privado para gestionar su identidad:
1.  Haz clic en tu nombre o avatar en la parte inferior de la barra lateral.
2.  **Identidad:** Puedes actualizar tu nombre y apellido para que el resto del equipo te identifique correctamente.
3.  **Foto de Perfil:** Haz clic en "Cambiar Foto" para subir una imagen desde tu computadora. El sistema la optimizará automáticamente.
4.  **Seguridad:** Puedes cambiar tu contraseña de acceso en cualquier momento.

## 7.3. Panel de Control (Solo Administradores)
El cerebro del sistema se divide en pestañas estratégicas:

### General
*   Configura el **Nombre de la Iglesia** y el **Lema**.
*   Sube el **Logo Oficial** que aparecerá en los reportes y en el menú.

### Apariencia (Estilo Apple)
*   **Color de Marca:** Cambia el color de toda la aplicación (botones, resaltados, iconos) con un selector.
*   **Restablecer:** Botón para volver al naranja original de la sociedad.
*   **Modo Oscuro/Claro:** Cambia el tema visual de forma instantánea.

### Gestión de Equipo (Usuarios)
*   **Roles:** Asciende a un usuario a `ADMIN` o degrádalo a `USER` con un clic.
*   **Permisos Granulares (🔑):** Haz clic en la llave para decidir qué páginas puede ver cada usuario (Miembros, Transacciones, etc.).
*   **Seguridad:** Resetea la contraseña de un usuario si la olvida.
*   **Registro Público:** Interruptor para cerrar el registro de nuevas cuentas.

### Finanzas y Alertas
*   **Alertas Externas:** Configura un Webhook de Discord o Telegram para recibir avisos cuando se registren gastos grandes o el saldo de la caja sea bajo.

## 7.4. Gestión Financiera
*   **Transacciones:** Registro de ingresos y gastos con categorías. Puedes eliminar transacciones mal registradas usando el botón de la papelera (🗑️) al final de la fila. El sistema te pedirá confirmación antes de proceder.
*   **Transferencias:** Movimiento de capital entre la Caja General y Eventos. También se pueden eliminar individualmente desde la lista de movimientos.
*   **Eventos:** Creación de fondos específicos para actividades. Como administrador, puedes eliminar un evento completo; ten en cuenta que esto también borrará todas las transacciones vinculadas a ese evento.
*   **Reportes:** Generación de PDF profesionales con tu firma y logo configurados.

## 7.5. Directorio de Miembros
El sistema permite gestionar la base de datos de los jóvenes de forma ágil:
1.  **Carga Individual:** Botón "+ Nuevo Miembro" para registros únicos.
2.  **Importación Masiva (Pro):** 
    - Haz clic en "Bajar Plantilla" para obtener el formato de Excel correcto.
    - Llena los datos de los jóvenes en el archivo.
    - Haz clic en "Importar" y sube el archivo para registrar a todos de un golpe.
3.  **QR Único:** Cada miembro tiene un código QR generado automáticamente para control de asistencia rápida.
