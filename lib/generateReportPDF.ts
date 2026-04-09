import { format, parseISO } from 'date-fns';
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
  transferDetails?: TransferDetail[];
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
  const periodLabel = `${format(parseISO(range.from), 'dd MMM', { locale: es })} — ${format(parseISO(range.to), 'dd MMM yyyy', { locale: es })}`;
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

  /* ── MOVIMIENTOS INTERNOS (TRANSFERENCIAS) ── */
  const transferDetails: TransferDetail[] = (caja as any)?.transferDetails ?? [];
  if (transferDetails.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray600);
    doc.setCharSpace(3);
    doc.text('MOVIMIENTOS INTERNOS', M, y);
    doc.setCharSpace(0);
    y += 5;

    transferDetails.forEach((tr) => {
      if (y > H - 40) { doc.addPage(); y = 20; }
      const hasDesc = !!tr.description;
      const rowH = hasDesc ? 11 : 7;
      doc.setFillColor(...[219, 234, 254] as [number, number, number]);
      doc.roundedRect(M, y, W - M * 2, rowH, 2, 2, 'F');

      doc.setCharSpace(0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...C.gray900);
      doc.text(`${tr.from}  >>  ${tr.to}`, M + 3, y + 4);
      if (hasDesc) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(...C.gray600);
        doc.text(tr.description, M + 3, y + 8, { maxWidth: W - M * 2 - 45 });
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...[37, 99, 235] as [number, number, number]);
      doc.text(formatCurrency(tr.amount), W - M - 3, y + 4, { align: 'right' });

      y += rowH + 2;
    });
    y += 4;
  }

  /* ── ACTIVIDADES Y VENTAS ── */
  if (activities && activities.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray600);
    doc.setCharSpace(3);
    doc.text('ACTIVIDADES Y VENTAS', M, y);
    doc.setCharSpace(0);
    y += 5;

    activities.forEach((a) => {
      if (y > H - 40) { doc.addPage(); y = 20; }

      const isVenta = a.type === 'VENTA';

      // Header row
      const headerH = 10;
      doc.setFillColor(...(isVenta ? C.greenLight : [237, 233, 254] as [number, number, number]));
      doc.roundedRect(M, y, W - M * 2, headerH, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(...(isVenta ? C.green : [139, 92, 246] as [number, number, number]));
      doc.text(isVenta ? 'VENTA' : 'EVENTO', M + 3, y + 4);

      doc.setFontSize(7);
      doc.setTextColor(...C.black);
      doc.text(a.name.toUpperCase(), M + 20, y + 4);

      doc.setFontSize(5);
      doc.setTextColor(...C.gray600);
      doc.text(a.status === 'FINALIZADO' ? 'Terminado' : 'En curso', M + 20, y + 8);

      // Total on the right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.red);
      doc.text(`Gastado: ${formatCurrency(a.expense)}`, W - M - 2, y + 5.5, { align: 'right' });

      if (isVenta && a.salesGoal && a.salesGoal > 0) {
        doc.setFontSize(5);
        doc.setTextColor(...C.gray600);
        const pct = Math.min(100, (a.income / a.salesGoal) * 100);
        doc.text(`${pct.toFixed(0)}% de meta`, W - M - 2, y + 9, { align: 'right' });
      }

      y += headerH + 1;

      // Expense breakdown for this event
      const eventTx = data.transactions.filter(t => t.eventId === a.id);
      const eventExpenses = eventTx.filter(t => t.type === 'expense');
      const eventIncome = eventTx.filter(t => t.type === 'income');

      // Show income sources
      if (eventIncome.length > 0) {
        if (y > H - 30) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(...C.green);
        doc.text('Recibido:', M + 5, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...C.gray900);

        // Group by category
        const incomeByCategory: Record<string, number> = {};
        eventIncome.forEach(t => {
          const cat = t.category?.name ?? 'Otro';
          incomeByCategory[cat] = (incomeByCategory[cat] || 0) + t.amount;
        });
        const incomeEntries = Object.entries(incomeByCategory);
        const incomeText = incomeEntries.map(([cat, total]) => `${cat}: ${formatCurrency(total)}`).join('  •  ');
        doc.text(incomeText, M + 22, y + 3);

        // Check for transfers into this event
        const eventTransfers = transferDetails.filter(tr => tr.to === a.name);
        if (eventTransfers.length > 0) {
          y += 4;
          if (y > H - 30) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(...[37, 99, 235] as [number, number, number]);
          doc.text('De Caja:', M + 5, y + 3);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(...C.gray900);
          const trText = eventTransfers.map(tr => formatCurrency(tr.amount)).join('  +  ');
          doc.text(trText, M + 22, y + 3);
        }

        y += 5;
      }

      // Show expense details
      if (eventExpenses.length > 0) {
        if (y > H - 30) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(...C.red);
        doc.text('Gastos:', M + 5, y + 3);
        y += 1;

        eventExpenses.forEach(t => {
          if (y > H - 20) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(...C.gray900);
          doc.text(`• ${t.description}`, M + 10, y + 4);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.red);
          doc.text(formatCurrency(t.amount), W - M - 2, y + 4, { align: 'right' });
          y += 4.5;
        });
      }

      y += 4;
    });

    y += 2;
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
    t.event?.name?.toUpperCase() ?? 'CAJA',
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    formatCurrency(t.amount),
  ]);

  // Totals row
  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  tableRows.push(['', 'TOTAL', '', '', 'Ingresos', formatCurrency(totalIncome)]);
  tableRows.push(['', '', '', '', 'Gastos', formatCurrency(totalExpense)]);
  tableRows.push(['', '', '', '', 'Neto', formatCurrency(totalIncome - totalExpense)]);

  const totalRowStart = data.transactions.length;

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Descripción', 'Categoría', 'Evento', 'Tipo', 'Monto']],
    body: tableRows,
    margin: { left: M, right: M },
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      textColor: C.gray900,
      lineColor: C.gray100,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: C.black,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 6.5,
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
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
      // Color income/expense for data rows
      if (d.row.index < totalRowStart) {
        const row = data.transactions[d.row.index];
        if (!row) return;
        if (d.column.index === 4 || d.column.index === 5) {
          d.cell.styles.textColor = row.type === 'income' ? C.green : C.red;
        }
      }
      // Style total rows
      if (d.row.index >= totalRowStart) {
        d.cell.styles.fillColor = C.orangeLight;
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fontSize = 7.5;
        if (d.column.index === 5) {
          if (d.row.index === totalRowStart) d.cell.styles.textColor = C.green;
          else if (d.row.index === totalRowStart + 1) d.cell.styles.textColor = C.red;
          else d.cell.styles.textColor = C.orange;
        }
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
  doc.text('FJ', sealX + 8, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...C.black);
  doc.text('FINANZAS', sealX + 16, sigY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.gray600);
  doc.text('IMAC Juvenil', sealX + 16, sigY + 18);
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

  doc.save(`Finanzas_IMAC_Juvenil_${range.from}_${range.to}.pdf`);
}
