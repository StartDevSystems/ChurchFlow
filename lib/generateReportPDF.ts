import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

export const C = {
  black:       [10,  12,  20]  as [number,number,number],
  white:       [255, 255, 255] as [number,number,number],
  orange:      [255, 107, 26]  as [number,number,number],
  orangeLight: [255, 237, 213] as [number,number,number],
  gray900:     [18,  20,  32]  as [number,number,number],
  gray600:     [80,  85,  110] as [number,number,number],
  gray300:     [180, 185, 200] as [number,number,number],
  gray100:     [240, 241, 245] as [number,number,number],
  green:       [16,  185, 129] as [number,number,number],
  greenLight:  [209, 250, 229] as [number,number,number],
  red:         [239, 68,  68]  as [number,number,number],
  redLight:    [254, 226, 226] as [number,number,number],
  blue:        [37,  99,  235] as [number,number,number],
  blueLight:   [219, 234, 254] as [number,number,number],
  purple:      [139, 92,  246] as [number,number,number],
  purpleLight: [237, 233, 254] as [number,number,number],
};

export interface ReportCategory {
  name: string;
  total: number;
  type: string;
}

export interface ReportTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  eventId?: string | null;
  category?: { name: string } | null;
  event?: { name: string } | null;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export interface ReportActivity {
  id: string;
  name: string;
  type: string;
  status: string;
  investment: number | null;
  salesGoal: number | null;
  income: number;
  expense: number;
  profit: number;
  txCount: number;
  startDate?: string;
}

export interface TransferDetail {
  amount: number;
  description: string;
  date: string;
  from: string;
  to: string;
}

export interface CajaSummary {
  income: number;
  expense: number;
  balance: number;
  transfers?: number;
  categories?: { name: string; total: number; type: string }[];
  transferDetails?: TransferDetail[];
}

export interface TrendPoint {
  month: string;
  income: number;
  expense: number;
}

export interface ReportData {
  transactions: ReportTransaction[];
  categories: ReportCategory[];
  summary: ReportSummary;
}

export interface ReportSettings {
  churchName?: string;
  churchSubtitle?: string;
  reportSignatureName?: string;
  signatureUrl?: string;
  reportFooterText?: string;
}

interface GeneratePDFParams {
  data: ReportData;
  settings: ReportSettings | null;
  range: { from: string; to: string };
  caja?: CajaSummary | null;
  activities?: ReportActivity[];
  trend?: TrendPoint[];
}

