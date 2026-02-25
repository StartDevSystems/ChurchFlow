# ⛪ ChurchFlow v1.3.3 - Edición Pro

**ChurchFlow** es un ecosistema de gestión financiera y ministerial de alto rendimiento, diseñado específicamente para ministerios de jóvenes que buscan excelencia, transparencia y un impacto visual de élite.

## 🚀 Lo Nuevo en la Versión 1.3.3 (Sport-Brutalist Update)
Esta versión consolida el sistema con un enfoque en rendimiento extremo y una experiencia de usuario de nivel "Fintech".

### 🎥 Modo Presentación "En Vivo" (Cine Contable)
- **Visualización Futurista**: Nueva pantalla completa diseñada para proyectar en asambleas con fondo negro profundo y rejilla neón.
- **Números Animados**: El balance total y los KPIs cuentan con animación de "Count Up" al cargar.
- **Flujo en Tiempo Real**: Reloj digital integrado y lista de movimientos recientes con transiciones suaves.

### 📜 Reportes de Élite
- **PDF Profesional**: Generación de documentos oficiales con bloques de diseño, tablas minimalistas y sello digital de seguridad.
- **WhatsApp Infographic**: Generador de infografías visuales optimizadas para "captures" y botón de envío de texto directo con resumen del mes.

### 🏎️ Rendimiento y UX Pro
- **Lag-Free Dashboard**: Implementación de `useMemo` para cálculos financieros masivos y optimización de renderizado.
- **Móvil Primero**: Login 100% responsivo y scroll inteligente en móviles (delay de 250ms en Drag-and-Drop para liberar el desplazamiento vertical).
- **Fix Visual**: Eliminación total del parpadeo del Sidebar al entrar o salir del sistema.

### 🛠️ Control Administrativo Total
- **Borrón y Cuenta Nueva**: Poder de borrado en cascada para eventos (limpia transacciones, asistencias y transferencias automáticamente).
- **Corrección de Errores**: Botón de eliminación individual para transacciones y transferencias con doble confirmación.
- **Importación Masiva**: Sistema recuperado de carga de miembros vía Excel con plantilla oficial descargable.

### 🍏 Optimización Apple (iOS)
- **PWA Pro**: Integración de `apple-touch-icon` y estandarización de assets para que el logo de la iglesia se vea nítido en el Home de cualquier iPhone.

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
