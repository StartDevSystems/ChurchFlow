# 7. Manual de Usuario

## 7.1. Introducción

Bienvenido al manual de usuario del Sistema de Gestión Financiera. Esta guía está diseñada para ayudarte a utilizar todas las funcionalidades de la aplicación de manera sencilla y eficiente, desde el inicio de sesión hasta la generación de reportes.

## 7.2. Acceso al Sistema

### Iniciar Sesión
1.  Abre la aplicación en tu navegador. Serás dirigido a la página de inicio de sesión.
2.  Ingresa tu **correo electrónico** y **contraseña** en los campos correspondientes.
3.  Haz clic en el botón **"Iniciar Sesión"**.
4.  Si los datos son correctos, serás redirigido al **Dashboard Principal**.

### Registrar una Cuenta (si está habilitado)
1.  En la página de inicio de sesión, haz clic en el enlace que dice "¿No tienes una cuenta? Regístrate".
2.  Completa el formulario con tu **correo electrónico** y una **contraseña segura**.
3.  Haz clic en **"Registrar"**.
4.  Una vez registrado, serás redirigido para que puedas iniciar sesión.

## 7.3. El Dashboard Principal

El Dashboard es la primera pantalla que verás después de iniciar sesión. Te da un resumen completo del estado financiero del ministerio.

- **Tarjetas de Resumen:** En la parte superior, verás tres tarjetas que muestran:
    - **Total Ingresos:** La suma de todo el dinero que ha entrado.
    - **Total Gastos:** La suma de todo el dinero que ha salido.
    - **Balance Actual:** La diferencia entre ingresos y gastos.
- **Gráfico de Tendencia Mensual:** Este gráfico de líneas te muestra la evolución de los ingresos y gastos a lo largo de los últimos meses, permitiéndote identificar patrones.
- **Gráficos de Categorías:** Dos gráficos circulares (de pastel) te muestran de dónde provienen los ingresos y a dónde se destinan los gastos, desglosados por categoría.
- **Transacciones Recientes:** Una lista en la parte inferior te muestra los últimos movimientos financieros registrados.

## 7.4. Gestión de Miembros

Puedes acceder a este módulo desde el menú lateral (`Sidebar`).

### Ver la Lista de Miembros
- Al hacer clic en "Miembros" en el menú, verás una tabla con todos los miembros registrados, su nombre, teléfono y rol (Joven o Directiva).

### Crear un Nuevo Miembro
1.  En la página de Miembros, haz clic en el botón **"Crear Miembro"**.
2.  Se abrirá un formulario. Rellena el **nombre**, **teléfono** y selecciona el **rol** del nuevo miembro.
3.  Haz clic en **"Guardar Miembro"**. Serás redirigido a la lista, donde verás al nuevo miembro.

### Editar o Eliminar un Miembro
- En la lista de miembros, cada fila tiene dos botones a la derecha:
    - **Editar (icono de lápiz):** Te llevará a un formulario pre-llenado con los datos del miembro para que puedas modificarlos.
    - **Eliminar (icono de basura):** Te pedirá una confirmación antes de eliminar al miembro. **Nota:** No podrás eliminar a un miembro si tiene transacciones registradas a su nombre.

## 7.5. Gestión de Transacciones

Accede a este módulo desde el menú lateral.

### Ver y Filtrar Transacciones
- Al hacer clic en "Transacciones", verás una tabla con todos los movimientos.
- En la parte superior, puedes usar los botones **"Todas"**, **"Ingresos"** y **"Gastos"** para filtrar la lista y ver solo el tipo de transacción que te interesa.

### Crear una Nueva Transacción
1.  En la página de Transacciones, haz clic en el botón **"Crear Transacción"**.
2.  Completa el formulario:
    - **Tipo:** Selecciona si es un "Ingreso" o un "Gasto".
    - **Categoría:** Selecciona la categoría a la que pertenece (ej. "Ofrenda", "Transporte").
    - **Monto:** Ingresa el valor numérico.
    - **Fecha:** Selecciona la fecha en que ocurrió.
    - **Descripción:** Añade un texto descriptivo.
    - **Miembro (opcional):** Si la transacción está asociada a alguien, selecciónalo de la lista.
3.  Haz clic en **"Guardar Transacción"**.

### Editar o Eliminar una Transacción
- Al igual que con los miembros, cada transacción en la lista tiene botones para **Editar** y **Eliminar**.

## 7.6. Módulos de Administración

### Gestionar Categorías (`Admin > Categorías`)
- Esta sección te permite mantener organizadas las categorías de tus transacciones.
- Puedes **crear nuevas categorías** (ej. "Donación Especial"), especificando si son de ingreso o de gasto.
- Puedes **editar el nombre** de las categorías existentes o **eliminarlas** (solo si no están siendo usadas).

### Gestionar Eventos (`Eventos`)
- Este módulo te permite crear y administrar eventos especiales.
- **Crear un Evento:** Ve a la sección "Eventos" y haz clic en "Crear Evento". Define un nombre, descripción y fechas.
- **Asociar Transacciones:** Al crear una nueva transacción, ahora tendrás un campo opcional para asociarla a un evento existente. Esto te permitirá luego filtrar y ver las finanzas de un evento en particular.

## 7.7. Generación de Reportes

1.  Ve a la sección **"Reportes"** en el menú lateral.
2.  Selecciona una **fecha de inicio** y una **fecha de fin** utilizando los calendarios.
3.  Haz clic en el botón **"Generar Reporte"**.
4.  La pantalla mostrará un resumen de los totales y una tabla con todas las transacciones en ese período.
5.  Puedes descargar este reporte como un archivo **PDF** haciendo clic en el botón **"Descargar PDF"**.

## 7.8. Seguimiento de Cuotas

- Ve a la sección **"Cuotas"** en el menú.
- Esta página te muestra una lista de todos los miembros y una **barra de progreso** que indica cuánto han aportado a la categoría "Cuota" en relación a una meta predefinida. Es una forma visual y rápida de saber quién está al día con sus aportes.
