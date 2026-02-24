"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { PlusCircle, Edit, Trash2, ArrowUpRight, ArrowDownRight, Search, Download, FileText, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TransactionType;
  category: { id: string; name: string; type: TransactionType };
  amount: number;
  date: string;
  description: string;
  member?: { id: string; name: string } | null;
  event?: { id: string; name: string } | null;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [search, setSearch] = useState('');
  const [isCompact, setIsCompact] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' }); // Nuevas fechas

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/transactions' : `/api/transactions?type=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      setTransactions(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
                         t.category.name.toLowerCase().includes(search.toLowerCase());
    
    const txDate = new Date(t.date);
    const matchesFrom = dateRange.from ? txDate >= new Date(dateRange.from) : true;
    const matchesTo = dateRange.to ? txDate <= new Date(dateRange.to) : true;

    return matchesSearch && matchesFrom && matchesTo;
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const exportToExcel = async () => {
    try {
      const settingsRes = await fetch('/api/settings');
      const settings = await settingsRes.json();
      const brandColor = (settings.primaryColor || '#e85d26').replace('#', '');
      const brandColorARGB = `FF${brandColor.toUpperCase()}`;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte Finanzas');

      if (settings.logoUrl) {
        try {
          const response = await fetch(settings.logoUrl);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const imageId = workbook.addImage({
            buffer: arrayBuffer,
            extension: 'jpeg',
          });
          worksheet.addImage(imageId, {
            tl: { col: 0.2, row: 0.2 },
            ext: { width: 60, height: 60 }
          });
        } catch (imgError) {}
      }

      worksheet.columns = [
        { header: 'FECHA', key: 'fecha', width: 15 },
        { header: 'DESCRIPCIÓN', key: 'desc', width: 40 },
        { header: 'CATEGORÍA', key: 'cat', width: 20 },
        { header: 'TIPO', key: 'tipo', width: 12 },
        { header: 'MONTO (RD$)', key: 'monto', width: 15 },
        { header: 'MIEMBRO', key: 'miembro', width: 25 },
        { header: 'EVENTO / FONDO', key: 'evento', width: 25 },
      ];

      worksheet.mergeCells('B1:G2');
      const titleCell = worksheet.getCell('B1');
      titleCell.value = settings.churchName.toUpperCase();
      titleCell.font = { name: 'Arial Black', size: 18, color: { argb: brandColorARGB } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells('B3:G3');
      const subtitleCell = worksheet.getCell('B3');
      subtitleCell.value = `REPORTE DE MOVIMIENTOS - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
      subtitleCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF8C7F72' } };
      subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.addRow([]);
      worksheet.addRow([]);

      const headerRow = worksheet.addRow(['FECHA', 'DESCRIPCIÓN', 'CATEGORÍA', 'TIPO', 'MONTO', 'MIEMBRO', 'EVENTO']);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1714' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.alignment = { horizontal: 'center' };
        cell.border = { bottom: { style: 'thick', color: { argb: brandColorARGB } } };
      });

      filtered.forEach((t) => {
        const row = worksheet.addRow([
          format(new Date(t.date), 'dd/MM/yyyy'),
          t.description,
          t.category.name,
          t.type === 'income' ? 'INGRESO' : 'GASTO',
          t.amount,
          t.member?.name || '-',
          t.event?.name || 'Caja General'
        ]);
        const colorCell = row.getCell(4);
        colorCell.font = { bold: true, color: { argb: t.type === 'income' ? 'FF2A8A5E' : 'FFDC3545' } };
        row.getCell(5).numFmt = '"RD$ "#,##0';
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Finanzas_${settings.churchName}_${format(new Date(), 'ddMMyy')}.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };

  const generateReceipt = async (t: Transaction) => {
    const settingsRes = await fetch('/api/settings');
    const settings = await settingsRes.json();
    const hex = settings.primaryColor || '#e85d26';
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);

    const doc = new jsPDF() as any;
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(settings.churchName.toUpperCase(), 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("COMPROBANTE FINANCIERO", 105, 30, { align: "center" });
    
    doc.autoTable({
      startY: 70,
      head: [['Descripción', 'Categoría', 'Tipo', 'Monto']],
      body: [[t.description, t.category.name, t.type === 'income' ? 'Ingreso' : 'Gasto', fmt(t.amount)]],
      headStyles: { fillStyle: [r, g, b] }
    });
    
    doc.save(`Recibo_${t.id.substring(0, 8)}.pdf`);
  };

  return (
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .tx-row { animation: slideUp 0.25s ease both; }
        .btn-filter-active { background: var(--brand-primary) !important; border-color: var(--brand-primary) !important; color: #fff !important; }
        .btn-nueva-tx { background: var(--brand-primary); box-shadow: 0 4px 20px color-mix(in srgb, var(--brand-primary) 40%, transparent); }
        .grid-bg { background-image: linear-gradient(color-mix(in srgb, var(--brand-primary) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 5%, transparent) 1px, transparent 1px); background-size: 40px 40px; }
      `}</style>

      <div style={{ background: 'linear-gradient(160deg, #0f1117 0%, #1a1d2e 60%, #0f1117 100%)', padding: '40px 40px 56px', position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0 }} />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>Transacciones</h1>
            <div className="flex gap-3">
              <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"><Download size={14} /> Excel</button>
              <Link href="/transactions/new"><button className="btn-nueva-tx flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest"><PlusCircle size={14} /> Nueva</button></Link>
            </div>
          </div>
          <div className="flex gap-6 mt-8">
            <div className="border-l-2 border-[#4ade80] pl-4"><p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Ingresos</p><p className="text-xl font-black text-[#4ade80]">{fmt(totalIncome)}</p></div>
            <div className="border-l-2 border-[#f87171] pl-4"><p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Gastos</p><p className="text-xl font-black text-[#f87171]">{fmt(totalExpense)}</p></div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6">
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-[#1a1d2e] p-3 rounded-2xl border border-white/5 shadow-2xl">
          <div className="flex gap-1">
            {['all', 'income', 'expense'].map(f => (
              <button key={f} onClick={() => setFilter(f as any)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === f ? "bg-[var(--brand-primary)] text-white" : "text-gray-500 hover:text-white")}>{f === 'all' ? 'Todo' : f === 'income' ? 'Ingresos' : 'Gastos'}</button>
            ))}
          </div>
          
          <button 
            onClick={() => setIsCompact(!isCompact)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2", isCompact ? "bg-white text-black border-white" : "text-gray-500 border-gray-800")}
          >
            {isCompact ? <EyeOff size={14} /> : <Eye size={14} />} {isCompact ? "Normal" : "Rápida"}
          </button>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1">
            <span className="text-[8px] font-black text-gray-500 uppercase">Desde</span>
            <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent border-none outline-none text-white text-[9px] font-bold uppercase color-scheme-dark" />
            <span className="text-[8px] font-black text-gray-500 uppercase ml-2">Hasta</span>
            <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent border-none outline-none text-white text-[9px] font-bold uppercase color-scheme-dark" />
          </div>

          <div className="ml-auto flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-500" />
            <input type="text" placeholder="BUSCAR..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-white text-[10px] font-black uppercase w-32" />
          </div>
        </div>

        <div className={cn("bg-[#13151f] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl transition-all", isCompact ? "p-2" : "p-0")}>
          <table className="w-full text-left">
            <thead className={cn("bg-white/5", isCompact ? "hidden" : "block")}>
              <tr className="grid grid-cols-12 px-8 py-4">
                <th className="col-span-5 text-[9px] font-black uppercase tracking-widest text-gray-500">Descripción</th>
                <th className="col-span-3 text-[9px] font-black uppercase tracking-widest text-gray-500 text-center">Categoría</th>
                <th className="col-span-2 text-[9px] font-black uppercase tracking-widest text-gray-500 text-right">Monto</th>
                <th className="col-span-2 text-[9px] font-black uppercase tracking-widest text-gray-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((t) => (
                <tr key={t.id} className={cn(
                  "grid grid-cols-12 items-center hover:bg-white/[0.02] transition-all",
                  isCompact ? "px-4 py-2" : "px-8 py-5"
                )}>
                  <td className="col-span-5 flex items-center gap-3">
                    <div className={cn("rounded-lg flex items-center justify-center shrink-0", isCompact ? "w-6 h-6" : "w-10 h-10", t.type === 'income' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                      {t.type === 'income' ? <ArrowUpRight size={isCompact ? 12 : 18} /> : <ArrowDownRight size={isCompact ? 12 : 18} />}
                    </div>
                    <div className="truncate">
                      <p className={cn("font-black uppercase tracking-tight text-white", isCompact ? "text-[10px]" : "text-sm")}>{t.description}</p>
                      {!isCompact && <p className="text-[9px] font-bold text-gray-500 uppercase">{format(new Date(t.date), 'dd MMMM yyyy', { locale: es })}</p>}
                    </div>
                  </td>
                  <td className="col-span-3 text-center">
                    <span className={cn("px-3 py-1 rounded-full bg-white/5 text-gray-400 font-black uppercase tracking-tighter", isCompact ? "text-[8px]" : "text-[10px]")}>{t.category.name}</span>
                  </td>
                  <td className={cn("col-span-2 text-right font-black italic", isCompact ? "text-xs" : "text-lg", t.type === 'income' ? "text-green-500" : "text-red-500")}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </td>
                  <td className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => generateReceipt(t)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"><FileText size={isCompact ? 12 : 14} /></button>
                    <Link href={`/transactions/edit/${t.id}`} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all"><Edit size={isCompact ? 12 : 14} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
