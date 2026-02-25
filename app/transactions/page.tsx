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
import { PlusCircle, Edit, Trash2, ArrowUpRight, ArrowDownRight, Search, Download, FileText, Eye, EyeOff, Calendar, ArrowLeftRight, ChevronRight, X, DollarSign, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/Label';
import { motion, AnimatePresence } from 'framer-motion';

type MovementType = 'income' | 'expense' | 'transfer';

interface UnifiedMovement {
  id: string; type: MovementType; amount: number; date: string; description: string;
  categoryName?: string; memberName?: string; eventName?: string;
  fromEventName?: string; toEventName?: string; raw?: any;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

const TRANSFER_ANIMATIONS = `
  @keyframes floatLeft {
    0%, 100% { transform: rotateY(25deg) rotateX(8deg) translateZ(0px) translateY(0px); }
    50% { transform: rotateY(25deg) rotateX(8deg) translateZ(12px) translateY(-6px); }
  }
  @keyframes floatRight {
    0%, 100% { transform: rotateY(-25deg) rotateX(8deg) translateZ(0px) translateY(0px); }
    50% { transform: rotateY(-25deg) rotateX(8deg) translateZ(12px) translateY(-6px); }
  }
  @keyframes flowParticle {
    0% { left: 20%; opacity: 0; transform: translateY(-50%) scale(0.5); }
    20% { opacity: 1; transform: translateY(-50%) scale(1); }
    80% { opacity: 1; transform: translateY(-50%) scale(1); }
    100% { left: 80%; opacity: 0; transform: translateY(-50%) scale(0.5); }
  }
  @keyframes pulse3d {
    0%, 100% { box-shadow: 0 8px 32px rgba(232,93,38,0.3), 0 0 0 0 rgba(232,93,38,0.2); }
    50% { box-shadow: 0 12px 40px rgba(232,93,38,0.5), 0 0 0 8px rgba(232,93,38,0); }
  }
  .grid-bg { background-image: linear-gradient(rgba(232,93,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(232,93,38,0.05) 1px, transparent 1px); background-size: 40px 40px; }
`;

function TransferVisual({ fromName, toName, amount }: { fromName: string; toName: string; amount: string }) {
  return (
    <div className="relative w-full h-[140px] flex items-center justify-center mb-4" style={{ perspective: '800px' }}>
      <div style={{ width: '130px', height: '85px', borderRadius: '12px', background: 'linear-gradient(135deg, #e85d26, #f5a623)', animation: 'floatLeft 3s ease-in-out infinite, pulse3d 3s ease-in-out infinite', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 14px', boxShadow: '0 8px 32px rgba(232,93,38,0.35)', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <div style={{ width: '28px', height: '20px', borderRadius: '4px', background: 'linear-gradient(135deg, #ffd700, #ffaa00)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }} />
        <div><div className="text-[8px] text-white/70 uppercase tracking-widest font-black mb-0.5">Origen</div><div className="text-[10px] font-black text-white italic uppercase truncate max-w-[100px] leading-none">{fromName}</div></div>
      </div>
      <div className="relative w-[90px] flex shrink-0 flex-col items-center gap-1.5">
        <div className="relative w-full h-5">
          {[0, 1, 2].map(i => (<div key={i} style={{ position: 'absolute', top: '50%', width: '6px', height: '6px', borderRadius: '50%', background: '#e85d26', animation: `flowParticle 1.5s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />))}
          <div className="absolute top-1/2 left-[10%] right-[10%] h-[1.5px] bg-gradient-to-r from-orange-500/20 via-orange-500/80 to-orange-500/20 -translate-y-1/2" />
        </div>
        {amount && parseFloat(amount) > 0 && (<div className="bg-orange-500/15 border border-orange-500/30 rounded-full px-2.5 py-0.5 text-[9px] font-black text-orange-500 whitespace-nowrap">{fmt(parseFloat(amount))}</div>)}
      </div>
      <div style={{ width: '130px', height: '85px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a4d8f, #2a8a5e)', animation: 'floatRight 3s ease-in-out infinite', animationDelay: '0.3s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 14px', boxShadow: '0 8px 32px rgba(26,77,143,0.3)', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <div style={{ width: '28px', height: '20px', borderRadius: '4px', background: 'linear-gradient(135deg, #ffd700, #ffaa00)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }} />
        <div><div className="text-[8px] text-white/70 uppercase tracking-widest font-black mb-0.5">Destino</div><div className="text-[10px] font-black text-white italic uppercase truncate max-w-[100px] leading-none">{toName}</div></div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const [movements, setMovements] = useState<UnifiedMovement[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | MovementType>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showTransfer, setShowTransfer] = useState(false);
  
  const [tfForm, setTfForm] = useState({ 
    fromEventId: 'caja', toEventId: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') 
  });

  const fundName = useCallback((id?: string | null) => {
    if (!id || id === 'caja') return 'Caja General';
    return events.find(e => e.id === id)?.name || 'Evento';
  }, [events]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, trRes, evRes] = await Promise.all([
        fetch('/api/transactions'), fetch('/api/transfers'), fetch('/api/events')
      ]);
      const txData = await txRes.json();
      const trData = await trRes.json();
      const evData = await evRes.json();
      setTransfers(trData);
      setEvents(evData);

      const unifiedTx = txData.map((t: any) => ({
        id: t.id, type: t.type, amount: t.amount, date: t.date, description: t.description,
        categoryName: t.category.name, memberName: t.member?.name, eventName: t.event?.name || 'Caja General', raw: t
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

  const cajaIncome = movements.filter(m => m.type === 'income' && !m.raw?.eventId).reduce((s, m) => s + m.amount, 0);
  const cajaExpense = movements.filter(m => m.type === 'expense' && !m.raw?.eventId).reduce((s, m) => s + m.amount, 0);
  const netCajaTr = transfers.reduce((acc, tr) => { if (!tr.fromEventId) return acc - tr.amount; if (!tr.toEventId) return acc + tr.amount; return acc; }, 0);
  const cajaBalance = cajaIncome - cajaExpense + netCajaTr;

  const getOriginBalance = () => {
    if (tfForm.fromEventId === 'caja') return cajaBalance;
    const ev = events.find(e => e.id === tfForm.fromEventId);
    if (!ev) return 0;
    const relatedTx = movements.filter(m => m.raw?.eventId === ev.id);
    const in_ = relatedTx.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
    const out_ = relatedTx.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
    const netTr = transfers.reduce((acc, tr) => { if (tr.fromEventId === ev.id) return acc - tr.amount; if (tr.toEventId === ev.id) return acc + tr.amount; return acc; }, 0);
    return (in_ - out_) + netTr;
  };

  const originBalance = getOriginBalance();
  const amountNum = parseFloat(tfForm.amount) || 0;
  const afterTransfer = originBalance - amountNum;

  const handleSaveTransfer = async () => {
    if (!tfForm.amount || !tfForm.toEventId) {
      toast({ title: 'Completa monto y destino', variant: 'destructive' });
      return;
    }

    const finalDescription = tfForm.description || `Transferencia de ${fundName(tfForm.fromEventId)} a ${fundName(tfForm.toEventId)}`;

    setSaving(true);
    try {
      const res = await fetch('/api/transfers', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          amount: parseFloat(tfForm.amount), 
          description: finalDescription, 
          date: tfForm.date, 
          fromEventId: tfForm.fromEventId === 'caja' ? null : tfForm.fromEventId, 
          toEventId: tfForm.toEventId === 'caja' ? null : tfForm.toEventId 
        }) 
      });
      if (res.ok) { 
        toast({ title: 'Transferencia Exitosa ✓' }); 
        setShowTransfer(false); 
        fetchData(); 
      } else {
        const err = await res.json();
        toast({ title: 'Error al procesar', description: err.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const filtered = movements.filter(m => {
    const matchesFilter = filter === 'all' || m.type === filter;
    const matchesSearch = m.description.toLowerCase().includes(search.toLowerCase()) || (m.categoryName?.toLowerCase() || '').includes(search.toLowerCase());
    const txDate = new Date(m.date);
    return matchesFilter && matchesSearch && (dateRange.from ? txDate >= new Date(dateRange.from) : true) && (dateRange.to ? txDate <= new Date(dateRange.to) : true);
  });

  const handleDelete = async (id: string, type: MovementType) => {
    try {
      const endpoint = type === 'transfer' ? `/api/transfers/${id}` : `/api/transactions/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Movimiento eliminado correctamente' });
        fetchData();
      } else {
        toast({ title: 'Error al eliminar', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error de red', variant: 'destructive' });
    }
  };

  if (loading && movements.length === 0) return <div className="flex items-center justify-center min-h-screen bg-[#0a0c14]"><Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" /></div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TRANSFER_ANIMATIONS }} />
      <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 min-h-screen bg-[#0a0c14] pb-20 overflow-x-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1117] via-[#1a1d2e] to-[#0f1117] px-6 py-12 md:px-12 md:py-16 border-b border-white/5">
          <div className="grid-bg absolute inset-0 pointer-events-none" />
          <div className="relative z-10 max-w-7xl mx-auto text-white text-center md:text-left">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div><h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-4">Movimientos</h1><div className="flex justify-center md:justify-start gap-6 mt-6"><div className="border-l-4 border-green-500 pl-4 text-left"><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ingresos</p><p className="text-xl md:text-3xl font-black text-green-500">{fmt(movements.filter(m => m.type === 'income').reduce((s,m) => s+m.amount, 0))}</p></div><div className="border-l-4 border-red-500 pl-4 text-left"><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Gastos</p><p className="text-xl md:text-3xl font-black text-red-500">{fmt(movements.filter(m => m.type === 'expense').reduce((s,m) => s+m.amount, 0))}</p></div></div></div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"><button onClick={() => setShowTransfer(true)} className="flex items-center justify-center gap-2 px-8 py-5 rounded-2xl bg-white/5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl"><ArrowLeftRight size={16} /> Transferir</button><Link href="/transactions/new" className="flex-1 sm:flex-none"><button className="w-full flex items-center justify-center gap-2 px-8 py-5 rounded-2xl bg-[var(--brand-primary)] text-white font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all"><PlusCircle size={16} /> Nueva</button></Link></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 text-white">
          <div className="flex flex-col xl:flex-row gap-4 mb-10 bg-[#13151f] p-4 md:p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="flex flex-wrap gap-2">{['all', 'income', 'expense', 'transfer'].map(f => (<button key={f} onClick={() => setFilter(f as any)} className={cn("px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", filter === f ? "bg-[var(--brand-primary)] text-white shadow-lg" : "text-gray-500 hover:bg-white/5")}>{f === 'all' ? 'Todo' : f === 'income' ? 'Ingresos' : f === 'expense' ? 'Gastos' : 'Mover'}</button>))}</div>
            <div className="flex-1 flex flex-col sm:flex-row gap-2 bg-white/5 p-2 rounded-2xl"><div className="flex items-center gap-2 px-3 w-full"><span className="text-[8px] font-black text-gray-500 uppercase">De:</span><input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent border-none outline-none text-white text-[10px] font-black uppercase w-full color-scheme-dark" /></div><div className="flex items-center gap-2 px-3 w-full"><span className="text-[8px] font-black text-gray-500 uppercase">A:</span><input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent border-none outline-none text-white text-[10px] font-black uppercase w-full color-scheme-dark" /></div></div>
            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl lg:w-64"><Search size={16} className="text-gray-500" /><input type="text" placeholder="BUSCAR..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-white text-[10px] font-black uppercase w-full" /></div>
          </div>

          <div className="bg-[#13151f] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-white/5 border-b border-white/5"><tr><th className="px-8 py-5 text-[9px] font-black uppercase text-gray-500 tracking-widest">Movimiento</th><th className="px-8 py-5 text-[9px] font-black uppercase text-gray-500 text-center tracking-widest">Detalle / Flujo</th><th className="px-8 py-5 text-[9px] font-black uppercase text-gray-500 text-right tracking-widest">Monto</th><th className="px-8 py-5 text-[9px] font-black uppercase text-gray-500 text-right tracking-widest">Acciones</th></tr></thead>
                <tbody className="divide-y divide-white/5">{filtered.map((m) => (<tr key={m.id} className="hover:bg-white/[0.02] transition-all group"><td className="px-8 py-6 flex items-center gap-4"><div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", m.type === 'income' ? "bg-green-500/10 text-green-500" : m.type === 'expense' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-400")}>{m.type === 'income' ? <ArrowUpRight size={20} /> : m.type === 'expense' ? <ArrowDownRight size={20} /> : <ArrowLeftRight size={20} />}</div><div className="min-w-0"><p className="font-black uppercase text-sm truncate text-white max-w-[250px]">{m.description}</p><p className="text-[9px] font-bold text-gray-500 uppercase">{format(new Date(m.date), 'dd MMMM yyyy', { locale: es })}</p></div></td><td className="px-8 py-6 text-center">{m.type === 'transfer' ? <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase text-blue-400 italic"><span>{m.fromEventName}</span><ChevronRight size={12} /><span>{m.toEventName}</span></div> : <span className="px-4 py-1.5 rounded-xl bg-white/5 text-gray-400 font-black uppercase text-[9px] border border-white/5">{m.categoryName}</span>}</td><td className="px-8 py-6 text-right font-black italic text-xl tracking-tighter" style={{ color: m.type === 'income' ? '#22c55e' : m.type === 'expense' ? '#ef4444' : '#60a5fa' }}>{m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''}{fmt(m.amount)}</td>                    <td className="px-8 py-6 flex justify-end gap-2 text-white">
                      {m.type !== 'transfer' && (
                        <button className="p-3 rounded-xl bg-white/5 text-gray-400 hover:bg-blue-500 hover:text-white transition-all">
                          <FileText size={16} />
                        </button>
                      )}
                      <Link 
                        href={m.type === 'transfer' ? '#' : `/transactions/edit/${m.id}`} 
                        className={cn("p-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all", m.type === 'transfer' && "opacity-20 pointer-events-none")}
                      >
                        <Edit size={16} />
                      </Link>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-3 rounded-xl bg-white/5 text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={16} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#13151f] border-2 border-white/10 rounded-[2rem] text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter">¿Eliminar Movimiento?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">
                              Esta acción no se puede deshacer. El monto de {fmt(m.amount)} será {m.type === 'income' ? 'restado' : 'sumado'} al balance actual.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel className="bg-white/5 border-none rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white">Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(m.id, m.type)}
                              className="bg-red-500 hover:bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                              Eliminar Ahora
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
</tr>))}</tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-white/5">
              {filtered.map((m) => (
                <div key={m.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start"><div className="flex items-center gap-3"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", m.type === 'income' ? "bg-green-500/10 text-green-500" : m.type === 'expense' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-400")}>{m.type === 'income' ? <ArrowUpRight size={18} /> : m.type === 'expense' ? <ArrowDownRight size={18} /> : <ArrowLeftRight size={18} />}</div><div><p className="font-black uppercase text-xs text-white leading-tight">{m.description}</p><p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{format(new Date(m.date), 'dd MMM yy', { locale: es })}</p></div></div><p className="font-black italic text-lg tracking-tighter" style={{ color: m.type === 'income' ? '#22c55e' : m.type === 'expense' ? '#ef4444' : '#60a5fa' }}>{m.type === 'income' ? '+' : m.type === 'expense' ? '-' : ''}{fmt(m.amount)}</p></div>
                  <div className="flex justify-between items-center pt-2">{m.type === 'transfer' ? <p className="text-[8px] font-black uppercase text-blue-400 italic">{m.fromEventName} → {m.toEventName}</p> : <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-500 font-black uppercase text-[8px] tracking-widest">{m.categoryName}</span>}<div className="flex gap-2 text-white">{m.type !== 'transfer' && <button className="p-2.5 rounded-lg bg-white/5 text-gray-400"><FileText size={14} /></button>}<Link href={m.type === 'transfer' ? '#' : `/transactions/edit/${m.id}`} className={cn("p-2.5 rounded-lg bg-white/5 text-gray-400", m.type === 'transfer' && "opacity-20")}><Edit size={14} /></Link></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showTransfer && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowTransfer(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#13151f] border-2 border-white/10 rounded-[3rem] p-8 md:p-10 w-full max-w-md shadow-2xl relative overflow-hidden text-white" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--brand-primary)] to-orange-600" />
                <button onClick={() => setShowTransfer(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-all p-2"><X size={24} /></button>
                <div className="text-center mb-8"><h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">Mover <span className="text-[var(--brand-primary)]">Capital</span></h3><p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Gestión entre fondos</p></div>
                <TransferVisual fromName={fundName(tfForm.fromEventId)} toName={fundName(tfForm.toEventId)} amount={tfForm.amount} />
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10, marginTop: '10px' }}>
                  <div><p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px', fontWeight: 800 }}>Saldo en Origen</p><p style={{ fontSize: '20px', fontWeight: 900, color: originBalance >= 0 ? '#4ade80' : '#f87171', letterSpacing: '-0.03em' }}>{fmt(originBalance)}</p></div>
                  {amountNum > 0 && (<div style={{ textAlign: 'right' }}><p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px', fontWeight: 800 }}>Resultado</p><p style={{ fontSize: '20px', fontWeight: 900, color: afterTransfer >= 0 ? '#94a3b8' : '#f87171', letterSpacing: '-0.03em' }}>{fmt(afterTransfer)}</p></div>)}
                </div>
                <div className="space-y-5 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Desde</Label><select className="w-full px-4 py-3.5 bg-white/5 border-2 border-white/5 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-[var(--brand-primary)] appearance-none transition-all" value={tfForm.fromEventId} onChange={e => setTfForm({...tfForm, fromEventId: e.target.value})}><option value="caja" className="bg-[#13151f] text-white">Caja General</option>{events.map(ev => <option key={ev.id} value={ev.id} className="bg-[#13151f] text-white">{ev.name.toUpperCase()}</option>)}</select></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Hacia</Label><select className="w-full px-4 py-3.5 bg-white/5 border-2 border-white/5 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-[var(--brand-primary)] appearance-none transition-all" value={tfForm.toEventId} onChange={e => setTfForm({...tfForm, toEventId: e.target.value})}><option value="" className="bg-[#13151f] text-white">Elegir...</option><option value="caja" className="bg-[#13151f] text-white">Caja General</option>{events.map(ev => <option key={ev.id} value={ev.id} className="bg-[#13151f] text-white">{ev.name.toUpperCase()}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Monto RD$</Label><div className="relative"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} /><input type="number" placeholder="0" className="w-full px-4 py-3.5 pl-10 bg-white/5 border-2 border-white/5 rounded-2xl text-lg font-black text-white outline-none focus:border-[var(--brand-primary)] transition-all" value={tfForm.amount} onChange={(e) => setTfForm(f => ({ ...f, amount: e.target.value }))} /></div></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Fecha</Label><input type="date" className="w-full px-4 py-3.5 bg-white/5 border-2 border-white/5 rounded-2xl text-xs font-black text-white outline-none focus:border-[var(--brand-primary)] color-scheme-dark transition-all" value={tfForm.date} onChange={(e) => setTfForm(f => ({ ...f, date: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Descripción</Label><input type="text" placeholder="EJ: GANANCIA DEL EVENTO A CAJA" className="w-full px-4 py-3.5 bg-white/5 border-2 border-white/5 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-[var(--brand-primary)] transition-all" value={tfForm.description} onChange={(e) => setTfForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <button onClick={handleSaveTransfer} disabled={saving || !tfForm.toEventId || amountNum > originBalance} className="w-full py-5 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-primary)] hover:text-white shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4">{saving ? <Loader2 className="animate-spin" /> : <Save size={16} />} Confirmar Transferencia</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
