# 6. Reglas de Negocio

## 6.1. Visión General

Este documento describe las reglas y lógicas fundamentales que gobiernan el comportamiento del sistema. Estas reglas aseguran la integridad de los datos, la consistencia de los cálculos financieros y el funcionamiento correcto de los procesos de negocio.

## 6.2. Reglas de Integridad de Datos

Estas reglas se aplican a nivel de la base de datos y la API para prevenir la creación de datos inconsistentes o la eliminación de registros que afecten la historia financiera.

- **Unicidad de Usuario:** Cada `User` debe tener un `email` único en todo el sistema. No se pueden registrar dos usuarios con el mismo correo electrónico.

- **Unicidad de Categoría:** Una `Category` debe ser única para su tipo (`income` o `expense`). Se puede tener una categoría "Varios" para ingresos y otra "Varios" para gastos, pero no se pueden tener dos categorías "Varios" para ingresos.

- **Asociación Obligatoria de Categoría:** Toda `Transaction` debe estar obligatoriamente asociada a una `Category`. El sistema no permite transacciones sin categoría.

- **Protección contra Eliminación (Miembros):** Un `Member` no puede ser eliminado si tiene una o más transacciones asociadas. Primero se deben eliminar o reasignar las transacciones de ese miembro.

- **Protección contra Eliminación (Categorías):** Una `Category` no puede ser eliminada si está siendo utilizada por una o más transacciones. Esto previene que queden transacciones "huérfanas" sin una categorización válida.

- **Protección contra Eliminación (Eventos):** Un `Event` no puede ser eliminado si tiene transacciones asociadas. Esto asegura que el registro financiero de un evento permanezca intacto.

## 6.3. Reglas de Lógica Financiera

- **Balance por Eventos:** El sistema permite la separación financiera por proyectos. Las transacciones asociadas a un `Event` no afectan el balance del "Fondo General". Cada evento mantiene su propia contabilidad interna de ingresos y gastos.
- **Fondo General:** Se define como todas aquellas transacciones que no tienen un `eventId` asociado (`eventId == null`). El Dashboard principal refleja exclusivamente los movimientos del Fondo General para evitar mezclar presupuestos ordinarios con actividades especiales.

- **Definición de "Cuota":** Para el módulo de seguimiento de cuotas, una contribución se cuenta si y solo si es una transacción de tipo `income` y pertenece a la categoría cuyo nombre es exactamente `"Cuota"`. Cualquier otra variación en el nombre no será considerada.

- **Cálculo de Estadísticas por Miembro:** La página de estadísticas por miembro calcula tres métricas principales para cada uno:
    1.  **Total de Aportes:** La suma de todas las transacciones de tipo `income` asociadas a ese miembro.
    2.  **Total de Gastos:** La suma de todas las transacciones de tipo `expense` asociadas a ese miembro.
    3.  **Balance Neto:** La diferencia entre `Total de Aportes` y `Total de Gastos` para ese miembro.

## 6.4. Reglas de Validación de Entradas (API)

- **Creación de Transacciones:** Para registrar una nueva transacción, los siguientes campos son obligatorios en la solicitud a la API: `type`, `categoryId`, `amount`, `date`, y `description`.
- **Tipo de Transacción Válido:** El campo `type` de una transacción solo puede aceptar los valores `income` o `expense`. Cualquier otro valor será rechazado.
- **Campos Obligatorios:** Al crear o actualizar registros (miembros, eventos, categorías), se valida la presencia de campos clave como `name` o `startDate` a nivel de la API.

## 6.5. Reglas de Autenticación y Autorización

- **Acceso Protegido:** Todos los endpoints de la API, con la excepción de `/api/register` y los endpoints públicos de NextAuth (`/api/auth/*`), requieren que el solicitante presente un token de sesión válido. Las solicitudes no autenticadas recibirán una respuesta `401 Unauthorized`.
- **Roles de Usuario:** El sistema define un campo `role` en el modelo `User` (ej. "USER", "ADMIN"). Aunque el mecanismo existe, la lógica de autorización detallada (ej. "solo los ADMIN pueden eliminar categorías") aún no está completamente implementada a nivel de API. Actualmente, la protección se basa principalmente en si el usuario está logueado o no.
