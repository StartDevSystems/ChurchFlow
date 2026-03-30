import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

/* ══════════════════════════════════════════════════════════
   COLOR PALETTE — Sport-Brutalist
══════════════════════════════════════════════════════════ */
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
  category?: { name: string } | null;
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
}

export interface CajaSummary {
  income: number;
  expense: number;
  balance: number;
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
}

export async function generateReportPDF({ data, settings, range, caja, activities }: GeneratePDFParams) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W    = doc.internal.pageSize.getWidth();
  const H    = doc.internal.pageSize.getHeight();
  const M    = 14;

  /* ── HEADER — full black block ── */
  doc.setFillColor(...C.black);
  doc.rect(0, 0, W, 54, 'F');

  doc.setFillColor(...C.orange);
  doc.rect(0, 0, W, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...C.white);
  doc.text(settings?.churchName?.toUpperCase() || 'FINANZAS JÓVENES', M, 22);

  doc.setFontSize(7);
  doc.setTextColor(...C.orange);
  doc.setCharSpace(3);
  doc.text(settings?.churchSubtitle?.toUpperCase() || 'REPORTE FINANCIERO OFICIAL', M, 30);
  doc.setCharSpace(0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.gray300);
  const periodLabel = `${format(new Date(range.from), 'dd MMM', { locale: es })} — ${format(new Date(range.to), 'dd MMM yyyy', { locale: es })}`;
  doc.text(periodLabel, W - M, 22, { align: 'right' });
  doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}`, W - M, 30, { align: 'right' });

  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.4);
  doc.line(M, 47, W - M, 47);

  let y = 62;

  /* ── CAJA GENERAL ── */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.gray600);
  doc.setCharSpace(3);
  doc.text('CAJA GENERAL', M, y);
  doc.setCharSpace(0);
  y += 6;

  if (caja) {
    // Caja box - full width, prominent
    const cajaW = W - M * 2;
    doc.setFillColor(...C.orangeLight);
    doc.roundedRect(M, y, cajaW, 24, 3, 3, 'F');
    doc.setFillColor(...C.orange);
    doc.roundedRect(M, y, 2.5, 24, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...C.orange);
    doc.setCharSpace(1.5);
    doc.text('EN CAJA', M + 6, y + 7);
    doc.setCharSpace(0);
    doc.setFontSize(13);
    doc.setTextColor(...C.black);
    doc.text(formatCurrency(caja.balance), M + 6, y + 17);

    // Entró / Salió on the right
    doc.setFontSize(7);
    doc.setTextColor(...C.green);
    doc.text(`Entró: ${formatCurrency(caja.income)}`, cajaW - 20, y + 9, { align: 'right' });
    doc.setTextColor(...C.red);
    doc.text(`Salió: ${formatCurrency(caja.expense)}`, cajaW - 20, y + 17, { align: 'right' });

    y += 30;
  } else {
    // Fallback to old summary boxes if no caja data
    const boxW = (W - M * 2 - 8) / 3;
    const boxH = 28;
    const boxes = [
      { label: 'INGRESOS',    value: formatCurrency(data.summary.totalIncome),   bg: C.greenLight, accent: C.green,  sign: '+' },
      { label: 'GASTOS',      value: formatCurrency(data.summary.totalExpense),  bg: C.redLight,   accent: C.red,    sign: '-' },
      { label: 'BALANCE NETO',value: formatCurrency(data.summary.netBalance),    bg: C.orangeLight,accent: C.orange, sign: data.summary.netBalance >= 0 ? '+' : '-' },
    ];
    boxes.forEach((box, i) => {
      const x = M + i * (boxW + 4);
      doc.setFillColor(...box.bg);
      doc.roundedRect(x, y, boxW, boxH, 3, 3, 'F');
      doc.setFillColor(...box.accent);
      doc.roundedRect(x, y, 2.5, boxH, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...box.accent);
      doc.setCharSpace(1.5);
      doc.text(box.label, x + 6, y + 8);
      doc.setCharSpace(0);
      doc.setFontSize(10.5);
      doc.setTextColor(...C.black);
      doc.text(box.value, x + 6, y + 19);
    });
    y += boxH + 10;
  }

  /* ── ACTIVIDADES Y VENTAS ── */
  if (activities && activities.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray600);
    doc.setCharSpace(3);
    doc.text('ACTIVIDADES Y VENTAS (APARTE DE CAJA)', M, y);
    doc.setCharSpace(0);
    y += 5;

    activities.forEach((a) => {
      if (y > H - 40) { doc.addPage(); y = 20; }

      const rowH = 10;
      // Type badge
      const isVenta = a.type === 'VENTA';
      doc.setFillColor(...(isVenta ? C.greenLight : [237, 233, 254] as [number, number, number]));
      doc.roundedRect(M, y, W - M * 2, rowH, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(...(isVenta ? C.green : [139, 92, 246] as [number, number, number]));
      doc.text(isVenta ? 'VENTA' : 'EVENTO', M + 3, y + 4);

      doc.setFontSize(7);
      doc.setTextColor(...C.black);
      doc.text(a.name.toUpperCase(), M + 20, y + 4);

      // Status
      doc.setFontSize(5);
      doc.setTextColor(...C.gray600);
      doc.text(a.status === 'FINALIZADO' ? 'Terminado' : 'En curso', M + 20, y + 8);

      // Amount on the right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const profitColor = a.profit >= 0 ? C.green : C.red;
      doc.setTextColor(...profitColor);
      const profitText = isVenta
        ? `${a.profit >= 0 ? '+' : ''}${formatCurrency(a.profit)}`
        : `-${formatCurrency(a.expense)}`;
      doc.text(profitText, W - M - 2, y + 5.5, { align: 'right' });

      // Progress for ventas with goal
      if (isVenta && a.salesGoal && a.salesGoal > 0) {
        doc.setFontSize(5);
        doc.setTextColor(...C.gray600);
        const pct = Math.min(100, (a.income / a.salesGoal) * 100);
        doc.text(`${pct.toFixed(0)}% de meta`, W - M - 2, y + 9, { align: 'right' });
      }

      y += rowH + 2;
    });

    y += 4;
  }

  /* ── CATEGORIES SECTION ── */
  if (data.categories && data.categories.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray600);
    doc.setCharSpace(3);
    doc.text('DESGLOSE POR CATEGORÍA', M, y);
    doc.setCharSpace(0);
    y += 5;

    const catCols = Math.min(data.categories.length, 2);
    const catW    = (W - M * 2 - 4) / catCols;

    data.categories.forEach((cat, i) => {
      const cx = M + (i % catCols) * (catW + 4);
      if (i > 0 && i % catCols === 0) y += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...C.gray600);
      doc.text(cat.name.toUpperCase(), cx, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...(cat.type === 'income' ? C.green : C.red));
      doc.text(formatCurrency(cat.total), cx + catW - 2, y + 4, { align: 'right' });

      const pct = Math.min(1, cat.total / (cat.type === 'income' ? data.summary.totalIncome : data.summary.totalExpense));
      doc.setFillColor(...C.gray100);
      doc.roundedRect(cx, y + 6, catW, 1.5, 0.5, 0.5, 'F');
      doc.setFillColor(...(cat.type === 'income' ? C.green : C.red));
      doc.roundedRect(cx, y + 6, catW * pct, 1.5, 0.5, 0.5, 'F');
    });

    y += 16;
  }

  /* ── TRANSACTIONS TABLE ── */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.gray600);
  doc.setCharSpace(3);
  doc.text('MOVIMIENTOS DEL PERÍODO', M, y);
  doc.setCharSpace(0);
  y += 5;

  const tableRows = data.transactions.map((t) => [
    format(new Date(t.date), 'dd/MM/yy'),
    t.description.toUpperCase(),
    t.category?.name?.toUpperCase() ?? '—',
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    formatCurrency(t.amount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']],
    body: tableRows,
    margin: { left: M, right: M },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      textColor: C.gray900,
      lineColor: C.gray100,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: C.black,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 6.5,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
    },
    columnStyles: {
      0: { cellWidth: 20, textColor: C.gray600 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28, textColor: C.gray600 },
      3: { cellWidth: 20, fontStyle: 'bold' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: C.gray100 },
    didParseCell(d) {
      const row = data.transactions[d.row.index];
      if (!row) return;
      if (d.column.index === 3 || d.column.index === 4) {
        d.cell.styles.textColor = row.type === 'income' ? C.green : C.red;
      }
    },
  });

  /* ── SIGNATURE BLOCK ── */
  const finalY: number = (doc as any).lastAutoTable.finalY + 14;
  const sigY = (H - finalY) >= 52 ? finalY : (() => { doc.addPage(); return 24; })();

  doc.setDrawColor(...C.gray300);
  doc.setLineWidth(0.3);
  doc.line(M, sigY, W - M, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.gray600);
  doc.setCharSpace(2.5);
  doc.text('AUTORIZACIÓN', M, sigY + 7);
  doc.setCharSpace(0);

  // Signature
  doc.setDrawColor(...C.black);
  doc.setLineWidth(0.6);
  doc.line(M, sigY + 22, M + 65, sigY + 22);

  if (settings?.signatureUrl) {
    try {
      doc.addImage(settings.signatureUrl, 'PNG', M + 5, sigY + 8, 40, 12);
    } catch (e) {
      console.error("Error drawing signature image:", e);
    }
  } else if (settings?.reportSignatureName) {
    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(...C.gray600);
    doc.text(settings.reportSignatureName, M + 5, sigY + 18);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.black);
  doc.text(settings?.reportSignatureName || 'Firma Autorizada', M, sigY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.gray600);
  doc.text(settings?.churchName || 'Sociedad de Jóvenes', M, sigY + 31);

  // Seal
  const sealX = W - M - 55;
  doc.setFillColor(...C.gray100);
  doc.roundedRect(sealX, sigY + 4, 55, 28, 3, 3, 'F');
  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.5);
  doc.roundedRect(sealX, sigY + 4, 55, 28, 3, 3, 'S');
  doc.setFillColor(...C.orange);
  doc.roundedRect(sealX + 3, sigY + 9, 10, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text('CF', sealX + 8, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...C.black);
  doc.text('SELLO DIGITAL', sealX + 16, sigY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.gray600);
  doc.text('ChurchFlow Pro', sealX + 16, sigY + 18);
  doc.text(periodLabel, sealX + 16, sigY + 23);

  /* ── PAGE FOOTER (all pages) ── */
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...C.black);
    doc.rect(0, H - 11, W, 11, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...C.gray600);
    doc.text(settings?.reportFooterText || `${settings?.churchName} · Reporte Oficial`, M, H - 4.5);
    doc.text(`Pág. ${p} / ${totalPages}`, W - M, H - 4.5, { align: 'right' });
    doc.setFillColor(...C.orange);
    doc.rect(0, H - 1.5, W, 1.5, 'F');
  }

  doc.save(`ChurchFlow_${range.from}_${range.to}.pdf`);
}
