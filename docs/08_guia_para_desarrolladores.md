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

## 5. Flujo de Trabajo Git (Git Workflow)
Para proteger la integridad del sistema en producción (rama `main`), todo desarrollo debe seguir este proceso:

1. **Ramas Separadas**: 
   - Para funcionalidades nuevas: `feature/nombre-de-la-funcionalidad`
   - Para arreglos de bugs: `fix/nombre-del-bug`
   - Para mejoras de rendimiento: `perf/nombre-de-la-mejora`
2. **Pull Requests (PR)**: Una vez finalizado el trabajo en la rama, se debe crear un PR hacia `main`.
3. **Validación Preview**: Vercel generará un entorno de Preview. El código debe probarse exhaustivamente en dispositivos móviles y de escritorio utilizando esta URL antes de realizar el "Merge".
4. **Merge & Limpieza**: Una vez aprobado y unido a `main`, la rama de trabajo debe ser eliminada para mantener el repositorio ordenado.

## 6. Rendimiento y Optimizaciones (Performance)
Al trabajar con un Dashboard cargado de datos y librerías de UI:
- **`useMemo` / `useCallback`**: Todo cálculo financiero complejo (recorrer arrays de transacciones, sumar ingresos/gastos, agrupar por mes) **debe** estar envuelto en `useMemo`. Esto previene *lags* durante el scroll o la interacción.
- **Scroll Táctil vs Drag-and-Drop**: Al implementar elementos arrastrables (como `dnd-kit`), es obligatorio configurar un `TouchSensor` con un *delay* (ej. 250ms) y tolerancia. Esto asegura que el usuario pueda hacer scroll en su celular sin activar accidentalmente el evento de arrastre.
- **Imágenes e Iconos**: Los *assets* estáticos importantes para la PWA deben estar en la raíz de `public/` y tener nombres estandarizados, en minúsculas y sin espacios (ej. `icon-512.jpeg`).
