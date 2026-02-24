'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Landmark, ArrowLeftRight, PlusCircle, TrendingUp, Activity, Zap, Calendar, Cake, GripVertical } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Componentes de Soporte ──────────────────────────────────────────────────
const fmt = (amount: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

const MONTH_MAP: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

// ─── Componente de Widget Sortable ──────────────────────────────────────────
function SortableWidget({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 'auto', opacity: isDragging ? 0.8 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="relative group mb-4">
      <div {...attributes} {...listeners} className="absolute top-4 right-4 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing z-50 p-2 hover:bg-white/10 rounded-lg transition-all">
        <GripVertical size={18} className="text-white" />
      </div>
      {children}
    </div>
  );
}

// ─── Dashboard Principal ────────────────────────────────────────────────────
export default function DashboardPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [tfForm, setTfForm] = useState({ fromEventId: '', toEventId: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [saving, setSaving] = useState(false);

  const [widgetOrder, setWidgetOrder] = useState<string[]>(['banner', 'cards-row', 'middle-row', 'bottom-row']);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

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

  // Lógica de datos
  const cajaTransactions = transactions.filter(t => !t.eventId);
  const cajaIncome = cajaTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const cajaExpense = cajaTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netCajaTransfers = transfers.reduce((acc, tr) => { if (!tr.fromEventId) return acc - tr.amount; if (!tr.toEventId) return acc + tr.amount; return acc; }, 0);
  const cajaBalance = cajaIncome - cajaExpense + netCajaTransfers;
  
  const now = new Date();
  const thisMonthCaja = cajaTransactions.filter(t => { const d = new Date(t.date); return d >= startOfMonth(now) && d <= endOfMonth(now); });
  const monthIncome = thisMonthCaja.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMonthCaja.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const eventsWithStats = events.map(ev => {
    const related = transactions.filter(t => t.eventId === ev.id);
    const in_ = related.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const out_ = related.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = transfers.reduce((acc, tr) => { if (tr.fromEventId === ev.id) return acc - tr.amount; if (tr.toEventId === ev.id) return acc + tr.amount; return acc; }, 0);
    return { ...ev, balance: (in_ - out_) + net, txCount: related.length, totalIncome: in_, totalExpense: out_ };
  });

  const totalBalance = cajaBalance + eventsWithStats.reduce((s, e) => s + e.balance, 0);
  
  const upcomingEvent = eventsWithStats
    .filter(e => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(a.startDate).getTime())[0];
  
  const daysToEvent = upcomingEvent ? Math.ceil((new Date(upcomingEvent.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  const monthlyMap = new Map<string, any>();
  cajaTransactions.forEach(t => {
    const key = format(parseISO(t.date), 'MMM yy', { locale: es });
    if (!monthlyMap.has(key)) monthlyMap.set(key, { month: key, Ingresos: 0, Gastos: 0 });
    const m = monthlyMap.get(key)!;
    if (t.type === 'income') m.Ingresos += t.amount; else m.Gastos += t.amount;
  });
  const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) => {
    const parse = (s: string) => { const [mon, yr] = s.split(' '); return new Date(2000 + parseInt(yr), MONTH_MAP[mon.toLowerCase().replace('.', '')] ?? 0, 1).getTime(); };
    return parse(a.month) - parse(b.month);
  });

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

  const handleSaveTransfer = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: tfForm.amount, description: tfForm.description, date: tfForm.date, fromEventId: null, toEventId: null }) });
      if (res.ok) { toast({ title: 'Transferencia registrada' }); setShowTransfer(false); fetchAll(); }
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-[var(--brand-primary)] animate-spin" /></div>;

  const renderWidget = (id: string) => {
    switch (id) {
      case 'banner':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-card glass p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent" />
            <div className="absolute top-[-40px] right-[-40px] w-64 h-64 rounded-full bg-[var(--brand-primary)]/10 blur-[80px]" />
            <div className="flex flex-wrap gap-8 items-center relative z-10">
              <div className="flex-1 min-w-[300px]">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Balance Total Consolidado</p>
                <h2 className={cn("text-6xl font-black italic tracking-tighter leading-none", totalBalance >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>{fmt(totalBalance)}</h2>
                <p className="text-[10px] text-gray-600 font-bold mt-4 uppercase tracking-widest">Caja General + {events.length} Eventos Activos</p>
              </div>
              <div className="flex gap-10">
                <div className="border-l-2 border-[var(--brand-primary)]/30 pl-6"><p className="text-[9px] font-black uppercase text-gray-500 mb-1 tracking-tighter">Caja General</p><p className="text-2xl font-black text-white">{fmt(cajaBalance)}</p></div>
                <div className="border-l-2 border-[#4ade80]/30 pl-6"><p className="text-[9px] font-black uppercase text-[#4ade80] mb-1 tracking-tighter">Ingresos Mes</p><p className="text-2xl font-black text-[#4ade80]">{fmt(monthIncome)}</p></div>
                <div className="border-l-2 border-[#f87171]/30 pl-6"><p className="text-[9px] font-black uppercase text-[#f87171] mb-1 tracking-tighter">Gastos Mes</p><p className="text-2xl font-black text-[#f87171]">{fmt(monthExpense)}</p></div>
              </div>
            </div>
          </motion.div>
        );
      case 'cards-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingEvent ? (
              <div className="dash-card glass p-6 border-l-4 border-l-[var(--brand-primary)] flex items-center justify-between" style={{ background: 'linear-gradient(90deg, rgba(232,93,38,0.1), transparent)' }}>
                <div className="flex items-center gap-5">
                  <div className="bg-[var(--brand-primary)] text-white p-4 rounded-2xl shadow-lg shadow-orange-500/20"><Calendar size={24} strokeWidth={3} /></div>
                  <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]">Próximo Evento</p><h3 className="text-xl font-black uppercase italic text-white truncate max-w-[200px]">{upcomingEvent.name}</h3></div>
                </div>
                <div className="text-right"><p className="text-4xl font-black text-white italic leading-none">{daysToEvent}</p><p className="text-[9px] font-black uppercase text-gray-500">Días</p></div>
              </div>
            ) : (
              <div className="dash-card glass p-6 border-l-4 border-l-gray-800 flex items-center gap-4 opacity-50"><Calendar size={20} className="text-gray-600" /><p className="text-xs font-black uppercase text-gray-600">Sin eventos en agenda</p></div>
            )}
            <Link href="/members/birthdays">
              <div className="dash-card glass p-6 border-l-4 border-l-pink-500 flex items-center justify-between h-full overflow-hidden relative group/bday" style={{ background: 'linear-gradient(90deg, rgba(236,72,153,0.1), transparent)' }}>
                <div className="flex items-center gap-5 z-10">
                  <div className="bg-pink-500 text-white p-4 rounded-2xl shadow-lg shadow-pink-500/20 group-hover/bday:scale-110 transition-transform"><Cake size={24} strokeWidth={3} /></div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-pink-500">Cumpleaños (Ver Todos)</p>
                    <div className="h-8 flex items-center overflow-hidden">
                      <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 15, ease: "linear", repeat: Infinity }} className="flex whitespace-nowrap gap-12">
                        {[1, 2].map(set => (
                          <div key={set} className="flex gap-12 items-center">
                            {birthdays.length > 0 ? birthdays.map(b => (
                              <span key={`${set}-${b.id}`} className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                                {b.name} <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md not-italic">{b.day}/{b.month}</span>
                              </span>
                            )) : <span className="text-xl font-black uppercase italic text-white opacity-30">Nadie en agenda</span>}
                            {birthdays.length > 0 && <span className="text-pink-500 text-2xl">\uD83C\uDF81</span>}
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="text-right z-10 bg-[#0a0c14]/80 pl-4 border-l border-white/5"><p className="text-4xl font-black text-white italic leading-none">{birthdays.length}</p><p className="text-[9px] font-black uppercase text-gray-500 tracking-tighter">Jóvenes</p></div>
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
              <div className="space-y-3">
                {eventsWithStats.slice(0, 4).map(ev => {
                  const pct = ev.totalIncome > 0 ? Math.min(100, (ev.balance / ev.totalIncome) * 100) : 0;
                  return (
                    <div key={ev.id} className="group/item">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <p className="text-xs font-black text-gray-300 uppercase tracking-tight">{ev.name}</p>
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
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover/tx:scale-110", t.type === 'income' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                      {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white uppercase truncate">{t.description}</p>
                      <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">{format(new Date(t.date), 'dd MMMM', { locale: es })}</p>
                    </div>
                    <p className={cn("text-sm font-black italic", t.type === 'income' ? "text-[#4ade80]" : "text-[#f87171]")}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'bottom-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="dash-card glass p-6 min-h-[350px] flex flex-col">
              <div className="flex items-center gap-3 mb-8"><TrendingUp size={18} className="text-[#60a5fa]" /><h3 className="font-black uppercase text-sm text-white italic">Análisis de Tendencia</h3></div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2a8a5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2a8a5e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc3545" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#dc3545" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} 
                      tickFormatter={(v) => `$${v/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#13151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                      labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
                      formatter={(value: any) => [fmt(Number(value || 0)), '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Ingresos" 
                      stroke="#2a8a5e" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorIn)" 
                      animationDuration={2000}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Gastos" 
                      stroke="#dc3545" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorOut)" 
                      animationDuration={2500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-6 mt-4 justify-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#2a8a5e]" /><span className="text-[10px] font-black text-gray-500 uppercase">Ingresos</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#dc3545]" /><span className="text-[10px] font-black text-gray-500 uppercase">Gastos</span></div>
              </div>
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
                    <p className="text-sm font-black text-blue-400 italic">{fmt(tr.amount)}</p>
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
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 min-h-screen bg-[#0a0c14] pb-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-[var(--brand-primary)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
        <div className="mb-12 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse shadow-[0_0_8px_var(--brand-primary)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Sistema ChurchFlow Activo</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">Imprimir Reporte</button>
            <Link href="/transactions/new"><button className="px-8 py-4 bg-[var(--brand-primary)] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-2xl shadow-orange-500/40 hover:-translate-y-1 active:scale-95 transition-all">Registrar Movimiento</button></Link>
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

      {/* Modal Transferencia con Flow */}
      <AnimatePresence>
        {showTransfer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowTransfer(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#13151f] border-2 border-white/10 rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-2 bg-[var(--brand-primary)]" />
              <h3 className="text-3xl font-black uppercase italic text-white mb-2 tracking-tighter">Mover Capital</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8 text-center">Transferencia entre fondos internos</p>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Monto RD$</label>
                  <input type="number" placeholder="0.00" className="w-full bg-white/5 border-2 border-white/5 p-5 rounded-2xl text-white font-black text-xl outline-none focus:border-[var(--brand-primary)] transition-all" value={tfForm.amount} onChange={e => setTfForm({...tfForm, amount: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-2">Descripción del movimiento</label>
                  <input type="text" placeholder="EJ: GANANCIA RETIRO A CAJA" className="w-full bg-white/5 border-2 border-white/5 p-5 rounded-2xl text-white font-black text-sm outline-none focus:border-[var(--brand-primary)] transition-all uppercase" value={tfForm.description} onChange={e => setTfForm({...tfForm, description: e.target.value})} />
                </div>
                <button onClick={handleSaveTransfer} disabled={saving} className="w-full bg-[var(--brand-primary)] p-6 rounded-[1.5rem] text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-orange-500/20 hover:brightness-110 active:scale-95 transition-all mt-4">{saving ? 'Procesando...' : 'Confirmar Transferencia'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
