# 🎨 Guía de Estilo y Filosofía de Diseño

ChurchFlow v1.3 ha evolucionado hacia una estética **"Sport-Brutalist"**. Esta guía define las reglas para mantener la coherencia en futuras actualizaciones.

## 1. Tipografía y Textos
- **Títulos de Impacto**: Clase `font-black uppercase italic tracking-tighter`. Se utiliza para nombres de miembros y encabezados de página.
- **Etiquetas (Labels)**: Clase `text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500`. Siempre en mayúsculas y muy espaciadas.
- **Números Financieros**: Clase `font-black italic tracking-tighter`. Deben resaltar por encima de los textos descriptivos.

## 2. Componentes de UI
### Tarjetas (Cards)
- **Radio de Borde**: Se prefiere `rounded-[2.5rem]` o `rounded-[3rem]`.
- **Fondos**: `bg-[#13151f]` (Gris azulado oscuro) para contraste con el fondo total `bg-[#0a0c14]`.
- **Bordes**: `border-2 border-white/5` para un look sutil o `border-[var(--brand-primary)]` para destacar elementos activos.

### Botones Pro
- **Normal**: Bordes redondeados `rounded-2xl`, letra pequeña y pesada.
- **Acción (Save/Edit)**: Deben tener sombras intensas (`shadow-2xl`) y efectos de hover que cambien el brillo.

## 3. Efectos Especiales (Framer Motion)
- **Marquee**: Se utiliza para los cumpleaños. Velocidad constante de `duration: 10`.
- **Pulse/LED**: Los estados activos deben tener un pequeño punto circular con sombra `shadow-[0_0_8px_#color]`.

## 4. Estructura de Páginas
Todas las páginas deben seguir este flujo vertical:
1. **Hero Header**: Título gigante + Descripción corta + Botones de acción rápida.
2. **KPI Row**: 3 o 4 tarjetas con los números más importantes de la página.
3. **Main Content**: Grid de columnas donde la principal ocupa el 60-70% del ancho.
