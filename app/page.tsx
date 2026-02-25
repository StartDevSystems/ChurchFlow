'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Landmark, ArrowLeftRight, PlusCircle, TrendingUp, Activity, Zap, Calendar, Cake, GripVertical, ChevronRight, X, DollarSign, Loader2, Save } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, TouchSensor, MouseSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const fmt = (amount: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

const MONTH_MAP: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

// ─── 3D Transfer Visualization ──────────────────────
function TransferVisual({ fromName, toName, amount }: { fromName: string; toName: string; amount: string }) {
  return (
    <div style={{
      perspective: '800px',
      width: '100%',
      height: '140px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '10px',
      position: 'relative',
    }}>
      <style>{`
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
      `}</style>

      {/* Card FROM */}
      <div style={{
        width: '130px',
        height: '85px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #e85d26, #f5a623)',
        animation: 'floatLeft 3s ease-in-out infinite, pulse3d 3s ease-in-out infinite',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px 14px',
        boxShadow: '0 8px 32px rgba(232,93,38,0.35)',
        position: 'relative',
        zIndex: 2,
        flexShrink: 0,
      }}>
        <div style={{ width: '28px', height: '20px', borderRadius: '4px', background: 'linear-gradient(135deg, #ffd700, #ffaa00)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }} />
        <div>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 800 }}>Origen</div>
          <div style={{ fontSize: '10px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', textTransform: 'uppercase', fontStyle: 'italic' }}>{fromName}</div>
        </div>
      </div>

      {/* Flow arrow + particles */}
      <div style={{ position: 'relative', width: '90px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div style={{ position: 'relative', width: '100%', height: '20px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ position: 'absolute', top: '50%', width: '6px', height: '6px', borderRadius: '50%', background: '#e85d26', animation: `flowParticle 1.5s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
          ))}
          <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '1.5px', background: 'linear-gradient(90deg, rgba(232,93,38,0.2), rgba(232,93,38,0.8), rgba(232,93,38,0.2))', transform: 'translateY(-50%)' }} />
        </div>
        {amount && parseFloat(amount) > 0 && (
          <div style={{ background: 'rgba(232,93,38,0.15)', border: '1px solid rgba(232,93,38,0.3)', borderRadius: '20px', padding: '3px 10px', fontSize: '9px', fontWeight: 900, color: '#e85d26', whiteSpace: 'nowrap' }}>
            {fmt(parseFloat(amount))}
          </div>
        )}
      </div>

      {/* Card TO */}
      <div style={{
        width: '130px',
        height: '85px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #1a4d8f, #2a8a5e)',
        animation: 'floatRight 3s ease-in-out infinite',
        animationDelay: '0.3s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px 14px',
        boxShadow: '0 8px 32px rgba(26,77,143,0.3)',
        position: 'relative',
        zIndex: 2,
        flexShrink: 0,
      }}>
        <div style={{ width: '28px', height: '20px', borderRadius: '4px', background: 'linear-gradient(135deg, #ffd700, #ffaa00)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }} />
        <div>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 800 }}>Destino</div>
          <div style={{ fontSize: '10px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', textTransform: 'uppercase', fontStyle: 'italic' }}>{toName}</div>
        </div>
      </div>
    </div>
  );
}

function SortableWidget({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 'auto', opacity: isDragging ? 0.8 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="relative group mb-4">
      <div {...attributes} {...listeners} className="absolute top-4 right-4 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing z-50 p-2 hover:bg-white/10 rounded-lg transition-all hidden lg:block">
        <GripVertical size={18} className="text-white" />
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [tfForm, setTfForm] = useState({ 
    fromEventId: 'caja', 
    toEventId: '', 
    amount: '', 
    description: '', 
    date: format(new Date(), 'yyyy-MM-dd') 
  });
  const [saving, setSaving] = useState(false);

  const [widgetOrder, setWidgetOrder] = useState<string[]>(['banner', 'cards-row', 'middle-row', 'bottom-row']);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const savedOrder = localStorage.getItem('churchflow-dashboard-order-v2');
    if (savedOrder) setWidgetOrder(JSON.parse(savedOrder));
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, evRes, trRes, bRes] = await Promise.all([
        fetch('/api/transactions'), fetch('/api/events'), fetch('/api/transfers'), fetch('/api/members/birthdays')
      ]);
      setTransactions(txRes.ok ? await txRes.json() : []);
      setEvents(evRes.ok ? await evRes.json() : []);
      setTransfers(trRes.ok ? await trRes.json() : []);
      setBirthdays(bRes.ok ? await bRes.json() : []);
    } catch { toast({ title: 'Error al cargar datos', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const financialData = useMemo(() => {
    const cajaTransactions = transactions.filter(t => !t.eventId);
    const cajaIncome = cajaTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const cajaExpense = cajaTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netCajaTransfers = transfers.reduce((acc, tr) => { 
      if (!tr.fromEventId) return acc - tr.amount; 
      if (!tr.toEventId) return acc + tr.amount; 
      return acc; 
    }, 0);
    const cajaBalance = cajaIncome - cajaExpense + netCajaTransfers;
    
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    const thisMonthCaja = cajaTransactions.filter(t => { 
      const d = new Date(t.date); 
      return d >= start && d <= end; 
    });
    
    const monthIncome = thisMonthCaja.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthExpense = thisMonthCaja.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const eventsWithStats = events.map(ev => {
      const related = transactions.filter(t => t.eventId === ev.id);
      const in_ = related.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const out_ = related.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = transfers.reduce((acc, tr) => { 
        if (tr.fromEventId === ev.id) return acc - tr.amount; 
        if (tr.toEventId === ev.id) return acc + tr.amount; 
        return acc; 
      }, 0);
      return { 
        ...ev, 
        balance: (in_ - out_) + net, 
        txCount: related.length, 
        totalIncome: in_, 
        totalExpense: out_ 
      };
    });

    const totalBalance = cajaBalance + eventsWithStats.reduce((s, e) => s + e.balance, 0);
    
    const upcomingEvent = eventsWithStats
      .filter(e => new Date(e.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
    
    const daysToEvent = upcomingEvent ? Math.ceil((new Date(upcomingEvent.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

    const monthlyMap = new Map<string, any>();
    cajaTransactions.forEach(t => {
      const key = format(parseISO(t.date), 'MMM yy', { locale: es });
      if (!monthlyMap.has(key)) monthlyMap.set(key, { month: key, Ingresos: 0, Gastos: 0 });
      const m = monthlyMap.get(key)!;
      if (t.type === 'income') m.Ingresos += t.amount; else m.Gastos += t.amount;
    });
    
    const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) => {
      const parse = (s: string) => { 
        const [mon, yr] = s.split(' '); 
        return new Date(2000 + parseInt(yr), MONTH_MAP[mon.toLowerCase().replace('.', '')] ?? 0, 1).getTime(); 
      };
      return parse(a.month) - parse(b.month);
    });

    return {
      cajaBalance,
      monthIncome,
      monthExpense,
      eventsWithStats,
      totalBalance,
      upcomingEvent,
      daysToEvent,
      monthlyTrends
    };
  }, [transactions, events, transfers]);

  const {
    cajaBalance,
    monthIncome,
    monthExpense,
    eventsWithStats,
    totalBalance,
    upcomingEvent,
    daysToEvent,
    monthlyTrends
  } = financialData;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as string);
      const newIndex = widgetOrder.indexOf(over.id as string);
      const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
      setWidgetOrder(newOrder);
      localStorage.setItem('churchflow-dashboard-order-v2', JSON.stringify(newOrder));
    }
  };

  const fundName = (eventId?: string | null) => {
    if (!eventId || eventId === 'caja') return 'Caja General';
    return events.find((e) => e.id === eventId)?.name ?? 'Evento';
  };

  const getOriginBalance = () => {
    if (tfForm.fromEventId === 'caja' || !tfForm.fromEventId) return cajaBalance;
    const ev = eventsWithStats.find(e => e.id === tfForm.fromEventId);
    return ev ? ev.balance : 0;
  };

  const originBalance = getOriginBalance();
  const amountNum = parseFloat(tfForm.amount) || 0;
  const afterTransfer = originBalance - amountNum;

  const handleSaveTransfer = async () => {
    if (!tfForm.amount || !tfForm.toEventId) {
      toast({ title: 'Completa el monto y el destino', variant: 'destructive' });
      return;
    }

    const finalDescription = tfForm.description || `Transferencia de ${fundName(tfForm.fromEventId)} a ${fundName(tfForm.toEventId)}`;

    setSaving(true);
    try {
      const res = await fetch('/api/transfers', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          amount: parseFloat(tfForm.amount), 
          description: finalDescription, 
          date: tfForm.date, 
          fromEventId: tfForm.fromEventId === 'caja' ? null : tfForm.fromEventId, 
          toEventId: tfForm.toEventId === 'caja' ? null : tfForm.toEventId 
        }) 
      });
      if (res.ok) { 
        toast({ title: 'Transferencia realizada con éxito ✓' }); 
        setShowTransfer(false); 
        fetchAll(); 
      } else {
        const err = await res.json();
        toast({ title: 'Error al procesar', description: err.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-[var(--brand-primary)] animate-spin" /></div>;

  const renderWidget = (id: string) => {
    switch (id) {
      case 'banner':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-card glass p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent" />
            <div className="flex flex-col xl:flex-row gap-8 items-center relative z-10">
              <div className="flex-1 w-full text-center xl:text-left">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Balance Total Consolidado</p>
                <h2 className={cn("text-4xl md:text-6xl font-black italic tracking-tighter leading-none break-words", totalBalance >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>{fmt(totalBalance)}</h2>
                <p className="text-[9px] md:text-[10px] text-gray-600 font-bold mt-4 uppercase tracking-widest">Caja General + {events.length} Eventos Activos</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-10 w-full xl:w-auto">
                <div className="border-l-2 border-[var(--brand-primary)]/30 pl-4 md:pl-6 py-1"><p className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 mb-1 tracking-tighter">Caja General</p><p className="text-xl md:text-2xl font-black text-white">{fmt(cajaBalance)}</p></div>
                <div className="border-l-2 border-[#4ade80]/30 pl-4 md:pl-6 py-1"><p className="text-[8px] md:text-[9px] font-black uppercase text-[#4ade80] mb-1 tracking-tighter">Ingresos Mes</p><p className="text-xl md:text-2xl font-black text-[#4ade80]">{fmt(monthIncome)}</p></div>
                <div className="border-l-2 border-[#f87171]/30 pl-4 md:pl-6 py-1"><p className="text-[8px] md:text-[9px] font-black uppercase text-[#f87171] mb-1 tracking-tighter">Gastos Mes</p><p className="text-xl md:text-2xl font-black text-[#f87171]">{fmt(monthExpense)}</p></div>
              </div>
            </div>
          </motion.div>
        );
      case 'cards-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingEvent ? (
              <div className="dash-card glass p-5 md:p-6 border-l-4 border-l-[var(--brand-primary)] flex items-center justify-between" style={{ background: 'linear-gradient(90deg, rgba(232,93,38,0.1), transparent)' }}>
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="bg-[var(--brand-primary)] text-white p-3 md:p-4 rounded-2xl shadow-lg shrink-0"><Calendar className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} /></div>
                  <div className="min-w-0"><p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]">Próximo Evento</p><h3 className="text-lg md:text-xl font-black uppercase italic text-white truncate">{upcomingEvent.name}</h3></div>
                </div>
                <div className="text-right shrink-0 ml-4"><p className="text-3xl md:text-4xl font-black text-white italic leading-none">{daysToEvent}</p><p className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 tracking-tighter">Días</p></div>
              </div>
            ) : (
              <div className="dash-card glass p-6 border-l-4 border-l-gray-800 flex items-center gap-4 opacity-50"><Calendar size={20} className="text-gray-600" /><p className="text-xs font-black uppercase text-gray-600">Sin eventos en agenda</p></div>
            )}
            <Link href="/members/birthdays">
              <div className="dash-card glass p-5 md:p-6 border-l-4 border-l-pink-500 flex items-center justify-between h-full overflow-hidden relative group/bday" style={{ background: 'linear-gradient(90deg, rgba(236,72,153,0.1), transparent)' }}>
                <div className="flex items-center gap-4 md:gap-5 z-10 w-full min-w-0">
                  <div className="bg-pink-500 text-white p-3 md:p-4 rounded-2xl shadow-lg shrink-0"><Cake className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} /></div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-pink-500">Cumpleaños (Ver Todos)</p>
                    <div className="h-8 flex items-center overflow-hidden">
                      <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 15, ease: "linear", repeat: Infinity }} className="flex whitespace-nowrap gap-10">
                        {[1, 2].map(set => (
                          <div key={set} className="flex gap-10 items-center">
                            {birthdays.length > 0 ? birthdays.map(b => (
                              <span key={`${set}-${b.id}`} className="text-lg md:text-xl font-black uppercase italic text-white flex items-center gap-2">
                                {b.name} <span className="text-[9px] md:text-[10px] bg-white/10 px-2 py-0.5 rounded-md not-italic">{b.day}/{b.month}</span>
                              </span>
                            )) : <span className="text-lg md:text-xl font-black uppercase italic text-white opacity-30">Nadie en agenda</span>}
                            {birthdays.length > 0 && <span className="text-pink-500 text-xl">🎂</span>}
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="text-right z-10 bg-[#0a0c14]/80 pl-4 border-l border-white/5 shrink-0"><p className="text-3xl md:text-4xl font-black text-white italic leading-none">{birthdays.length}</p><p className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 tracking-tighter">Jóvenes</p></div>
              </div>
            </Link>
          </div>
        );
      case 'middle-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="dash-card glass p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3"><Activity size={18} className="text-[var(--brand-primary)]" /><h3 className="font-black uppercase text-sm text-white italic">Fondos por Evento</h3></div>
                <Link href="/events" className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 hover:bg-[var(--brand-primary)] hover:text-white transition-all">Ver todos</Link>
              </div>
              <div className="space-y-4">
                {eventsWithStats.slice(0, 4).map(ev => {
                  const pct = ev.totalIncome > 0 ? Math.min(100, (ev.balance / ev.totalIncome) * 100) : 0;
                  return (
                    <div key={ev.id} className="group/item">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <p className="text-xs font-black text-gray-300 uppercase tracking-tight truncate max-w-[150px]">{ev.name}</p>
                        <p className={cn("text-xs font-black", ev.balance >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>{fmt(ev.balance)}</p>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(5, pct)}%` }} className={cn("h-full rounded-full", ev.balance >= 0 ? "bg-[#4ade80]" : "bg-[#f87171]")} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="dash-card glass p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3"><Zap size={18} className="text-[#4ade80]" /><h3 className="font-black uppercase text-sm text-white italic">Actividad Reciente</h3></div>
                <Link href="/transactions" className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase text-[#4ade80] border border-[#4ade80]/20 hover:bg-[#4ade80] hover:text-white transition-all">Historial</Link>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] hover:bg-white/5 transition-all border border-white/5 group/tx">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", t.type === 'income' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                      {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white uppercase truncate">{t.description}</p>
                      <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">{format(new Date(t.date), 'dd MMMM', { locale: es })}</p>
                    </div>
                    <p className={cn("text-xs md:text-sm font-black italic", t.type === 'income' ? "text-[#4ade80]" : "text-[#f87171]")}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'bottom-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="dash-card glass p-6 min-h-[380px] flex flex-col relative overflow-hidden group/chart">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 animate-pulse"><TrendingUp size={18} /></div>
                  <h3 className="font-black uppercase text-sm text-white italic tracking-widest">Flujo de Inteligencia</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#2a8a5e] shadow-[0_0_8px_#2a8a5e]" /><span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Entradas</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#dc3545] shadow-[0_0_8px_#dc3545]" /><span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Salidas</span></div>
                </div>
              </div>
              
              <div className="flex-1 w-full overflow-hidden relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2a8a5e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2a8a5e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc3545" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#dc3545" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: '900' }} 
                      dy={10} 
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 'bold' }} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0c14', border: '2px solid rgba(255,255,255,0.05)', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} 
                      itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }} 
                      labelStyle={{ color: '#9ca3af', fontSize: '10px', fontWeight: 'black', marginBottom: '4px' }} 
                      formatter={(value: any) => [fmt(Number(value || 0)), '']} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Ingresos" 
                      stroke="#2a8a5e" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorIn)" 
                      animationDuration={2500}
                      strokeLinecap="round"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Gastos" 
                      stroke="#dc3545" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorOut)" 
                      animationDuration={3000}
                      strokeLinecap="round"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none group-hover/chart:bg-blue-500/10 transition-all duration-700" />
            </div>
            <div className="dash-card glass p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3"><ArrowLeftRight size={18} className="text-[#a78bfa]" /><h3 className="font-black uppercase text-sm text-white italic">Transferencias</h3></div>
                <button onClick={() => setShowTransfer(true)} className="px-3 py-1 bg-[#a78bfa]/10 rounded-full text-[8px] font-black uppercase text-[#a78bfa] border border-[#a78bfa]/20 hover:bg-[#a78bfa] hover:text-white transition-all">+ Nueva</button>
              </div>
              <div className="space-y-3">
                {transfers.slice(0, 4).map(tr => (
                  <div key={tr.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0"><ArrowLeftRight size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-300 uppercase truncate">{tr.description}</p>
                      <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">{format(new Date(tr.date), 'dd MMM', { locale: es })}</p>
                    </div>
                    <p className="text-xs md:text-sm font-black text-blue-400 italic">{fmt(tr.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 min-h-screen bg-[#0a0c14] pb-20 relative overflow-x-hidden">
      <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-[var(--brand-primary)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 relative z-10">
        <div className="mb-12 flex flex-col md:flex-row justify-between md:items-end gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse shadow-[0_0_8px_var(--brand-primary)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Sistema ChurchFlow Activo</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">Dashboard</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
            <button onClick={() => window.print()} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">Imprimir Reporte</button>
            <Link href="/transactions/new" className="w-full">
              <button className="w-full px-8 py-4 bg-[var(--brand-primary)] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-2xl shadow-orange-500/40 hover:-translate-y-1 active:scale-95 transition-all">Registrar Movimiento</button>
            </Link>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
            {widgetOrder.map(id => (
              <SortableWidget key={id} id={id}>
                {renderWidget(id)}
              </SortableWidget>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <AnimatePresence>
        {showTransfer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowTransfer(false); }}>
            <div className="w-full max-w-md shadow-2xl overflow-hidden" style={{ borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)' }}>
              <div style={{ background: 'linear-gradient(160deg, #0f1117 0%, #1a1d2e 50%, #0f1117 100%)', padding: '32px 28px 20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(232,93,38,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(232,93,38,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(232,93,38,0.8)', marginBottom: '4px' }}>FLUJO DE CAPITAL</p>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', textTransform: 'uppercase', fontStyle: 'italic' }}>Nueva Transferencia</h3>
                  </div>
                  <button onClick={() => setShowTransfer(false)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/50 flex items-center justify-center text-xl hover:text-white transition-all">×</button>
                </div>
                <div className="relative z-10">
                  <TransferVisual fromName={fundName(tfForm.fromEventId)} toName={fundName(tfForm.toEventId)} amount={tfForm.amount} />
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10, marginTop: '10px' }}>
                  <div><p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px', fontWeight: 800 }}>Saldo en Origen</p><p style={{ fontSize: '20px', fontWeight: 900, color: originBalance >= 0 ? '#4ade80' : '#f87171', letterSpacing: '-0.03em' }}>{fmt(originBalance)}</p></div>
                  {amountNum > 0 && (
                    <div style={{ textAlign: 'right' }}><p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px', fontWeight: 800 }}>Resultado</p><p style={{ fontSize: '20px', fontWeight: 900, color: afterTransfer >= 0 ? '#94a3b8' : '#f87171', letterSpacing: '-0.03em' }}>{fmt(afterTransfer)}</p></div>
                  )}
                </div>
              </div>
              <div style={{ background: '#13151f', padding: '28px' }}>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="block text-[10px] font-black tracking-widest uppercase text-gray-500 ml-2">Desde Origen</label><select className="w-full px-4 py-3.5 bg-white/5 border-2 border-white/5 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-[var(--brand-primary)] appearance-none transition-all" value={tfForm.fromEventId} onChange={(e) => setTfForm(f => ({ ...f, fromEventId: e.target.value }))}><option value="caja" className="bg-[#13151f] text-white">Caja General</option>{events.map(ev => <option key={ev.id} value={ev.id} className="bg-[#13151f] text-white">{ev.name.toUpperCase()}</option>)}</select></div>
                    <div className="space-y-1.5"><label className="block text-[10px] font-black tracking-widest uppercase text-gray-500 ml-2">Hacia Destino</label><select className="w-full px-4 py-3.5 bg-white/5 border-2 border-white/5 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-[var(--brand-primary)] appearance-none transition-all" value={tfForm.toEventId} onChange={(e) => setTfForm(f => ({ ...f, toEventId: e.target.value }))}><option value="" className="bg-[#13151f] text-white">Seleccionar...</option><option value="caja" className="bg-[#13151f] text-white">Caja General</option>{events.map(ev => <option key={ev.id} value={ev.id} className="bg-[#13151f] text-white">{ev.name.toUpperCase()}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="block text-[10px] font-black tracking-widest uppercase text-gray-500 ml-2">Monto RD$</label><div className="relative"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} /><input type="number" placeholder="0" className="w-full px-4 py-3.5 pl-10 bg-white/5 border-2 border-white/5 rounded-2xl text-lg font-black text-white outline-none focus:border-[var(--brand-primary)] transition-all" value={tfForm.amount} onChange={(e) => setTfForm(f => ({ ...f, amount: e.target.value }))} /></div>{amountNum > originBalance && amountNum > 0 && (<p className="text-[9px] text-red-500 mt-1 font-black uppercase italic tracking-tighter">Fondos insuficientes</p>)}</div>
                    <div className="space-y-1.5"><label className="block text-[10px] font-black tracking-widest uppercase text-gray-500 ml-2">Fecha</label><input type="date" className="w-full px-4 py-3.5 bg-white/5 border-2 border-white/5 rounded-2xl text-xs font-black text-white outline-none focus:border-[var(--brand-primary)] color-scheme-dark transition-all" value={tfForm.date} onChange={(e) => setTfForm(f => ({ ...f, date: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1.5"><label className="block text-[10px] font-black tracking-widest uppercase text-gray-500 ml-2">Descripción</label><input type="text" placeholder="EJ: GANANCIA DEL EVENTO A CAJA" className="w-full px-4 py-3.5 bg-white/5 border-2 border-white/5 rounded-2xl text-xs font-black uppercase text-white outline-none focus:border-[var(--brand-primary)] transition-all" value={tfForm.description} onChange={(e) => setTfForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <button onClick={handleSaveTransfer} disabled={saving || amountNum > originBalance || !tfForm.toEventId} className="w-full py-5 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-primary)] hover:text-white shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4">{saving ? <Loader2 className="animate-spin" /> : <Save size={16} />} Procesar Movimiento</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
