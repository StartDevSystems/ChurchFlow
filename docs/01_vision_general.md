# 1. Visión General del Sistema

## 1.1. Propósito Principal

El Sistema de Gestión Financiera es una aplicación web diseñada específicamente para la administración de las finanzas del ministerio de jóvenes de una iglesia. Su propósito es centralizar y simplificar el seguimiento de ingresos, gastos, y aportes de miembros, reemplazando métodos manuales como hojas de cálculo por una solución digital, segura y eficiente.

El sistema está concebido como una herramienta híbrida, ofreciendo tanto control manual completo a través de un dashboard intuitivo como la capacidad de automatizar tareas repetitivas, como la generación de reportes y copias de seguridad.

## 1.2. Objetivos Clave

- **Centralización:** Unificar toda la información financiera (miembros, transacciones, eventos, cuotas) en una única base de datos accesible.
- **Claridad y Transparencia:** Proveer visualizaciones de datos claras a través de un dashboard principal que muestra el estado financiero de un vistazo (ingresos, gastos, balance).
- **Eficiencia Administrativa:** Simplificar la gestión de miembros y el registro de transacciones, reduciendo el tiempo y el esfuerzo manual.
- **Generación de Reportes:** Facilitar la rendición de cuentas mediante la generación automática de reportes financieros en formato PDF, filtrados por rangos de fecha.
- **Flexibilidad:** Permitir un manejo tanto manual como automatizado de procesos clave, adaptándose a las necesidades del equipo de tesorería.
- **Escalabilidad:** Estar preparado técnicamente para una futura expansión que podría incluir la gestión de múltiples iglesias o ministerios (modelo SaaS).

## 1.3. Funcionalidades Principales

El sistema se compone de varios módulos interconectados que cubren las áreas esenciales de la gestión financiera del ministerio:

- **Dashboard Principal:** Punto de entrada que ofrece un resumen visual del estado financiero, incluyendo totales, balance, gráficos de tendencias mensuales y de distribución por categoría.
- **Gestión de Miembros:** Permite crear, listar, editar y eliminar perfiles de los miembros del ministerio, almacenando datos básicos y su rol (Joven/Directiva).
- **Gestión de Transacciones:** Facilita el registro detallado de ingresos y gastos, con asignación a categorías, fechas y la posibilidad de asociarlos a un miembro o a un evento específico.
- **Gestión de Categorías:** Ofrece un panel de administración para crear, editar y eliminar dinámicamente las categorías de ingresos y gastos, asegurando la consistencia de los datos.
- **Seguimiento de Cuotas:** Un módulo visual que permite monitorear el progreso de los aportes de los miembros para metas financieras específicas (ej. "Cuota Anual").
- **Gestión de Eventos:** Permite crear eventos (ej. campamentos, actividades especiales) a los cuales se pueden asociar transacciones para llevar un control financiero por proyecto.
- **Reportes Financieros:** Herramienta para generar documentos PDF detallados que resumen la actividad financiera en un período determinado.
- **Autenticación y Seguridad:** Protege el acceso a la aplicación mediante un sistema de registro y login, con roles y permisos para distintos niveles de usuario.
- **Scripts de Automatización:** Tareas programadas que pueden ejecutarse para realizar copias de seguridad de la base de datos, generar reportes periódicos y recalcular balances.
