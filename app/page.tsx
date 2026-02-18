'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Landmark, ArrowLeftRight, PlusCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/use-toast';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
  eventId?: string | null;
  category: { id: string; name: string; type: string };
  member?: { id: string; name: string } | null;
  event?: { id: string; name: string } | null;
}

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
}

interface Transfer {
  id: string;
  amount: number;
  description: string;
  date: string;
  fromEventId?: string | null;
  toEventId?: string | null;
}

interface EventWithStats extends Event {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  txCount: number;
}

interface MonthlyData {
  month: string;
  Ingresos: number;
  Gastos: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0,
  }).format(amount);

const EVENT_COLORS = [
  '#e85d26', '#1a4d8f', '#0e7490', '#6b3fa0', '#2a8a5e', '#b91c1c',
];

const MONTH_MAP: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const { theme } = useTheme();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal transferencia
  const [showTransfer, setShowTransfer] = useState(false);
  const [tfForm, setTfForm] = useState({
    fromEventId: '',
    toEventId: '',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [saving, setSaving] = useState(false);

  const textColor = theme === 'dark' ? '#f8fafc' : '#1a1714';
  const tooltipBg = theme === 'dark' ? '#1e2130' : '#ffffff';

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, evRes, trRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/events'),
        fetch('/api/transfers'),
      ]);
      const txData: Transaction[] = txRes.ok ? await txRes.json() : [];
      const evData: Event[] = evRes.ok ? await evRes.json() : [];
      const trData: Transfer[] = trRes.ok ? await trRes.json() : [];

      setTransactions(txData);
      setEvents(evData);
      setTransfers(trData);
    } catch {
      toast({ title: 'Error al cargar datos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Cálculos ───────────────────────────────────────────────────────────────

  const cajaTransactions = transactions.filter((t) => !t.eventId);
  const cajaIncome = cajaTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const cajaExpense = cajaTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  
  // Ajuste de balance de caja con transferencias (v1.2)
  const cajaTransfersIn = transfers.filter(tr => !tr.fromEventId && tr.toEventId).reduce((s, tr) => s + tr.amount, 0); // Esto no debería pasar según lógica pero por si acaso
  const cajaTransfersOut = transfers.filter(tr => !tr.fromEventId && tr.toEventId).reduce((s, tr) => s + tr.amount, 0); 
  
  // Lógica correcta: 
  // Si fromEventId es null -> sale de caja
  // Si toEventId es null -> entra a caja
  const netCajaTransfers = transfers.reduce((acc, tr) => {
    if (!tr.fromEventId) return acc - tr.amount; // Sale de caja
    if (!tr.toEventId) return acc + tr.amount;   // Entra a caja
    return acc;
  }, 0);

  const cajaBalance = cajaIncome - cajaExpense + netCajaTransfers;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thisMontCaja = cajaTransactions.filter((t) => {
    const d = new Date(t.date);
    return d >= monthStart && d <= monthEnd;
  });
  const monthIncome = thisMontCaja.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMontCaja.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const eventsWithStats: EventWithStats[] = events.map((ev) => {
    const related = transactions.filter((t) => t.eventId === ev.id);
    const totalIncome = related.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = related.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    // Ajuste por transferencias (v1.2)
    const netEventTransfers = transfers.reduce((acc, tr) => {
      if (tr.fromEventId === ev.id) return acc - tr.amount; // Sale del evento
      if (tr.toEventId === ev.id) return acc + tr.amount;   // Entra al evento
      return acc;
    }, 0);

    return { 
      ...ev, 
      totalIncome, 
      totalExpense, 
      balance: (totalIncome - totalExpense) + netEventTransfers, 
      txCount: related.length 
    };
  }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const recentTransactions = [...transactions].slice(0, 5);

  const monthlyMap = new Map<string, MonthlyData>();
  cajaTransactions.forEach((t) => {
    const key = format(parseISO(t.date), 'MMM yyyy', { locale: es });
    if (!monthlyMap.has(key)) monthlyMap.set(key, { month: key, Ingresos: 0, Gastos: 0 });
    const m = monthlyMap.get(key)!;
    if (t.type === 'income') m.Ingresos += t.amount;
    else m.Gastos += t.amount;
  });
  const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) => {
    const parse = (s: string) => {
      const [mon, yr] = s.split(' ');
      return new Date(parseInt(yr), MONTH_MAP[mon.toLowerCase().replace('.', '')] ?? 0, 1).getTime();
    };
    return parse(a.month) - parse(b.month);
  });

  const fundName = (eventId?: string | null) => {
    if (!eventId) return '🏦 Caja General';
    return events.find((e) => e.id === eventId)?.name ?? 'Evento';
  };

  // ── Guardar transferencia ──────────────────────────────────────────────────
  const handleSaveTransfer = async () => {
    if (!tfForm.amount || !tfForm.description || !tfForm.date) {
      toast({ title: 'Completa todos los campos', variant: 'destructive' }); return;
    }
    if (tfForm.fromEventId === tfForm.toEventId) {
      toast({ title: 'Origen y destino no pueden ser iguales', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: tfForm.amount,
          description: tfForm.description,
          date: tfForm.date,
          fromEventId: tfForm.fromEventId || null,
          toEventId: tfForm.toEventId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast({ title: 'Transferencia registrada ✓' });
      setShowTransfer(false);
      setTfForm({ fromEventId: '', toEventId: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Tooltip formatter (fix TypeScript) ────────────────────────────────────
  const tooltipFormatter = (value: number | string | undefined): [string, string] => [fmt(Number(value || 0)), ''];

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] dark:bg-gray-950 p-10">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] dark:bg-gray-950 p-6 md:p-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-[#8c7f72] dark:text-gray-500 uppercase mb-1">
            Vista General
          </p>
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1714] dark:text-white"
            style={{ letterSpacing: '-0.04em' }}
          >
            Dashboard 📊
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e8e2d9] dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-[#1a1714] dark:text-white hover:border-[#e85d26] hover:text-[#e85d26] transition-all"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Nueva Transferencia
          </button>
          <Link href="/transactions/new">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e85d26] text-white text-sm font-semibold hover:bg-[#cf4e1f] transition-all shadow-lg shadow-orange-200 dark:shadow-none">
              <PlusCircle className="h-4 w-4" />
              Registrar Movimiento
            </button>
          </Link>
        </div>
      </div>

      {/* ── Fila de fondos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        {/* Caja General */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#e85d26] to-[#f5a623]" />
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-[#e85d26]" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-[#e85d26]">
              Caja General
            </span>
          </div>
          <p className="text-[11px] font-semibold tracking-wider text-[#8c7f72] uppercase mb-1">Fondo disponible</p>
          <p className="text-4xl font-black text-[#e85d26]" style={{ letterSpacing: '-0.04em' }}>
            {fmt(cajaBalance)}
          </p>
          <p className="text-xs text-[#8c7f72] mt-2">Solo transacciones sin evento asociado</p>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#e8e2d9] dark:border-gray-800">
            <div className="text-center">
              <p className="text-[10px] text-[#8c7f72] uppercase tracking-wider mb-1">Entradas</p>
              <p className="text-base font-black text-[#2a8a5e]" style={{ letterSpacing: '-0.02em' }}>+{fmt(cajaIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-[#8c7f72] uppercase tracking-wider mb-1">Salidas</p>
              <p className="text-base font-black text-[#dc3545]" style={{ letterSpacing: '-0.02em' }}>-{fmt(cajaExpense)}</p>
            </div>
          </div>
        </div>

        {/* Ingresos del mes */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#2a8a5e]" />
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-[#2a8a5e]" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-[#2a8a5e]">
              Este mes
            </span>
          </div>
          <p className="text-[11px] font-semibold tracking-wider text-[#8c7f72] uppercase mb-1">Ingresos caja</p>
          <p className="text-4xl font-black text-[#2a8a5e]" style={{ letterSpacing: '-0.04em' }}>{fmt(monthIncome)}</p>
          <p className="text-xs text-[#8c7f72] mt-2">
            {format(now, 'MMMM yyyy', { locale: es })} · solo caja general
          </p>
        </div>

        {/* Gastos del mes */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#dc3545]" />
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <ArrowDownRight className="h-5 w-5 text-[#dc3545]" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-[#dc3545]">
              Este mes
            </span>
          </div>
          <p className="text-[11px] font-semibold tracking-wider text-[#8c7f72] uppercase mb-1">Gastos caja</p>
          <p className="text-4xl font-black text-[#dc3545]" style={{ letterSpacing: '-0.04em' }}>{fmt(monthExpense)}</p>
          <p className="text-xs text-[#8c7f72] mt-2">Sin incluir gastos de eventos</p>
        </div>
      </div>

      {/* ── Fila media ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Fondos por Evento */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-[#1a1714] dark:text-white text-base" style={{ letterSpacing: '-0.02em' }}>
              💼 Fondos por Evento
            </h2>
            <Link href="/events" className="text-xs text-[#e85d26] font-semibold hover:underline">Ver todos →</Link>
          </div>
          {eventsWithStats.length === 0 ? (
            <p className="text-sm text-[#8c7f72] py-6 text-center">No hay eventos registrados.</p>
          ) : (
            <div>
              {eventsWithStats.slice(0, 5).map((ev, i) => (
                <div key={ev.id} className="flex items-center gap-3 py-3 border-b border-[#f0ece6] dark:border-gray-800 last:border-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: EVENT_COLORS[i % EVENT_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1714] dark:text-white truncate">{ev.name}</p>
                    <p className="text-[11px] text-[#8c7f72]">
                      {format(new Date(ev.startDate), 'd MMM yyyy', { locale: es })} · {ev.txCount} transacciones
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color: ev.balance >= 0 ? '#2a8a5e' : '#dc3545', letterSpacing: '-0.02em' }}>
                      {ev.balance >= 0 ? '+' : ''}{fmt(ev.balance)}
                    </p>
                    <p className="text-[10px] text-[#8c7f72]">{fmt(ev.totalIncome)} in · {fmt(ev.totalExpense)} out</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos Movimientos */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-[#1a1714] dark:text-white text-base" style={{ letterSpacing: '-0.02em' }}>
              🕐 Últimos Movimientos
            </h2>
            <Link href="/transactions" className="text-xs text-[#e85d26] font-semibold hover:underline">Ver todos →</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-[#8c7f72] py-6 text-center">No hay transacciones aún.</p>
          ) : (
            <div>
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-3 border-b border-[#f0ece6] dark:border-gray-800 last:border-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                    {t.type === 'income'
                      ? <ArrowUpRight className="h-4 w-4 text-[#2a8a5e]" />
                      : <ArrowDownRight className="h-4 w-4 text-[#dc3545]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1714] dark:text-white truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#f7f4ef] dark:bg-gray-800 text-[#8c7f72]">
                        {t.category?.name}
                      </span>
                      {t.event
                        ? <span className="text-[10px] text-[#0e7490] font-medium">→ {t.event.name}</span>
                        : <span className="text-[10px] text-[#8c7f72]">→ Caja General</span>
                      }
                      <span className="text-[10px] text-[#8c7f72]">{format(new Date(t.date), 'd MMM', { locale: es })}</span>
                    </div>
                  </div>
                  <p className="text-sm font-black flex-shrink-0" style={{ color: t.type === 'income' ? '#2a8a5e' : '#dc3545', letterSpacing: '-0.02em' }}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Fila inferior ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Transferencias */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-extrabold text-[#1a1714] dark:text-white text-base" style={{ letterSpacing: '-0.02em' }}>
              ↔ Transferencias entre Fondos
            </h2>
            <button
              onClick={() => setShowTransfer(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e8e2d9] dark:border-gray-700 hover:border-[#e85d26] hover:text-[#e85d26] transition-all"
            >
              + Nueva
            </button>
          </div>
          <p className="text-xs text-[#8c7f72] mb-5">Cuando el dinero de un evento pasa a caja o viceversa</p>
          {transfers.length === 0 ? (
            <p className="text-sm text-[#8c7f72] py-6 text-center">No hay transferencias aún.</p>
          ) : (
            <div>
              {transfers.slice(0, 4).map((tr) => (
                <div key={tr.id} className="flex items-center gap-3 py-3 border-b border-[#f0ece6] dark:border-gray-800 last:border-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <ArrowLeftRight className="h-4 w-4 text-[#1a4d8f]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1714] dark:text-white truncate">{tr.description}</p>
                    <p className="text-[11px] text-[#8c7f72] mt-0.5">
                      {fundName(tr.fromEventId)} → {fundName(tr.toEventId)} · {format(new Date(tr.date), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <p className="text-sm font-black text-[#1a4d8f] flex-shrink-0" style={{ letterSpacing: '-0.02em' }}>
                    {fmt(tr.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico tendencia mensual */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-6">
          <h2 className="font-extrabold text-[#1a1714] dark:text-white text-base mb-1" style={{ letterSpacing: '-0.02em' }}>
            📊 Tendencia Mensual
          </h2>
          <p className="text-xs text-[#8c7f72] mb-5">Caja General — ingresos y gastos por mes</p>
          {monthlyTrends.length === 0 ? (
            <p className="text-sm text-[#8c7f72] py-6 text-center">No hay datos suficientes aún.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="month" stroke={textColor} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => fmt(v)} stroke={textColor} tick={{ fontSize: 10 }} width={90} />
                <Tooltip
                  formatter={tooltipFormatter}
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: '#e8e2d9', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: textColor, fontWeight: 700 }}
                />
                <Legend formatter={(v) => <span style={{ color: textColor, fontSize: 12 }}>{v}</span>} />
                <Line type="monotone" dataKey="Ingresos" stroke="#2a8a5e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Gastos" stroke="#dc3545" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Modal Transferencia ── */}
      {showTransfer && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTransfer(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl p-7">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-[#1a1714] dark:text-white" style={{ letterSpacing: '-0.03em' }}>
                Nueva Transferencia
              </h3>
              <button
                onClick={() => setShowTransfer(false)}
                className="w-8 h-8 rounded-lg border border-[#e8e2d9] dark:border-gray-700 flex items-center justify-center text-[#8c7f72] hover:bg-[#f7f4ef] dark:hover:bg-gray-800 transition-all text-lg"
              >×</button>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#f7f4ef] dark:bg-gray-800 rounded-xl mb-5">
              <div className="flex-1 p-3 bg-white dark:bg-gray-900 rounded-xl text-center border border-[#e8e2d9] dark:border-gray-700">
                <p className="text-[10px] text-[#8c7f72] uppercase tracking-wider mb-1">Origen</p>
                <p className="text-xs font-bold text-[#e85d26] truncate">
                  {tfForm.fromEventId ? events.find(e => e.id === tfForm.fromEventId)?.name : '🏦 Caja General'}
                </p>
              </div>
              <span className="text-xl text-[#e85d26]">→</span>
              <div className="flex-1 p-3 bg-white dark:bg-gray-900 rounded-xl text-center border border-[#e8e2d9] dark:border-gray-700">
                <p className="text-[10px] text-[#8c7f72] uppercase tracking-wider mb-1">Destino</p>
                <p className="text-xs font-bold text-[#2a8a5e] truncate">
                  {tfForm.toEventId ? events.find(e => e.id === tfForm.toEventId)?.name : '🏦 Caja General'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72] mb-1.5">Origen del dinero</label>
                <select
                  className="w-full px-3 py-2.5 bg-[#f7f4ef] dark:bg-gray-800 border border-[#e8e2d9] dark:border-gray-700 rounded-xl text-sm text-[#1a1714] dark:text-white outline-none focus:border-[#e85d26] transition-colors"
                  value={tfForm.fromEventId}
                  onChange={(e) => setTfForm(f => ({ ...f, fromEventId: e.target.value }))}
                >
                  <option value="">🏦 Caja General</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72] mb-1.5">Destino del dinero</label>
                <select
                  className="w-full px-3 py-2.5 bg-[#f7f4ef] dark:bg-gray-800 border border-[#e8e2d9] dark:border-gray-700 rounded-xl text-sm text-[#1a1714] dark:text-white outline-none focus:border-[#e85d26] transition-colors"
                  value={tfForm.toEventId}
                  onChange={(e) => setTfForm(f => ({ ...f, toEventId: e.target.value }))}
                >
                  <option value="">🏦 Caja General</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72] mb-1.5">Monto (RD$)</label>
                  <input
                    type="number" placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-[#f7f4ef] dark:bg-gray-800 border border-[#e8e2d9] dark:border-gray-700 rounded-xl text-sm text-[#1a1714] dark:text-white outline-none focus:border-[#e85d26] transition-colors"
                    value={tfForm.amount}
                    onChange={(e) => setTfForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72] mb-1.5">Fecha</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 bg-[#f7f4ef] dark:bg-gray-800 border border-[#e8e2d9] dark:border-gray-700 rounded-xl text-sm text-[#1a1714] dark:text-white outline-none focus:border-[#e85d26] transition-colors"
                    value={tfForm.date}
                    onChange={(e) => setTfForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72] mb-1.5">Descripción</label>
                <input
                  type="text" placeholder="ej. Ganancia de venta pasa a caja"
                  className="w-full px-3 py-2.5 bg-[#f7f4ef] dark:bg-gray-800 border border-[#e8e2d9] dark:border-gray-700 rounded-xl text-sm text-[#1a1714] dark:text-white outline-none focus:border-[#e85d26] transition-colors"
                  value={tfForm.description}
                  onChange={(e) => setTfForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransfer(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#e8e2d9] dark:border-gray-700 text-sm font-semibold text-[#8c7f72] hover:bg-[#f7f4ef] dark:hover:bg-gray-800 transition-all"
              >Cancelar</button>
              <button
                onClick={handleSaveTransfer}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#e85d26] text-white text-sm font-bold hover:bg-[#cf4e1f] transition-all disabled:opacity-60"
              >{saving ? 'Guardando...' : 'Registrar Transferencia'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}