export async function generateReportPDF({ data, settings, range, caja, activities = [], trend = [] }: GeneratePDFParams) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();
  const H   = doc.internal.pageSize.getHeight();
  const M   = 14;

  const periodLabel = `${format(parseISO(range.from), 'dd MMM', { locale: es })} — ${format(parseISO(range.to), 'dd MMM yyyy', { locale: es })}`;
  const churchName  = settings?.churchName?.toUpperCase() || 'FINANZAS';

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  const sectionLabel = (label: string, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray600);
    doc.setCharSpace(0.5);
    doc.text(label, M, y);
    doc.setCharSpace(0);
    return y + 6;
  };

  const checkPage = (y: number, needed = 35): number => {
    if (y + needed > H - 14) { doc.addPage(); return 22; }
    return y;
  };

  // ─────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────
  doc.setFillColor(...C.black);
  doc.rect(0, 0, W, 52, 'F');
  doc.setFillColor(...C.orange);
  doc.rect(0, 0, W, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...C.white);
  doc.text(churchName, M, 20);

  doc.setFontSize(7);
  doc.setTextColor(...C.orange);
  doc.setCharSpace(3);
  doc.text(settings?.churchSubtitle?.toUpperCase() || 'REPORTE FINANCIERO OFICIAL', M, 28);
  doc.setCharSpace(0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.gray300);
  doc.text(periodLabel, W - M, 20, { align: 'right' });
  doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}`, W - M, 28, { align: 'right' });

  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.4);
  doc.line(M, 44, W - M, 44);

  let y = 60;

  // ─────────────────────────────────────────────
  // RESUMEN EJECUTIVO (3 KPIs)
  // ─────────────────────────────────────────────
  y = sectionLabel('RESUMEN EJECUTIVO', y);

  const boxW = (W - M * 2 - 8) / 3;
  const kpis = [
    { label: 'TOTAL INGRESOS', value: formatCurrency(data.summary.totalIncome), bg: C.greenLight, accent: C.green },
    { label: 'TOTAL GASTOS',   value: formatCurrency(data.summary.totalExpense), bg: C.redLight,   accent: C.red   },
    { label: 'BALANCE NETO',   value: formatCurrency(data.summary.netBalance),   bg: C.orangeLight,accent: C.orange},
  ];
  kpis.forEach((k, i) => {
    const x = M + i * (boxW + 4);
    doc.setFillColor(...k.bg);
    doc.roundedRect(x, y, boxW, 26, 3, 3, 'F');
    doc.setFillColor(...k.accent);
    doc.roundedRect(x, y, 2.5, 26, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...k.accent);
    doc.setCharSpace(0.5);
    doc.text(k.label, x + 6, y + 8);
    doc.setCharSpace(0);
    doc.setFontSize(11);
    doc.setTextColor(...C.black);
    doc.text(k.value, x + 6, y + 19);
  });
  y += 34;

  // ─────────────────────────────────────────────
  // CAJA GENERAL
  // ─────────────────────────────────────────────
  y = sectionLabel('CAJA GENERAL', y);

  if (caja) {
    const cajaW = W - M * 2;

    // Balance principal
    doc.setFillColor(...C.orangeLight);
    doc.roundedRect(M, y, cajaW, 18, 3, 3, 'F');
    doc.setFillColor(...C.orange);
    doc.roundedRect(M, y, 2.5, 18, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...C.orange);
    doc.setCharSpace(0.5);
    doc.text('BALANCE EN CAJA', M + 6, y + 6);
    doc.setCharSpace(0);
    doc.setFontSize(13);
    doc.setTextColor(...C.black);
    doc.text(formatCurrency(caja.balance), M + 6, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.gray600);
    doc.text(`Entradas: ${formatCurrency(caja.income)}   |   Salidas: ${formatCurrency(caja.expense)}`, W - M - 2, y + 14, { align: 'right' });
    y += 22;

    // Desglose dos columnas
    const incCats = caja.categories?.filter(c => c.type === 'income') ?? [];
    const expCats = caja.categories?.filter(c => c.type === 'expense') ?? [];
    const colW    = (cajaW - 4) / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setCharSpace(0.5);
    doc.setTextColor(...C.green);
    doc.text('ENTRADAS POR CATEGORIA', M, y);
    doc.setTextColor(...C.red);
    doc.text('SALIDAS POR CATEGORIA', M + colW + 4, y);
    doc.setCharSpace(0);
    y += 4;

    let leftY  = y;
    let rightY = y;

    if (incCats.length === 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.gray300);
      doc.text('Sin ingresos', M + 2, leftY + 5); leftY += 9;
    } else {
      incCats.forEach(c => {
        leftY = checkPage(leftY, 12);
        doc.setFillColor(...C.greenLight);
        doc.roundedRect(M, leftY, colW, 9, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.gray900);
        doc.text(c.name.toUpperCase(), M + 3, leftY + 6);
        doc.setTextColor(...C.green);
        doc.text(formatCurrency(c.total), M + colW - 2, leftY + 6, { align: 'right' });
        leftY += 11;
      });
    }

    if (expCats.length === 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.gray300);
      doc.text('Sin gastos', M + colW + 6, rightY + 5); rightY += 9;
    } else {
      expCats.forEach(c => {
        rightY = checkPage(rightY, 12);
        doc.setFillColor(...C.redLight);
        doc.roundedRect(M + colW + 4, rightY, colW, 9, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.gray900);
        doc.text(c.name.toUpperCase(), M + colW + 7, rightY + 6);
        doc.setTextColor(...C.red);
        doc.text(formatCurrency(c.total), M + colW * 2 + 2, rightY + 6, { align: 'right' });
        rightY += 11;
      });
    }

    y = Math.max(leftY, rightY) + 6;
  }

  // ─────────────────────────────────────────────
  // TRANSFERENCIAS INTERNAS
  // ─────────────────────────────────────────────
  const transferDetails: TransferDetail[] = (caja as any)?.transferDetails ?? [];
  if (transferDetails.length > 0) {
    y = checkPage(y, 20);
    y = sectionLabel('MOVIMIENTOS INTERNOS', y);
    transferDetails.forEach(tr => {
      y = checkPage(y, 14);
      const hasDesc = !!tr.description;
      const rowH = hasDesc ? 12 : 8;
      doc.setFillColor(...C.blueLight);
      doc.roundedRect(M, y, W - M * 2, rowH, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.gray900);
      doc.text(`${tr.from}  >>  ${tr.to}`, M + 3, y + 4.5);
      if (hasDesc) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(...C.gray600);
        doc.text(tr.description, M + 3, y + 9, { maxWidth: W - M * 2 - 45 });
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.blue);
      doc.text(formatCurrency(tr.amount), W - M - 3, y + 4.5, { align: 'right' });
      y += rowH + 2;
    });
    y += 4;
  }

  // ─────────────────────────────────────────────
  // TENDENCIA MENSUAL (si hay mas de 1 mes)
  // ─────────────────────────────────────────────
  if (trend.length > 1) {
    y = checkPage(y, 40);
    y = sectionLabel('RENDIMIENTO POR MES', y);

    const netByMonth = trend.map(t => ({ month: t.month, net: t.income - t.expense, income: t.income, expense: t.expense }));
    const bestMonth  = [...netByMonth].sort((a, b) => b.net - a.net)[0];
    const worstMonth = [...netByMonth].sort((a, b) => a.net - b.net)[0];

    const rowH   = 8;
    const totalW = W - M * 2;

    // Encabezado columnas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...C.gray600);
    doc.text('MES',       M,                y);
    doc.text('INGRESOS',  M + totalW * 0.25, y, { align: 'center' });
    doc.text('GASTOS',    M + totalW * 0.55, y, { align: 'center' });
    doc.text('BALANCE',   W - M,             y, { align: 'right' });
    y += 4;

    doc.setDrawColor(...C.gray300);
    doc.setLineWidth(0.2);
    doc.line(M, y, W - M, y);
    y += 3;

    netByMonth.forEach((t) => {
      y = checkPage(y, rowH + 3);
      const isGain     = t.net >= 0;
      const monthLabel = format(new Date(t.month + '-01'), 'MMM yyyy', { locale: es }).toUpperCase();

      // Fondo alternado suave
      doc.setFillColor(...(isGain ? [240, 253, 244] as [number,number,number] : [255, 241, 241] as [number,number,number]));
      doc.rect(M, y, totalW, rowH, 'F');

      // Nombre del mes
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...C.gray900);
      doc.text(monthLabel, M + 2, y + 5.5);

      // Ingresos
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.green);
      doc.text(formatCurrency(t.income), M + totalW * 0.25, y + 5.5, { align: 'center' });

      // Gastos
      doc.setTextColor(...C.red);
      doc.text(formatCurrency(t.expense), M + totalW * 0.55, y + 5.5, { align: 'center' });

      // Balance
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(isGain ? C.green : C.red));
      doc.text((isGain ? '+' : '') + formatCurrency(t.net), W - M - 2, y + 5.5, { align: 'right' });

      // Línea divisora
      doc.setDrawColor(...C.gray100);
      doc.setLineWidth(0.2);
      doc.line(M, y + rowH, W - M, y + rowH);

      y += rowH + 1;
    });

    y += 4;

    // Mejor y peor mes
    const bestLabel  = format(new Date(bestMonth.month  + '-01'), 'MMMM yyyy', { locale: es });
    const worstLabel = format(new Date(worstMonth.month + '-01'), 'MMMM yyyy', { locale: es });
    const halfW      = (totalW - 4) / 2;

    doc.setFillColor(...C.greenLight);
    doc.roundedRect(M, y, halfW, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...C.green);
    doc.text(`Mejor mes: ${bestLabel}`, M + 3, y + 4);
    doc.setFontSize(7); doc.setTextColor(...C.gray900);
    doc.text('+' + formatCurrency(bestMonth.net), M + 3, y + 8.5);

    doc.setFillColor(...C.redLight);
    doc.roundedRect(M + halfW + 4, y, halfW, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...C.red);
    doc.text(`Mes con mayor perdida: ${worstLabel}`, M + halfW + 7, y + 4);
    doc.setFontSize(7); doc.setTextColor(...C.gray900);
    doc.text(formatCurrency(worstMonth.net), M + halfW + 7, y + 8.5);

    y += 18;
  }

  // ─────────────────────────────────────────────
  // ACTIVIDADES Y VENTAS
  // ─────────────────────────────────────────────
  if (activities.length > 0) {
    y = checkPage(y, 40);
    y = sectionLabel(`ACTIVIDADES Y VENTAS — ${activities.length} EN ESTE PERIODO`, y);

    activities.forEach(a => {
      y = checkPage(y, 45);

      const isVenta  = a.type === 'VENTA';
      const headerBg = isVenta ? C.greenLight : C.purpleLight;
      const accent   = isVenta ? C.green      : C.purple;
      const typeLabel = isVenta ? 'VENTA' : 'EVENTO';

      // Mes del evento
      const monthLabel = a.startDate
        ? format(parseISO(a.startDate), 'MMMM yyyy', { locale: es }).toUpperCase()
        : '';

      // Encabezado tarjeta
      doc.setFillColor(...headerBg);
      doc.roundedRect(M, y, W - M * 2, 14, 3, 3, 'F');
      doc.setFillColor(...accent);
      doc.roundedRect(M, y, 2.5, 14, 1, 1, 'F');

      // Badge tipo
      doc.setFillColor(...accent);
      doc.roundedRect(M + 6, y + 3.5, 14, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...C.white);
      doc.text(typeLabel, M + 13, y + 8.5, { align: 'center' });

      // Nombre
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...C.black);
      doc.text(a.name.toUpperCase(), M + 23, y + 7);

      // Mes + estado
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray600);
      const statusLabel = a.status === 'FINALIZADO' ? 'Terminado' : 'En curso';
      doc.text(`${monthLabel}  |  ${statusLabel}  |  ${a.txCount} movimientos`, M + 23, y + 11.5);

      // Resultado derecha
      const net = isVenta ? a.profit : -a.expense;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.setTextColor(...(net >= 0 ? C.green : C.red));
      doc.text((net >= 0 ? '+' : '') + formatCurrency(net), W - M - 2, y + 7, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray600);
      const resLabel = isVenta ? (net >= 0 ? 'Ganancia neta' : 'Perdida neta') : (a.status === 'FINALIZADO' ? 'Invertido (sin retorno)' : 'Invertido hasta ahora');
      doc.text(resLabel, W - M - 2, y + 12, { align: 'right' });
      y += 17;

      // KPIs
      y = checkPage(y, 14);
      const kpiData = isVenta
        ? [
            { label: 'Capital invertido', value: formatCurrency(a.investment ?? 0), color: C.orange },
            { label: 'Total vendido',      value: formatCurrency(a.income),          color: C.green  },
            { label: 'Gastos adicionales', value: formatCurrency(a.expense),         color: C.red    },
            { label: 'Ganancia / Perdida', value: (a.profit >= 0 ? '+' : '') + formatCurrency(a.profit), color: a.profit >= 0 ? C.green : C.red },
          ]
        : [
            { label: 'Capital invertido', value: formatCurrency(a.expense), color: C.orange },
            { label: 'Entro',             value: formatCurrency(a.income),  color: C.green  },
            { label: 'Resultado',         value: (net >= 0 ? '+' : '') + formatCurrency(net), color: net >= 0 ? C.green : C.red },
          ];

      const kpiW = (W - M * 2) / kpiData.length;
      doc.setFillColor(...C.gray100);
      doc.rect(M, y, W - M * 2, 14, 'F');
      kpiData.forEach((k, i) => {
        const kx = M + i * kpiW;
        if (i > 0) {
          doc.setDrawColor(...C.gray300); doc.setLineWidth(0.2);
          doc.line(kx, y + 2, kx, y + 12);
        }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray600);
        doc.text(k.label, kx + 3, y + 5.5);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...k.color);
        doc.text(k.value, kx + 3, y + 11.5);
      });
      y += 16;

      // Barra de progreso (solo ventas con meta)
      if (isVenta && a.salesGoal && a.salesGoal > 0) {
        y = checkPage(y, 16);
        const pct     = Math.min(1, a.income / a.salesGoal);
        const barW    = W - M * 2;
        doc.setFillColor(...C.gray100);
        doc.roundedRect(M, y, barW, 5, 1, 1, 'F');
        doc.setFillColor(...C.green);
        doc.roundedRect(M, y, barW * pct, 5, 1, 1, 'F');

        doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray600);
        doc.text(
          `Progreso de venta: ${formatCurrency(a.income)} de ${formatCurrency(a.salesGoal)} (${Math.round(pct * 100)}%)   |   Faltan: ${formatCurrency(Math.max(0, a.salesGoal - a.income))}`,
          M, y + 9
        );
        y += 14;
      }

      // Gastos individuales con descripcion
      const eventTx      = data.transactions.filter(t => t.eventId === a.id);
      const eventExpenses = eventTx.filter(t => t.type === 'expense');
      const eventIncome   = eventTx.filter(t => t.type === 'income');

      if (eventIncome.length > 0) {
        y = checkPage(y, 12);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...C.green);
        doc.setCharSpace(0.5); doc.text('ENTRADAS', M + 2, y + 4); doc.setCharSpace(0);
        y += 6;
        eventIncome.forEach(t => {
          y = checkPage(y, 11);
          const txDate = format(new Date(t.date), 'dd MMM', { locale: es });
          doc.setFillColor(...C.greenLight);
          doc.roundedRect(M, y, W - M * 2, 10, 1.5, 1.5, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.gray900);
          const descLines = doc.splitTextToSize(t.description.toUpperCase(), W - M * 2 - 45);
          const descCapped = descLines.slice(0, 2);
          const rowHeight = descCapped.length > 1 ? 14 : 10;
          doc.text(descCapped, M + 3, y + 4.5);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray600);
          doc.text(txDate, M + 3, y + 8.5);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.green);
          doc.text('+' + formatCurrency(t.amount), W - M - 3, y + 6.5, { align: 'right' });
          y += rowHeight + 2;
        });
      }

      if (eventExpenses.length > 0) {
        y = checkPage(y, 12);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...C.red);
        doc.setCharSpace(0.5); doc.text('GASTOS INDIVIDUALES', M + 2, y + 4); doc.setCharSpace(0);
        y += 6;
        eventExpenses.forEach(t => {
          y = checkPage(y, 11);
          const txDate = format(new Date(t.date), 'dd MMM', { locale: es });
          doc.setFillColor(...C.redLight);
          doc.roundedRect(M, y, W - M * 2, 10, 1.5, 1.5, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.gray900);
          const descLines = doc.splitTextToSize(t.description.toUpperCase(), W - M * 2 - 45);
          const descCapped = descLines.slice(0, 2);
          const rowHeight = descCapped.length > 1 ? 14 : 10;
          doc.text(descCapped, M + 3, y + 4.5);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray600);
          doc.text(txDate, M + 3, y + 8.5);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.red);
          doc.text(formatCurrency(t.amount), W - M - 3, y + 6.5, { align: 'right' });
          y += rowHeight + 2;
        });
      }

      y += 6;
    });
  }

  // ─────────────────────────────────────────────
  // CATEGORIAS
  // ─────────────────────────────────────────────
  if (data.categories.length > 0) {
    y = checkPage(y, 30);
    y = sectionLabel('DESGLOSE POR CATEGORIA', y);

    const colW   = (W - M * 2 - 4) / 2;
    const incCat = data.categories.filter(c => c.type === 'income');
    const expCat = data.categories.filter(c => c.type === 'expense');
    const maxRows = Math.max(incCat.length, expCat.length);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setCharSpace(0.5);
    doc.setTextColor(...C.green); doc.text('INGRESOS', M, y);
    doc.setTextColor(...C.red);  doc.text('GASTOS',   M + colW + 4, y);
    doc.setCharSpace(0);
    y += 4;

    for (let i = 0; i < maxRows; i++) {
      y = checkPage(y, 10);
      const ic = incCat[i];
      const ec = expCat[i];
      if (ic) {
        const pct = Math.min(1, ic.total / (data.summary.totalIncome || 1));
        doc.setFillColor(...C.greenLight);
        doc.roundedRect(M, y, colW, 9, 2, 2, 'F');
        doc.setFillColor(...C.green);
        doc.roundedRect(M, y + 7, colW * pct, 2, 0.5, 0.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.gray900);
        doc.text(ic.name.toUpperCase(), M + 3, y + 6);
        doc.setTextColor(...C.green);
        doc.text(formatCurrency(ic.total), M + colW - 2, y + 6, { align: 'right' });
      }
      if (ec) {
        const pct = Math.min(1, ec.total / (data.summary.totalExpense || 1));
        doc.setFillColor(...C.redLight);
        doc.roundedRect(M + colW + 4, y, colW, 9, 2, 2, 'F');
        doc.setFillColor(...C.red);
        doc.roundedRect(M + colW + 4, y + 7, colW * pct, 2, 0.5, 0.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.gray900);
        doc.text(ec.name.toUpperCase(), M + colW + 7, y + 6);
        doc.setTextColor(...C.red);
        doc.text(formatCurrency(ec.total), M + colW * 2 + 2, y + 6, { align: 'right' });
      }
      y += 12;
    }
    y += 4;
  }

  // ─────────────────────────────────────────────
  // TABLA DE MOVIMIENTOS
  // ─────────────────────────────────────────────
  y = checkPage(y, 30);
  y = sectionLabel('MOVIMIENTOS DEL PERIODO', y);

  const tableRows = data.transactions.map(t => [
    format(new Date(t.date), 'dd/MM/yy'),
    t.description.toUpperCase(),
    t.category?.name?.toUpperCase() ?? '—',
    t.event?.name?.toUpperCase() ?? 'CAJA',
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    formatCurrency(t.amount),
  ]);

  const totalIncome  = data.transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const totalRowStart = data.transactions.length;
  tableRows.push(['', 'TOTAL', '', '', 'Ingresos', formatCurrency(totalIncome)]);
  tableRows.push(['', '',      '', '', 'Gastos',   formatCurrency(totalExpense)]);
  tableRows.push(['', '',      '', '', 'Neto',     formatCurrency(totalIncome - totalExpense)]);

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Descripcion', 'Categoria', 'Evento', 'Tipo', 'Monto']],
    body: tableRows,
    margin: { left: M, right: M },
    styles: {
      font: 'helvetica', fontSize: 7,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      textColor: C.gray900, lineColor: C.gray100, lineWidth: 0.2,
    },
    headStyles: {
      fillColor: C.black, textColor: C.white, fontStyle: 'bold',
      fontSize: 6.5, cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
    },
    columnStyles: {
      0: { cellWidth: 18, textColor: C.gray600 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 24, textColor: C.gray600 },
      3: { cellWidth: 28, textColor: C.gray600, fontSize: 6 },
      4: { cellWidth: 18, fontStyle: 'bold' },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: C.gray100 },
    didParseCell(d) {
      if (d.row.index < totalRowStart) {
        const row = data.transactions[d.row.index];
        if (!row) return;
        if (d.column.index === 4 || d.column.index === 5)
          d.cell.styles.textColor = row.type === 'income' ? C.green : C.red;
      }
      if (d.row.index >= totalRowStart) {
        d.cell.styles.fillColor  = C.orangeLight;
        d.cell.styles.fontStyle  = 'bold';
        d.cell.styles.fontSize   = 7.5;
        if (d.column.index === 5) {
          if (d.row.index === totalRowStart)     d.cell.styles.textColor = C.green;
          else if (d.row.index === totalRowStart + 1) d.cell.styles.textColor = C.red;
          else d.cell.styles.textColor = C.orange;
        }
      }
    },
  });

  // ─────────────────────────────────────────────
  // FIRMA
  // ─────────────────────────────────────────────
  const finalY: number = (doc as any).lastAutoTable.finalY + 14;
  const sigY = (H - finalY) >= 52 ? finalY : (() => { doc.addPage(); return 24; })();

  doc.setDrawColor(...C.gray300); doc.setLineWidth(0.3);
  doc.line(M, sigY, W - M, sigY);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.gray600);
  doc.setCharSpace(0.5); doc.text('AUTORIZACION', M, sigY + 7); doc.setCharSpace(0);

  doc.setDrawColor(...C.black); doc.setLineWidth(0.6);
  doc.line(M, sigY + 22, M + 65, sigY + 22);

  if (settings?.signatureUrl) {
    try { doc.addImage(settings.signatureUrl, 'PNG', M + 5, sigY + 8, 40, 12); }
    catch (e) { console.error('Error firma:', e); }
  } else if (settings?.reportSignatureName) {
    doc.setFont('times', 'italic'); doc.setFontSize(14); doc.setTextColor(...C.gray600);
    doc.text(settings.reportSignatureName, M + 5, sigY + 18);
  }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...C.black);
  doc.text(settings?.reportSignatureName || 'Firma Autorizada', M, sigY + 26);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.gray600);
  doc.text(settings?.churchName || 'Organizacion', M, sigY + 31);

  // Sello
  const sealX = W - M - 55;
  doc.setFillColor(...C.gray100);
  doc.roundedRect(sealX, sigY + 4, 55, 28, 3, 3, 'F');
  doc.setDrawColor(...C.orange); doc.setLineWidth(0.5);
  doc.roundedRect(sealX, sigY + 4, 55, 28, 3, 3, 'S');
  doc.setFillColor(...C.orange);
  doc.roundedRect(sealX + 3, sigY + 9, 10, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...C.white);
  doc.text('FJ', sealX + 8, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...C.black);
  doc.text('FINANZAS', sealX + 16, sigY + 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...C.gray600);
  doc.text(settings?.churchName || 'Organizacion', sealX + 16, sigY + 18);
  doc.text(periodLabel, sealX + 16, sigY + 23);

  // ─────────────────────────────────────────────
  // FOOTER TODAS LAS PAGINAS
  // ─────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...C.black);
    doc.rect(0, H - 11, W, 11, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...C.gray600);
    doc.text(settings?.reportFooterText || `${churchName} - Reporte Oficial`, M, H - 4.5);
    doc.text(`Pag. ${p} / ${totalPages}`, W - M, H - 4.5, { align: 'right' });
    doc.setFillColor(...C.orange);
    doc.rect(0, H - 1.5, W, 1.5, 'F');
  }

  doc.save(`Reporte_${range.from}_${range.to}.pdf`);
}