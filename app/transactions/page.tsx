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
import { PlusCircle, Edit, Trash2, ArrowUpRight, ArrowDownRight, Search, Download, FileText, Eye, EyeOff, Calendar } from 'lucide-react';
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
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

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
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 min-h-screen bg-[#0a0c14] pb-20">
      <style jsx global>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .tx-row { animation: slideUp 0.25s ease both; }
        .grid-bg { background-image: linear-gradient(rgba(232,93,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(232,93,38,0.05) 1px, transparent 1px); background-size: 40px 40px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }
      `}</style>

      {/* Hero Header Responsivo */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1117] via-[#1a1d2e] to-[#0f1117] px-6 py-12 md:px-12 md:py-16">
        <div className="grid-bg absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">Transacciones</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                <div className="border-l-4 border-green-500 pl-4 py-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ingresos</p>
                  <p className="text-xl md:text-3xl font-black text-green-500 tracking-tighter">{fmt(totalIncome)}</p>
                </div>
                <div className="border-l-4 border-red-500 pl-4 py-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gastos</p>
                  <p className="text-xl md:text-3xl font-black text-red-500 tracking-tighter">{fmt(totalExpense)}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              <button onClick={exportToExcel} className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl"><Download size={16} /> Excel</button>
              <Link href="/transactions/new" className="w-full">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[var(--brand-primary)] text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-orange-500/20"><PlusCircle size={16} /> Nueva</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Barra de Filtros Pro y Responsiva */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-[#13151f] p-4 md:p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'income', 'expense'].map(f => (
              <button key={f} onClick={() => setFilter(f as any)} className={cn("px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === f ? "bg-[var(--brand-primary)] text-white shadow-lg shadow-orange-500/20" : "text-gray-500 hover:bg-white/5")}>{f === 'all' ? 'Todo' : f === 'income' ? 'Ingresos' : 'Gastos'}</button>
            ))}
            <button 
              onClick={() => setIsCompact(!isCompact)}
              className={cn("hidden md:flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2", isCompact ? "bg-white text-black border-white" : "text-gray-500 border-gray-800")}
            >
              {isCompact ? <EyeOff size={14} /> : <Eye size={14} />} {isCompact ? "Normal" : "Rápida"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-2 flex-1">
            <div className="flex items-center gap-2 px-3 w-full sm:w-auto">
              <span className="text-[8px] font-black text-gray-500 uppercase whitespace-nowrap">De:</span>
              <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent border-none outline-none text-white text-[10px] font-black uppercase w-full color-scheme-dark" />
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 px-3 w-full sm:w-auto">
              <span className="text-[8px] font-black text-gray-500 uppercase whitespace-nowrap">A:</span>
              <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent border-none outline-none text-white text-[10px] font-black uppercase w-full color-scheme-dark" />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-5 py-3 lg:w-64">
            <Search size={16} className="text-gray-500 shrink-0" />
            <input type="text" placeholder="BUSCAR..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-white text-[10px] font-black uppercase w-full" />
          </div>
        </div>

        {/* Tabla Adaptativa (Cards en móvil, Tabla en PC) */}
        <div className="bg-[#13151f] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Movimiento</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Categoría</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Monto</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", t.type === 'income' ? "bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : "bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]")}>
                          {t.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black uppercase tracking-tight text-white text-sm truncate max-w-[300px]">{t.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar size={10} className="text-gray-600" />
                            <p className="text-[10px] font-bold text-gray-500 uppercase">{format(new Date(t.date), 'dd MMMM yyyy', { locale: es })}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-4 py-1.5 rounded-xl bg-white/5 text-gray-400 font-black uppercase text-[10px] tracking-tighter border border-white/5 group-hover:border-white/10 transition-all">{t.category.name}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className={cn("font-black italic text-xl tracking-tighter", t.type === 'income' ? "text-green-500" : "text-red-500")}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => generateReceipt(t)} className="p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-lg"><FileText size={16} /></button>
                        <Link href={`/transactions/edit/${t.id}`} className="p-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all border border-white/5"><Edit size={16} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil (Cards) */}
          <div className="md:hidden divide-y divide-white/5">
            {filtered.map((t) => (
              <div key={t.id} className="p-6 space-y-4 bg-white/[0.01]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", t.type === 'income' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                      {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <p className="font-black uppercase text-xs text-white leading-tight">{t.description}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{format(new Date(t.date), 'dd MMM yy', { locale: es })}</p>
                    </div>
                  </div>
                  <p className={cn("font-black italic text-lg tracking-tighter", t.type === 'income' ? "text-green-500" : "text-red-500")}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-500 font-black uppercase text-[8px] tracking-widest">{t.category.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => generateReceipt(t)} className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400"><FileText size={14} /></button>
                    <Link href={`/transactions/edit/${t.id}`} className="p-2.5 rounded-lg bg-white/5 text-gray-400"><Edit size={14} /></Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filtered.length === 0 && (
            <div className="p-20 text-center text-gray-600">
              <Search className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p className="font-black uppercase text-xs tracking-widest">Sin resultados encontrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
