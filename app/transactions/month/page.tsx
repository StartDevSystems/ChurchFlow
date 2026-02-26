"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { PlusCircle, Edit, Trash2, ArrowUpRight, ArrowDownRight, Search, Download, FileText, Eye, EyeOff, Calendar, ArrowLeftRight, ChevronRight, X, DollarSign, Loader2, Save, Activity, ArrowLeft } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

type MovementType = 'income' | 'expense' | 'transfer';

interface UnifiedMovement {
  id: string; type: MovementType; amount: number; date: string; description: string;
  categoryName?: string; memberName?: string; eventName?: string;
  fromEventName?: string; toEventName?: string; raw?: any;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

export default function MonthTransactionsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [movements, setMovements] = useState<UnifiedMovement[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | MovementType>('all');
  const [search, setSearch] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<UnifiedMovement | null>(null);

  // Default to current month
  const now = new Date();
  const start = format(startOfMonth(now), 'yyyy-MM-dd');
  const end = format(endOfMonth(now), 'yyyy-MM-dd');
  const [dateRange] = useState({ from: start, to: end });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, trRes, evRes] = await Promise.all([
        fetch('/api/transactions'), fetch('/api/transfers'), fetch('/api/events')
      ]);
      const txData = await txRes.json();
      const trData = await trRes.json();
      const evData = await evRes.json();
      setEvents(evData);

      const unifiedTx = txData.map((t: any) => ({
        id: t.id, type: t.type, amount: t.amount, date: t.date, description: t.description,
        categoryName: t.category?.name || 'Gasto', memberName: t.member?.name, eventName: t.event?.name || 'Caja General', raw: t
      }));

      const unifiedTr = trData.map((t: any) => ({
        id: t.id, type: 'transfer', amount: t.amount, date: t.date, description: t.description,
        fromEventName: t.fromEventId ? evData.find((e:any) => e.id === t.fromEventId)?.name : 'Caja General',
        toEventName: t.toEventId ? evData.find((e:any) => e.id === t.toEventId)?.name : 'Caja General', raw: t
      }));

