# ⛪ ChurchFlow v1.3 Beta - Edición Pro

**ChurchFlow** es un ecosistema de gestión financiera y ministerial de alto rendimiento, diseñado específicamente para ministerios de jóvenes que buscan excelencia, transparencia y un impacto visual de élite.

## 🚀 Lo Nuevo en la Versión 1.3 Beta
Esta versión transforma el sistema de una simple base de datos a una **Plataforma de Inteligencia Ministerial**.

### 🏀 Ficha Técnica "ESPN Style" (Perfil Pro)
- **Visualización de Élite**: Inspirado en las fichas de atletas profesionales, cada miembro tiene un perfil dinámico con fondos de fibra de carbono y gradientes de alta intensidad.
- **KPIs de Rendimiento**: Seguimiento en tiempo real de:
  - **Aportación Total**: Dinero invertido en el ministerio.
  - **Score de Fidelidad**: Algoritmo que calcula la asistencia de los últimos 30 días.
  - **Rango Dinámico**: Basado en el cargo ministerial (Músico, Líder, Ujier, etc.).
- **Estado de Actividad**: Indicador tipo "semáforo" (Activo, Inactivo, Observación) con brillo LED.
- **Marquesina de Cumpleaños**: Tarjeta con movimiento (Marquee) integrada en el perfil.

### 🧮 Calculadora Bendecida
- **Personalización Total**: El administrador puede cambiar el nombre de la herramienta desde ajustes (ej: "Calculadora Santa", "Cuentas Claras").
- **Presupuesto Inteligente**: Herramienta responsiva para calcular cuotas por persona basadas en costos de eventos.

### 📊 Inteligencia de Datos (Estadísticas & Reportes)
- **Ranking de Impacto**: Top de aportantes con barras de progreso visuales.
- **Gráficas de Flujo**: Gráficos circulares tipo "Trading" para analizar la distribución de gastos.
- **Centro de Reportes Ejecutivo**: Generación de reportes financieros con KPIs gigantes y exportación a PDF/Excel.

### 🤖 Automatización y Notificaciones
- **Telegram Bot v2**: Comandos interactivos `/saldo`, `/gastos` y `/miembros` con alertas en tiempo real.
- **WhatsApp Direct Pro**: Botones inteligentes para enviar recordatorios de cuotas y felicitaciones de cumpleaños personalizadas con un clic.
- **Sistema de Auditoría**: Registro exhaustivo de quién hizo qué y cuándo (logs de seguridad).

---

## 🎨 El Sistema de Diseño: "Brutalismo de Élite"
Hemos adoptado un estilo visual único que combina la fuerza del diseño brutalista con la elegancia de las interfaces de análisis deportivo:

- **Paleta de Colores**:
  - `Rich Black (#0a0c14)`: Para una profundidad profesional.
  - `Church Orange (#e85d26)`: Color de identidad y energía.
  - `Success Green & Danger Red`: Con efectos de brillo LED para estados.
- **Geometría**: Bordes redondeados extremos (`rounded-[3rem]`) y bordes gruesos (`border-2` a `border-4`) para un look sólido.
- **Tipografía**: Títulos en mayúsculas, negrita extrema (`font-black`) e itálica para transmitir velocidad y dinamismo.

## 🛠️ Tecnologías Utilizadas
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion.
- **Backend**: Prisma ORM, PostgreSQL (Supabase).
- **Inteligencia**: Recharts (Gráficas), Lucide React (Iconografía Pro).
- **PWA**: Soporte para instalación como aplicación nativa en móviles.

---

## ⚠️ Nota Importante para Desarrolladores (Windows)
Debido al bloqueo de archivos de Windows en tiempo de ejecución, tras realizar cambios en el esquema de base de datos (`schema.prisma`), es obligatorio:
1. Detener el servidor (`Ctrl + C`).
2. Ejecutar `npx prisma generate`.
3. Reiniciar con `npm run dev`.

---
*Desarrollado con pasión para el Reino. q_q q_q q_q*
