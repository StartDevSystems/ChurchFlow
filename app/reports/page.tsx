"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar as CalendarIcon, FileText, Download, Filter, Search, Loader2, ArrowUpCircle, ArrowDownCircle, PieChart, MessageCircle, Presentation, Image as ImageIcon, X, TrendingUp, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ══════════════════════════════════════════════════════════
   COLOR PALETTE — Sport-Brutalist
══════════════════════════════════════════════════════════ */
const C = {
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

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [range, setRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to:   format(endOfMonth(new Date()),   'yyyy-MM-dd'),
  });

  /* ══════════════════════════════════════════════════════
     GENERATE PDF — Sport-Brutalist
  ══════════════════════════════════════════════════════ */
  const generatePDF = () => {
    if (!data) return;

    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W    = doc.internal.pageSize.getWidth();
    const H    = doc.internal.pageSize.getHeight();
    const M    = 14;

    /* ── HEADER — full black block ── */
    doc.setFillColor(...C.black);
    doc.rect(0, 0, W, 54, 'F');

    // Orange accent bar on top
    doc.setFillColor(...C.orange);
    doc.rect(0, 0, W, 2.5, 'F');

    // Church name — massive
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...C.white);
    doc.text('FINANZAS JÓVENES', M, 22);

    // Sub-label in orange
    doc.setFontSize(7);
    doc.setTextColor(...C.orange);
    doc.setCharSpace(3);
    doc.text('REPORTE FINANCIERO OFICIAL', M, 30);
    doc.setCharSpace(0);

    // Period + date right-aligned
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.gray300);
    const periodLabel = `${format(new Date(range.from), 'dd MMM', { locale: es })} — ${format(new Date(range.to), 'dd MMM yyyy', { locale: es })}`;
    doc.text(periodLabel, W - M, 22, { align: 'right' });
    doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}`, W - M, 30, { align: 'right' });

    // Thin orange divider
    doc.setDrawColor(...C.orange);
    doc.setLineWidth(0.4);
    doc.line(M, 47, W - M, 47);

    let y = 62;

    /* ── SECTION LABEL ── */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray600);
    doc.setCharSpace(3);
    doc.text('RESUMEN EJECUTIVO', M, y);
    doc.setCharSpace(0);
    y += 6;

    /* ── 3 SUMMARY BOXES ── */
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

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...C.black);
      doc.text(box.value, x + 6, y + 19);

      // Sign circle
      doc.setFillColor(...box.accent);
      doc.circle(x + boxW - 7, y + 7, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...C.white);
      doc.text(box.sign, x + boxW - 7, y + 9.2, { align: 'center' });
    });

    y += boxH + 10;

    /* ── BALANCE HIGHLIGHT STRIP ── */
    const positive = data.summary.netBalance >= 0;
    doc.setFillColor(...(positive ? C.green : C.red));
    doc.roundedRect(M, y, W - M * 2, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.white);
    doc.setCharSpace(1);
    doc.text(
      `${positive ? '▲ SUPERÁVIT' : '▼ DÉFICIT'} · ${formatCurrency(data.summary.netBalance)}`,
      W / 2, y + 6.5, { align: 'center' }
    );
    doc.setCharSpace(0);
    y += 18;

    /* ── CATEGORIES SECTION (if available) ── */
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

      data.categories.forEach((cat: any, i: number) => {
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

        // Mini bar
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

    const tableRows = data.transactions.map((t: any) => [
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

    // Signature line
    doc.setDrawColor(...C.black);
    doc.setLineWidth(0.6);
    doc.line(M, sigY + 22, M + 65, sigY + 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.black);
    doc.text('Tesorero(a)', M, sigY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.gray600);
    doc.text('Sociedad de Jóvenes · Iglesia Central', M, sigY + 27);

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
      doc.text('ChurchFlow · Finanzas Jóvenes · Iglesia Central', M, H - 4.5);
      doc.text(`Pág. ${p} / ${totalPages}`, W - M, H - 4.5, { align: 'right' });
      doc.setFillColor(...C.orange);
      doc.rect(0, H - 1.5, W, 1.5, 'F');
    }

    doc.save(`ChurchFlow_${range.from}_${range.to}.pdf`);
  };

  /* ══════════════════════════════════════════════════════
     DATA FETCH
  ══════════════════════════════════════════════════════ */
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/report?from=${range.from}&to=${range.to}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Conciliando cuentas...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-0">

      {/* ── HEADER ── */}
      <div className="mb-12 flex flex-col md:flex-row justify-between md:items-end gap-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
            Centro de <span className="text-[var(--brand-primary)]">Reportes</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#8c7f72] mt-4">
            Auditoría y control de flujo de caja
          </p>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 bg-[#13151f] p-4 rounded-[2.5rem] md:rounded-[3rem] border-2 border-white/5 shadow-2xl w-full lg:w-auto">
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[8px] font-black text-gray-500 uppercase ml-2">Desde</span>
              <input
                type="date" value={range.from}
                onChange={e => setRange({ ...range, from: e.target.value })}
                className="bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand-primary)] color-scheme-dark w-full text-white"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[8px] font-black text-gray-500 uppercase ml-2">Hasta</span>
              <input
                type="date" value={range.to}
                onChange={e => setRange({ ...range, to: e.target.value })}
                className="bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand-primary)] color-scheme-dark w-full text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 h-auto md:h-14 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
            <Button
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white px-4 py-3 md:h-full rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all border border-green-600/20 whitespace-nowrap flex-1 md:flex-none"
            >
              <MessageCircle size={14} className="mr-1.5 md:mr-2" /> WhatsApp
            </Button>
            <Link href="/presentation" target="_blank" className="md:h-full flex-1 md:flex-none">
              <Button className="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-3 w-full md:h-full rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all border border-blue-600/20 whitespace-nowrap">
                <Presentation size={14} className="mr-1.5 md:mr-2" /> En Vivo
              </Button>
            </Link>
            <Button
              onClick={generatePDF}
              className="bg-[var(--brand-primary)] text-white px-4 py-3 md:px-6 md:h-full rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all flex-1 md:flex-none whitespace-nowrap"
            >
              <Download size={14} className="mr-1.5 md:mr-2" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* ── WHATSAPP MODAL ── */}
          <AnimatePresence>
            {showWhatsAppModal && (
              <div
                className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
                onClick={() => setShowWhatsAppModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 w-full max-w-[95vw] md:max-w-sm shadow-2xl text-[#0a0c14] overflow-hidden relative"
                  onClick={e => e.stopPropagation()}
                >
                  <button onClick={() => setShowWhatsAppModal(false)} className="absolute top-6 right-6 text-black/20 hover:text-black transition-all">
                    <X size={24} />
                  </button>

                  <div id="whatsapp-infographic" className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <TrendingUp className="text-orange-600 h-8 w-8" strokeWidth={3} />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-1">Cierre de Mes</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8">
                      {format(new Date(), 'MMMM yyyy', { locale: es })}
                    </p>

                    <div className="space-y-6">
                      <div className="bg-green-50 p-6 rounded-[2rem]">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-600/60 mb-1">Recaudado</p>
                        <h4 className="text-3xl font-black italic text-green-600">+{formatCurrency(data.summary.totalIncome)}</h4>
                      </div>
                      <div className="bg-red-50 p-6 rounded-[2rem]">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600/60 mb-1">Invertido / Gastos</p>
                        <h4 className="text-3xl font-black italic text-red-600">-{formatCurrency(data.summary.totalExpense)}</h4>
                      </div>
                      <div className="bg-[#0a0c14] p-8 rounded-[2.5rem]">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Balance en Caja</p>
                        <h4 className="text-4xl font-black italic text-white">{formatCurrency(data.summary.netBalance)}</h4>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
                        &quot;Fieles en lo poco, sobre mucho te pondré&quot;
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 text-center space-y-4">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `📊 *REPORTE FINANCIERO - ${format(new Date(), 'MMMM yyyy', { locale: es }).toUpperCase()}*\n\n` +
                        `💰 *Recaudado:* ${formatCurrency(data.summary.totalIncome)}\n` +
                        `🛑 *Invertido:* ${formatCurrency(data.summary.totalExpense)}\n` +
                        `🏦 *Balance en Caja:* ${formatCurrency(data.summary.netBalance)}\n\n` +
                        `_"Fieles en lo poco, sobre mucho te pondré."_`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest py-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 no-underline"
                    >
                      <MessageCircle size={18} /> Enviar Mensaje de Texto
                    </a>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                      <ImageIcon size={12} /> O toma un Capture para enviar la imagen
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="rounded-[3rem] bg-green-500 text-white p-8 relative overflow-hidden group shadow-2xl">
              <ArrowUpCircle className="absolute top-[-20px] right-[-20px] h-40 w-40 opacity-10 rotate-12" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Ingresos del Periodo</p>
              <h3 className="text-5xl font-black italic tracking-tighter">{formatCurrency(data.summary.totalIncome)}</h3>
            </Card>

            <Card className="rounded-[3rem] bg-red-500 text-white p-8 relative overflow-hidden group shadow-2xl">
              <ArrowDownCircle className="absolute top-[-20px] right-[-20px] h-40 w-40 opacity-10 rotate-12" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Gastos del Periodo</p>
              <h3 className="text-5xl font-black italic tracking-tighter">{formatCurrency(data.summary.totalExpense)}</h3>
            </Card>

            <Card className="rounded-[3rem] bg-[#1a1714] text-white p-8 border-4 border-[var(--brand-primary)] shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] mb-2">Balance Neto</p>
              <h3 className={cn('text-5xl font-black italic tracking-tighter', data.summary.netBalance >= 0 ? 'text-green-400' : 'text-red-400')}>
                {formatCurrency(data.summary.netBalance)}
              </h3>
            </Card>
          </div>

          {/* ── CATEGORIES + TRANSACTIONS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-5 rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-xl">
              <CardHeader className="px-0 pb-8 border-b border-white/5 mb-6">
                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                  <PieChart className="text-[var(--brand-primary)]" /> Resumen por Categorías
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {data.categories.map((cat: any) => (
                  <div key={cat.name} className="group">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <p className="text-[10px] font-black uppercase text-gray-400">{cat.name}</p>
                      <p className={cn('text-xs font-black', cat.type === 'income' ? 'text-green-500' : 'text-red-500')}>
                        {formatCurrency(cat.total)}
                      </p>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', cat.type === 'income' ? 'bg-green-500' : 'bg-red-500')}
                        style={{ width: `${Math.min(100, (cat.total / (cat.type === 'income' ? data.summary.totalIncome : data.summary.totalExpense)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-7 rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-xl">
              <CardHeader className="px-0 pb-8 border-b border-white/5 mb-6">
                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                  <FileText className="text-blue-500" /> Detalle de Movimientos
                </CardTitle>
              </CardHeader>
              <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                {data.transactions.map((t: any) => (
                  <div key={t.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/[0.05] transition-all">
                    <div>
                      <p className="text-[8px] font-black text-gray-500 uppercase">
                        {format(new Date(t.date), 'dd MMM yyyy', { locale: es })}
                      </p>
                      <p className="text-xs font-black text-white uppercase truncate max-w-[250px]">{t.description}</p>
                    </div>
                    <p className={cn('font-black italic text-sm', t.type === 'income' ? 'text-green-500' : 'text-red-500')}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
