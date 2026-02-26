# 1. Visión General del Sistema (v2.0)

## 1.1. Propósito Principal

El Sistema de Gestión Financiera es una aplicación web diseñada específicamente para la administración de las finanzas del ministerio de jóvenes de una iglesia. Su propósito es centralizar y simplificar el seguimiento de ingresos, gastos, y aportes de miembros, reemplazando métodos manuales como hojas de cálculo por una solución digital, segura y eficiente.

El sistema está concebido como una herramienta híbrida, ofreciendo tanto control manual completo a través de un dashboard intuitivo como la capacidad de automatizar tareas repetitivas, como la generación de reportes y copias de seguridad.

## 1.2. Objetivos Clave

- **Centralización:** Unificar toda la información financiera en una única base de datos accesible.
- **Claridad y Transparencia:** Proveer visualizaciones de datos claras para una rendición de cuentas honesta.
- **Eficiencia Administrativa:** Reducir el tiempo manual en la gestión de miembros y transacciones.
- **Escalabilidad (Visión v2.0+):** Evolucionar hacia un modelo **Federado Multi-Nivel (Multi-tenant)** que permita la gestión de estructuras eclesiásticas complejas (Sede Central > Zonas > Iglesias Locales).

## 1.3. La Gran Visión: ChurchFlow Network

El futuro de ChurchFlow no es solo una herramienta local, sino una **Plataforma Financiera Federada**. El objetivo es conectar todos los niveles de la organización en un ecosistema digital transparente:

1.  **Nivel Local (Actual):** Autonomía total para que cada iglesia maneje sus propios eventos, cuotas y finanzas diarias.
2.  **Nivel de Zona (Supervisión):** Un tablero de control para líderes de zona que permite monitorear el cumplimiento de cuotas anuales de las iglesias a su cargo, ver rankings de actividad y recibir transferencias digitales.
3.  **Nivel Central (La Cúpula):** Visión global del patrimonio de la asociación, gestión de fondos nacionales y auditoría macroeconómica de todas las zonas.
4.  **Wallet Digital Integrada:** Un sistema de "Carteras Virtuales" que permita mover capital de forma fluida y rastreable desde la iglesia local hacia la zona, y de la zona hacia la sede central, eliminando la opacidad y los errores manuales.

## 1.4. Funcionalidades Principales (v1.3.3)

El sistema se compone de varios módulos interconectados que cubren las áreas esenciales de la gestión financiera del ministerio:

- **Dashboard Principal:** Punto de entrada que ofrece un resumen visual del estado financiero, incluyendo totales, balance, gráficos de tendencias mensuales y de distribución por categoría.
- **Gestión de Miembros:** Permite crear, listar, editar y eliminar perfiles de los miembros del ministerio, almacenando datos básicos y su rol (Joven/Directiva).
- **Gestión de Transacciones:** Facilita el registro detallado de ingresos y gastos, con asignación a categorías, fechas y la posibilidad de asociarlos a un miembro o a un evento específico.
- **Gestión de Categorías:** Ofrece un panel de administración para crear, editar y eliminar dinámicamente las categorías de ingresos y gastos, asegurando la consistencia de los datos.
- **Seguimiento de Cuotas:** Un módulo visual que permite monitorear el progreso de los aportes de los miembros para metas financieras específicas (ej. "Cuota Anual").
- **Gestión de Eventos:** Permite crear eventos (ej. campamentos, actividades especiales) a los cuales se pueden asociar transacciones para llevar un control financiero por proyecto.
- **Transferencias entre Fondos (v2):** Permite mover dinero entre la Caja General y los fondos específicos de los eventos (o entre eventos), manteniendo la trazabilidad de los movimientos internos.
- **Reportes Financieros:** Herramienta para generar documentos PDF detallados que resumen la actividad financiera en un período determinado.
- **Autenticación y Seguridad:** Protege el acceso a la aplicación mediante un sistema de registro y login, con roles y permisos para distintos niveles de usuario.
- **Scripts de Automatización:** Tareas programadas que pueden ejecutarse para realizar copias de seguridad de la base de datos, generar reportes periódicos y recalcular balances.