      const all = [...unifiedTx, ...unifiedTr].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMovements(all);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['income', 'expense', 'transfer'].includes(type)) {
      setFilter(type as MovementType);
    }
  }, [searchParams]);

  const filtered = movements.filter(m => {
    const matchesFilter = filter === 'all' || m.type === filter;
    const matchesSearch = m.description.toLowerCase().includes(search.toLowerCase()) || (m.categoryName?.toLowerCase() || '').includes(search.toLowerCase());
    const txDate = new Date(m.date);
    return matchesFilter && matchesSearch && (txDate >= new Date(dateRange.from)) && (txDate <= new Date(dateRange.to));
  });

  if (loading && movements.length === 0) return <div className="flex items-center justify-center min-h-screen bg-[#0a0c14]"><Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" /></div>;

  return (
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 min-h-screen bg-[#0a0c14] pb-20 overflow-x-hidden text-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1117] via-[#1a1d2e] to-[#0f1117] px-6 py-12 md:px-12 md:py-16 border-b border-white/5">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(232,93,38,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,93,38,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-7xl mx-auto text-center md:text-left">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <button 
                onClick={() => router.back()} 
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-4">Resumen <span className="text-[var(--brand-primary)]">Mensual</span></h1>
                <div className="flex justify-center md:justify-start gap-6 mt-6">
                  <div className="border-l-4 border-green-500 pl-4 text-left">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ingresos Mes</p>
                    <p className="text-xl md:text-3xl font-black text-green-500">{fmt(filtered.filter(m => m.type === 'income').reduce((s,m) => s+m.amount, 0))}</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4 text-left">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Gastos Mes</p>
                    <p className="text-xl md:text-3xl font-black text-red-500">{fmt(filtered.filter(m => m.type === 'expense').reduce((s,m) => s+m.amount, 0))}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[var(--brand-primary)] font-black uppercase text-xs tracking-[0.2em] italic">
              {format(now, 'MMMM yyyy', { locale: es })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="flex flex-col xl:flex-row gap-4 mb-10 bg-[#13151f] p-4 md:p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="flex flex-wrap gap-2">{['all', 'income', 'expense', 'transfer'].map(f => (<button key={f} onClick={() => setFilter(f as any)} className={cn("px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", filter === f ? "bg-[var(--brand-primary)] text-white shadow-lg" : "text-gray-500 hover:bg-white/5")}>{f === 'all' ? 'Todo' : f === 'income' ? 'Ingresos' : f === 'expense' ? 'Gastos' : 'Traspasos'}</button>))}</div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl lg:w-64"><Search size={16} className="text-gray-500" /><input type="text" placeholder="BUSCAR..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-white text-[10px] font-black uppercase w-full" /></div>
        </div>

        <div className="bg-[#13151f] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-white/5 border-b border-white/5"><tr><th className="px-8 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">Movimiento</th><th className="px-8 py-5 text-[9px] font-black uppercase text-gray-500 text-center tracking-widest">Detalle / Flujo</th><th className="px-8 py-5 text-[9px] font-black uppercase text-gray-500 text-right tracking-widest">Monto</th><th className="px-8 py-5 text-[9px] font-black uppercase text-gray-500 text-right tracking-widest">Acciones</th></tr></thead>
              <tbody className="divide-y divide-white/5">{filtered.map((m) => (<tr key={m.id} className="hover:bg-white/[0.02] transition-all group"><td className="px-8 py-6 flex items-center gap-4"><div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", m.type === 'income' ? "bg-green-500/10 text-green-500" : m.type === 'expense' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-400")}>{m.type === 'income' ? <ArrowUpRight size={20} /> : m.type === 'expense' ? <ArrowDownRight size={20} /> : <ArrowLeftRight size={20} />}</div><div className="min-w-0"><p className="font-black uppercase text-sm truncate text-white max-w-[250px]">{m.description}</p><p className="text-[9px] font-bold text-gray-500 uppercase">{format(new Date(m.date), 'dd MMMM yyyy', { locale: es })}</p></div></td><td className="px-8 py-6 text-center">{m.type === 'transfer' ? <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase text-blue-400 italic"><span>{m.fromEventName}</span><ChevronRight size={12} /><span>{m.toEventName}</span></div> : <span className="px-4 py-1.5 rounded-xl bg-white/5 text-gray-400 font-black uppercase text-[9px] border border-white/5">{m.categoryName}</span>}</td><td className="px-8 py-6 text-right font-black italic text-xl tracking-tighter" style={{ color: m.type === 'income' ? '#22c55e' : m.type === 'expense' ? '#ef4444' : '#60a5fa' }}>{m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''}{fmt(m.amount)}</td><td className="px-8 py-6 flex justify-end gap-2 text-white"><button onClick={() => setSelectedMovement(m)} className="p-3 rounded-xl bg-white/5 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><FileText size={16} /> Ver Detalle</button></td></tr>))}</tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-white/5">
            {filtered.map((m) => (
              <div key={m.id} className="p-6 space-y-4" onClick={() => setSelectedMovement(m)}>
                <div className="flex justify-between items-start"><div className="flex items-center gap-3"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", m.type === 'income' ? "bg-green-500/10 text-green-500" : m.type === 'expense' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-400")}>{m.type === 'income' ? <ArrowUpRight size={18} /> : m.type === 'expense' ? <ArrowDownRight size={18} /> : <ArrowLeftRight size={18} />}</div><div><p className="font-black uppercase text-xs text-white leading-tight">{m.description}</p><p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{format(new Date(m.date), 'dd MMM yy', { locale: es })}</p></div></div><p className="font-black italic text-lg tracking-tighter" style={{ color: m.type === 'income' ? '#22c55e' : m.type === 'expense' ? '#ef4444' : '#60a5fa' }}>{m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''}{fmt(m.amount)}</p></div>
                <div className="flex justify-between items-center pt-2">{m.type === 'transfer' ? <p className="text-[8px] font-black uppercase text-blue-400 italic">{m.fromEventName} → {m.toEventName}</p> : <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-500 font-black uppercase text-[8px] tracking-widest">{m.categoryName}</span>}<button className="p-2.5 rounded-lg bg-white/5 text-[var(--brand-primary)]"><FileText size={14} /></button></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedMovement && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" onClick={() => setSelectedMovement(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#13151f] border-2 border-white/10 rounded-[3rem] p-8 md:p-10 w-full max-w-lg shadow-2xl relative overflow-hidden text-white" onClick={e => e.stopPropagation()}>
              <div className={cn("absolute top-0 left-0 right-0 h-1.5", selectedMovement.type === 'income' ? "bg-green-500" : selectedMovement.type === 'expense' ? "bg-red-500" : "bg-blue-500")} />
              <button onClick={() => setSelectedMovement(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-all p-2"><X size={24} /></button>
              <div className="text-center mb-10"><div className={cn("w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center border shadow-inner", selectedMovement.type === 'income' ? "bg-green-500/10 border-green-500/20 text-green-500" : selectedMovement.type === 'expense' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-400")}>{selectedMovement.type === 'income' ? <ArrowUpRight size={40} /> : selectedMovement.type === 'expense' ? <ArrowDownRight size={40} /> : <ArrowLeftRight size={40} />}</div><h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Detalle del <span className={cn(selectedMovement.type === 'income' ? "text-green-500" : selectedMovement.type === 'expense' ? "text-red-500" : "text-blue-400")}>Movimiento</span></h3><p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Auditoría ChurchFlow v1.3.3</p></div>
              <div className="space-y-8"><div className="grid grid-cols-2 gap-6"><div className="bg-white/5 p-5 rounded-[2rem] border border-white/5"><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Monto Total</p><p className={cn("text-2xl font-black italic tracking-tighter", selectedMovement.type === 'income' ? "text-green-400" : selectedMovement.type === 'expense' ? "text-red-400" : "text-blue-400")}>{fmt(selectedMovement.amount)}</p></div><div className="bg-white/5 p-5 rounded-[2rem] border border-white/5"><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Fecha Registro</p><p className="text-sm font-black uppercase text-white">{format(new Date(selectedMovement.date), 'dd MMMM yyyy', { locale: es })}</p></div></div><div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={40} /></div><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3">Origen / Proyecto</p><p className="text-lg font-black uppercase italic text-white leading-none">{selectedMovement.type === 'transfer' ? `${selectedMovement.fromEventName} → ${selectedMovement.toEventName}` : selectedMovement.eventName}</p><div className="flex gap-2 mt-4"><span className="px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[8px] font-black uppercase tracking-widest border border-[var(--brand-primary)]/20">{selectedMovement.categoryName || 'Transferencia'}</span>{selectedMovement.memberName && <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Responsable: {selectedMovement.memberName}</span>}</div></div><div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5"><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Descripción de la Actividad</p><p className="text-xs text-gray-300 font-medium uppercase tracking-tight leading-relaxed italic">&quot;{selectedMovement.description}&quot;</p></div></div>
              <div className="mt-10 flex gap-3"><Button onClick={() => setSelectedMovement(null)} className="flex-1 py-6 rounded-2xl bg-white/5 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/5">Cerrar Detalle</Button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
