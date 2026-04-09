import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReportData, ReportSettings, ReportActivity, CajaSummary } from './generateReportPDF';

interface GenerateExcelParams {
  data: ReportData;
  settings: ReportSettings | null;
  range: { from: string; to: string };
  caja?: CajaSummary | null;
  activities?: ReportActivity[];
}

export async function generateReportExcel({ data, settings, range, caja, activities }: GenerateExcelParams) {
  const ExcelJS = (await import('exceljs')).default;
  const { saveAs } = await import('file-saver');

  const wb = new ExcelJS.Workbook();
  wb.creator = settings?.churchName || 'ChurchFlow';
  wb.created = new Date();

  const churchName = settings?.churchName || 'Finanzas Jóvenes';
  const periodLabel = `${format(parseISO(range.from), 'dd MMM', { locale: es })} — ${format(parseISO(range.to), 'dd MMM yyyy', { locale: es })}`;

  /* ── RESUMEN SHEET ── */
  const ws = wb.addWorksheet('Resumen', {
    properties: { defaultColWidth: 18 },
  });

  // Header
  ws.mergeCells('A1:E1');
  const titleCell = ws.getCell('A1');
  titleCell.value = churchName.toUpperCase();
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0C14' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 40;

  ws.mergeCells('A2:E2');
  const subtitleCell = ws.getCell('A2');
  subtitleCell.value = `Reporte Financiero · ${periodLabel}`;
  subtitleCell.font = { name: 'Arial', size: 10, color: { argb: 'FFFF6B1A' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0C14' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 25;

  ws.addRow([]);

  /* ── CAJA GENERAL ── */
  if (caja) {
    ws.mergeCells(`A${ws.rowCount + 1}:E${ws.rowCount + 1}`);
    const cajaTitle = ws.getCell(`A${ws.rowCount}`);
    cajaTitle.value = '🏦  CAJA GENERAL';
    cajaTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFF6B1A' } };
    cajaTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
    ws.getRow(ws.rowCount).height = 28;

    const cajaHeader = ws.addRow(['', 'CONCEPTO', 'MONTO', '', '']);
    cajaHeader.font = { bold: true, size: 10, color: { argb: 'FF505570' } };
    cajaHeader.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F1F5' } };
    cajaHeader.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F1F5' } };

    const cajaInRow = ws.addRow(['', 'Entró a caja', caja.income]);
    cajaInRow.getCell(3).numFmt = '"RD$"#,##0';
    cajaInRow.getCell(3).font = { bold: true, color: { argb: 'FF10B981' } };

    const cajaOutRow = ws.addRow(['', 'Salió de caja', caja.expense]);
    cajaOutRow.getCell(3).numFmt = '"RD$"#,##0';
    cajaOutRow.getCell(3).font = { bold: true, color: { argb: 'FFEF4444' } };

    const cajaBalRow = ws.addRow(['', 'Queda en caja (balance real)', caja.balance]);
    cajaBalRow.getCell(3).numFmt = '"RD$"#,##0';
    cajaBalRow.getCell(2).font = { bold: true, size: 11 };
    cajaBalRow.getCell(3).font = { bold: true, size: 11, color: { argb: caja.balance >= 0 ? 'FF10B981' : 'FFEF4444' } };
    cajaBalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
    cajaBalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };

    ws.addRow([]);
  } else {
    // Fallback: old summary style when caja not available
    const summaryHeader = ws.addRow(['', 'CONCEPTO', 'MONTO', '', '']);
    summaryHeader.font = { bold: true, size: 10, color: { argb: 'FF505570' } };
    summaryHeader.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F1F5' } };
    summaryHeader.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F1F5' } };

    const incomeRow = ws.addRow(['', 'Ingresos', data.summary.totalIncome]);
    incomeRow.getCell(3).numFmt = '"RD$"#,##0';
    incomeRow.getCell(3).font = { bold: true, color: { argb: 'FF10B981' } };

    const expenseRow = ws.addRow(['', 'Gastos', data.summary.totalExpense]);
    expenseRow.getCell(3).numFmt = '"RD$"#,##0';
    expenseRow.getCell(3).font = { bold: true, color: { argb: 'FFEF4444' } };

    const balanceRow = ws.addRow(['', 'Balance Neto', data.summary.netBalance]);
    balanceRow.getCell(3).numFmt = '"RD$"#,##0';
    balanceRow.getCell(2).font = { bold: true, size: 11 };
    balanceRow.getCell(3).font = { bold: true, size: 11, color: { argb: data.summary.netBalance >= 0 ? 'FF10B981' : 'FFEF4444' } };
    balanceRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
    balanceRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };

    ws.addRow([]);
  }

  /* ── ACTIVIDADES Y VENTAS ── */
  if (activities && activities.length > 0) {
    ws.mergeCells(`A${ws.rowCount + 1}:E${ws.rowCount + 1}`);
    const actTitle = ws.getCell(`A${ws.rowCount}`);
    actTitle.value = '📋  ACTIVIDADES Y VENTAS (APARTE DE CAJA)';
    actTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF3B82F6' } };
    actTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    ws.getRow(ws.rowCount).height = 28;

    const actHeader = ws.addRow(['', 'ACTIVIDAD', 'TIPO', 'ESTADO', 'RESULTADO']);
    actHeader.font = { bold: true, size: 10, color: { argb: 'FF505570' } };
    [2, 3, 4, 5].forEach(col => {
      actHeader.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F1F5' } };
    });

    activities.forEach(a => {
      const isVenta = a.type === 'VENTA';
      const result = isVenta ? a.profit : -a.expense;
      const row = ws.addRow([
        '',
        a.name,
        isVenta ? 'Venta' : 'Evento',
        a.status === 'FINALIZADO' ? 'Terminado' : 'En curso',
        result,
      ]);
      row.getCell(3).font = { bold: true, color: { argb: isVenta ? 'FF10B981' : 'FF8B5CF6' } };
      row.getCell(5).numFmt = '"RD$"#,##0';
      row.getCell(5).font = { bold: true, color: { argb: result >= 0 ? 'FF10B981' : 'FFEF4444' } };

      // Extra line for ventas with investment/goal
      if (isVenta && (a.investment || a.salesGoal)) {
        const detailRow = ws.addRow([
          '',
          '',
          a.investment ? `Inversión: RD$${a.investment.toLocaleString()}` : '',
          a.salesGoal ? `Meta: RD$${a.salesGoal.toLocaleString()}` : '',
          a.salesGoal ? `${Math.min(100, (a.income / a.salesGoal) * 100).toFixed(0)}% de meta` : '',
        ]);
        detailRow.font = { size: 9, italic: true, color: { argb: 'FF808080' } };
      }
    });

    ws.addRow([]);
  }

  /* ── CATEGORÍAS ── */
  if (data.categories.length > 0) {
    const catHeader = ws.addRow(['', 'CATEGORÍA', 'TIPO', 'TOTAL', '']);
    catHeader.font = { bold: true, size: 10, color: { argb: 'FF505570' } };
    [2, 3, 4].forEach(col => {
      catHeader.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F1F5' } };
    });

    data.categories.forEach(cat => {
      const row = ws.addRow(['', cat.name, cat.type === 'income' ? 'Ingreso' : 'Gasto', cat.total]);
      row.getCell(4).numFmt = '"RD$"#,##0';
      row.getCell(4).font = { bold: true, color: { argb: cat.type === 'income' ? 'FF10B981' : 'FFEF4444' } };
    });

    ws.addRow([]);
  }

  // Column widths
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 30;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 20;
  ws.getColumn(5).width = 20;

  /* ── MOVIMIENTOS SHEET ── */
  const wsT = wb.addWorksheet('Movimientos', {
    properties: { defaultColWidth: 16 },
  });

  // Header
  const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto'];
  const headerRow = wsT.addRow(headers);
  headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0C14' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FFFF6B1A' } },
    };
  });

  // Data rows
  data.transactions.forEach((t, i) => {
    const row = wsT.addRow([
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.description,
      t.category?.name ?? 'Sin categoría',
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.amount,
    ]);

    row.getCell(5).numFmt = '"RD$"#,##0';

    const typeColor = t.type === 'income' ? 'FF10B981' : 'FFEF4444';
    row.getCell(4).font = { bold: true, color: { argb: typeColor } };
    row.getCell(5).font = { bold: true, color: { argb: typeColor } };

    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F1F5' } };
      });
    }
  });

  // Column widths
  wsT.getColumn(1).width = 14;
  wsT.getColumn(2).width = 40;
  wsT.getColumn(3).width = 22;
  wsT.getColumn(4).width = 14;
  wsT.getColumn(5).width = 18;

  // Auto-filter
  wsT.autoFilter = { from: 'A1', to: 'E1' };

  /* ── SAVE ── */
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `ChurchFlow_${range.from}_${range.to}.xlsx`);
}
