"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Calendar as CalendarIcon, FileText, Download, Filter, Loader2,
  ArrowUpCircle, ArrowDownCircle, PieChart, MessageCircle, Presentation,
  Image as ImageIcon, X, TrendingUp, TrendingDown, DollarSign,
  FileSpreadsheet, ChevronDown, BarChart3, ShoppingBag, CalendarCheck,
  CheckCircle2, Clock, Wallet, Store,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, subQuarters, startOfQuarter } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateReportPDF } from '@/lib/generateReportPDF';
import { generateReportExcel } from '@/lib/generateReportExcel';
import type { ReportData, ReportSettings } from '@/lib/generateReportPDF';

/* ══════════════════════════════════════════════════════════
   DATE PRESETS
══════════════════════════════════════════════════════════ */
const DATE_PRESETS = [
  {
    label: 'Este mes',
    getRange: () => ({
      from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      to:   format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    }),
  },
  {
    label: 'Mes pasado',
    getRange: () => {
      const prev = subMonths(new Date(), 1);
      return {
        from: format(startOfMonth(prev), 'yyyy-MM-dd'),
        to:   format(endOfMonth(prev), 'yyyy-MM-dd'),
      };
    },
  },
  {
    label: 'Trimestre',
    getRange: () => ({
      from: format(startOfQuarter(new Date()), 'yyyy-MM-dd'),
      to:   format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    }),
  },
  {
    label: 'Este año',
    getRange: () => ({
      from: format(startOfYear(new Date()), 'yyyy-MM-dd'),
      to:   format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    }),
  },
  {
    label: 'Últimos 12 meses',
    getRange: () => ({
      from: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
      to:   format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    }),
  },
];

/* ══════════════════════════════════════════════════════════
   PREVIOUS PERIOD SUMMARY TYPE
══════════════════════════════════════════════════════════ */
interface PreviousSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

interface TrendPoint {
  month: string;
  income: number;
  expense: number;
}

interface CategoryOption {
  id: string;
  name: string;
  type: string;
}

interface Activity {
  id: string;
  name: string;
  type: string;    // EVENTO | VENTA
  status: string;  // ACTIVO | FINALIZADO
  startDate: string;
  endDate: string | null;
  investment: number | null;
  salesGoal: number | null;
  income: number;
  expense: number;
  profit: number;
  txCount: number;
}

interface CajaSummary {
  income: number;
  expense: number;
  transfers: number;
  balance: number;
  categories: { name: string; total: number; type: string }[];
}

/* ══════════════════════════════════════════════════════════
   HELPER — percentage change
══════════════════════════════════════════════════════════ */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

/* ══════════════════════════════════════════════════════════
   CUSTOM TOOLTIP FOR CHART
══════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const monthLabel = label ? format(new Date(label + '-01'), 'MMMM yyyy', { locale: es }) : label;
  return (
    <div className="bg-[#0a0c14] border border-white/10 rounded-2xl p-4 shadow-2xl">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">{monthLabel}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs font-black" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [settings, setSettings] = useState<ReportSettings | null>(null);
  const [previousSummary, setPreviousSummary] = useState<PreviousSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [caja, setCaja] = useState<CajaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [range, setRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to:   format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [activePreset, setActivePreset] = useState('Este mes');

  // Debounce ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch categories for filter dropdown ── */
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(setCategories)
      .catch(() => {});
  }, []);

  /* ── Data fetch with debounce ── */
  const fetchReport = useCallback(async (
    r: typeof range,
    catId: string,
    type: string,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: r.from, to: r.to });
      if (catId) params.set('categoryId', catId);
      if (type) params.set('type', type);

      const [rRes, sRes] = await Promise.all([
        fetch(`/api/transactions/report?${params}`),
        fetch('/api/settings'),
      ]);

      if (rRes.ok) {
        const json = await rRes.json();
        setData({ transactions: json.transactions, categories: json.categories, summary: json.summary });
        setPreviousSummary(json.previousSummary ?? null);
        setTrend(json.trend ?? []);
        setActivities(json.activities ?? []);
        setCaja(json.caja ?? null);
      }
      if (sRes.ok) setSettings(await sRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Trigger fetch with debounce on filter changes ── */
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchReport(range, filterCategory, filterType);
    }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [range, filterCategory, filterType, fetchReport]);

  /* ── Preset handler ── */
  const applyPreset = (preset: typeof DATE_PRESETS[number]) => {
    setActivePreset(preset.label);
    setRange(preset.getRange());
  };

  /* ── Export handlers ── */
  const handlePDF = () => {
    if (!data) return;
    generateReportPDF({ data, settings, range, caja, activities });
  };

  const handleExcel = async () => {
    if (!data) return;
    await generateReportExcel({ data, settings, range, caja, activities });
  };

  /* ── Comparison helpers ── */
  const incomeChange = previousSummary ? pctChange(data?.summary.totalIncome ?? 0, previousSummary.totalIncome) : null;
  const expenseChange = previousSummary ? pctChange(data?.summary.totalExpense ?? 0, previousSummary.totalExpense) : null;
  const balanceChange = previousSummary ? pctChange(data?.summary.netBalance ?? 0, previousSummary.netBalance) : null;

  /* ── Loading state ── */
  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Conciliando cuentas...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-0">

      {/* ── HEADER ── */}
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
            Centro de <span className="text-[var(--brand-primary)]">Reportes</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#8c7f72] mt-4">
            Auditoría y control de flujo de caja
          </p>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="flex items-center gap-2 bg-[#13151f] p-1.5 rounded-2xl border border-white/5">
          <Button
            onClick={() => setShowWhatsAppModal(true)}
            className="bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white px-4 py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all border border-green-600/20 whitespace-nowrap"
          >
            <MessageCircle size={14} className="mr-1.5" /> WhatsApp
          </Button>
          <Link href="/presentation" target="_blank">
            <Button className="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all border border-blue-600/20 whitespace-nowrap">
              <Presentation size={14} className="mr-1.5" /> En Vivo
            </Button>
          </Link>
          <Button
            onClick={handleExcel}
            className="bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white px-4 py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all border border-emerald-600/20 whitespace-nowrap"
          >
            <FileSpreadsheet size={14} className="mr-1.5" /> Excel
          </Button>
          <Button
            onClick={handlePDF}
            className="bg-[var(--brand-primary)] text-white px-4 py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all whitespace-nowrap"
          >
            <Download size={14} className="mr-1.5" /> PDF
          </Button>
        </div>
      </div>

      {/* ── DATE PRESETS + FILTERS BAR ── */}
      <div className="mb-8 space-y-4">
        {/* Presets row */}
        <div className="flex flex-wrap items-center gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={cn(
                'px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border',
                activePreset === preset.label
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-lg'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
              )}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'ml-auto px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5',
              showFilters
                ? 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] border-[var(--brand-primary)]/30'
                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
            )}
          >
            <Filter size={12} /> Filtros <ChevronDown size={12} className={cn('transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {/* Expandable filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#13151f] p-4 md:p-5 rounded-2xl border border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-gray-500 uppercase ml-1">Desde</span>
                    <input
                      type="date" value={range.from}
                      onChange={e => { setActivePreset(''); setRange(prev => ({ ...prev, from: e.target.value })); }}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand-primary)] color-scheme-dark w-full text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-gray-500 uppercase ml-1">Hasta</span>
                    <input
                      type="date" value={range.to}
                      onChange={e => { setActivePreset(''); setRange(prev => ({ ...prev, to: e.target.value })); }}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand-primary)] color-scheme-dark w-full text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-gray-500 uppercase ml-1">Categoría</span>
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand-primary)] color-scheme-dark w-full text-white appearance-none"
                    >
                      <option value="">Todas</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-gray-500 uppercase ml-1">Tipo</span>
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand-primary)] color-scheme-dark w-full text-white appearance-none"
                    >
                      <option value="">Todos</option>
                      <option value="income">Ingresos</option>
                      <option value="expense">Gastos</option>
                    </select>
                  </div>
                </div>
                {(filterCategory || filterType) && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      onClick={() => { setFilterCategory(''); setFilterType(''); }}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-500/20"
                    >
                      <X size={12} className="mr-1" /> Limpiar
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
                      {format(new Date(range.from), 'dd MMM', { locale: es })} — {format(new Date(range.to), 'dd MMM yyyy', { locale: es })}
                    </p>

                    <div className="space-y-4">
                      {/* Caja General */}
                      {caja && (
                        <div className="bg-[#0a0c14] p-6 rounded-[2rem]">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">En Caja General</p>
                          <h4 className={cn('text-3xl font-black italic', caja.balance >= 0 ? 'text-white' : 'text-red-400')}>{formatCurrency(caja.balance)}</h4>

                          {/* Desglose entradas */}
                          {caja.categories?.filter(c => c.type === 'income').length > 0 && (
                            <div className="mt-3 text-left">
                              <p className="text-[7px] font-black uppercase tracking-[0.15em] text-green-500/50 mb-1">Entradas ({formatCurrency(caja.income)})</p>
                              {caja.categories.filter(c => c.type === 'income').map(c => (
                                <div key={c.name} className="flex justify-between px-2">
                                  <p className="text-[8px] text-white/40">{c.name}</p>
                                  <p className="text-[8px] font-bold text-green-400/70">{formatCurrency(c.total)}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Desglose salidas */}
                          {caja.categories?.filter(c => c.type === 'expense').length > 0 && (
                            <div className="mt-2 text-left">
                              <p className="text-[7px] font-black uppercase tracking-[0.15em] text-red-500/50 mb-1">Salidas ({formatCurrency(caja.expense)})</p>
                              {caja.categories.filter(c => c.type === 'expense').map(c => (
                                <div key={c.name} className="flex justify-between px-2">
                                  <p className="text-[8px] text-white/40">{c.name}</p>
                                  <p className="text-[8px] font-bold text-red-400/70">{formatCurrency(c.total)}</p>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      )}

                      {/* Actividades/Ventas resumen */}
                      {activities.length > 0 && (
                        <div className="bg-gray-50 p-5 rounded-[2rem]">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Actividades y Ventas</p>
                          <div className="space-y-2">
                            {activities.map(a => (
                              <div key={a.id} className="flex justify-between items-center px-2">
                                <div className="flex items-center gap-2">
                                  <span className={cn('text-[7px] font-black uppercase px-1.5 py-0.5 rounded', a.type === 'VENTA' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600')}>
                                    {a.type === 'VENTA' ? 'V' : 'E'}
                                  </span>
                                  <p className="text-[9px] font-bold text-gray-600 text-left">{a.name}</p>
                                </div>
                                <p className={cn('text-[10px] font-black', a.profit >= 0 ? 'text-green-600' : 'text-red-600')}>
                                  {a.profit >= 0 ? '+' : ''}{formatCurrency(a.profit)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
                        &quot;Fieles en lo poco, sobre mucho te pondré&quot;
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 text-center space-y-4">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        (() => {
                          const incomeCategories = caja?.categories?.filter(c => c.type === 'income') ?? [];
                          const expenseCategories = caja?.categories?.filter(c => c.type === 'expense') ?? [];

                          let msg = `📊 *REPORTE FINANCIERO — ${format(new Date(range.from), 'dd MMM', { locale: es }).toUpperCase()} a ${format(new Date(range.to), 'dd MMM yyyy', { locale: es }).toUpperCase()}*\n\n`;

                          msg += `🏦 *En Caja General:* ${formatCurrency(caja?.balance ?? 0)}\n\n`;

                          // Desglose de entradas
                          msg += `💰 *Entradas (${formatCurrency(caja?.income ?? 0)}):*\n`;
                          if (incomeCategories.length > 0) {
                            msg += incomeCategories.map(c => `   • ${c.name}: ${formatCurrency(c.total)}`).join('\n') + '\n';
                          } else {
                            msg += `   _Sin ingresos este período_\n`;
                          }

                          // Desglose de salidas
                          msg += `\n💸 *Salidas (${formatCurrency(caja?.expense ?? 0)}):*\n`;
                          if (expenseCategories.length > 0) {
                            msg += expenseCategories.map(c => `   • ${c.name}: ${formatCurrency(c.total)}`).join('\n') + '\n';
                          } else {
                            msg += `   _Sin gastos este período_\n`;
                          }

                          // Movimientos internos (transferencias)
                          const transferDetails = (caja as any)?.transferDetails ?? [];
                          if (transferDetails.length > 0) {
                            msg += `\n🔄 *Movimientos internos:*\n`;
                            msg += transferDetails.map((tr: any) =>
                              `   • Se destinó ${formatCurrency(tr.amount)} de ${tr.from} → ${tr.to}${tr.description ? ` (${tr.description})` : ''}`
                            ).join('\n') + '\n';
                          }

                          // Actividades y Ventas
                          if (activities.length > 0) {
                            msg += `\n📋 *Actividades y Ventas (aparte):*\n`;
                            msg += activities.map(a => {
                              if (a.type === 'VENTA') {
                                return `   🛒 ${a.name}: ${a.profit >= 0 ? '+' : ''}${formatCurrency(a.profit)}${a.salesGoal ? ` (${Math.min(100, (a.income / a.salesGoal) * 100).toFixed(0)}% de meta)` : ''}`;
                              }
                              return `   📅 ${a.name}: Gastado ${formatCurrency(a.expense)}`;
                            }).join('\n') + '\n';
                          }

                          // Comparación vs anterior
                          if (previousSummary && incomeChange !== null) {
                            msg += `\n📈 *vs anterior:* Ingresos ${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%\n`;
                          }

                          msg += `\n_"Fieles en lo poco, sobre mucho te pondré."_`;
                          return msg;
                        })()
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

          {/* ── KPI CARDS WITH COMPARISON ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-[3rem] bg-green-500 text-white p-8 relative overflow-hidden group shadow-2xl">
              <ArrowUpCircle className="absolute top-[-20px] right-[-20px] h-40 w-40 opacity-10 rotate-12" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Ingresos del Periodo</p>
              <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter">{formatCurrency(data.summary.totalIncome)}</h3>
              {incomeChange !== null && (
                <div className={cn('mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider', incomeChange >= 0 ? 'text-green-100' : 'text-red-200')}>
                  {incomeChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% vs anterior
                </div>
              )}
            </Card>

            <Card className="rounded-[3rem] bg-red-500 text-white p-8 relative overflow-hidden group shadow-2xl">
              <ArrowDownCircle className="absolute top-[-20px] right-[-20px] h-40 w-40 opacity-10 rotate-12" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Gastos del Periodo</p>
              <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter">{formatCurrency(data.summary.totalExpense)}</h3>
              {expenseChange !== null && (
                <div className={cn('mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider', expenseChange <= 0 ? 'text-green-200' : 'text-red-100')}>
                  {expenseChange <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% vs anterior
                </div>
              )}
            </Card>

            <Card className="rounded-[3rem] bg-[#1a1714] text-white p-8 border-4 border-[var(--brand-primary)] shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] mb-2">Balance Neto</p>
              <h3 className={cn('text-4xl md:text-5xl font-black italic tracking-tighter', data.summary.netBalance >= 0 ? 'text-green-400' : 'text-red-400')}>
                {formatCurrency(data.summary.netBalance)}
              </h3>
              {balanceChange !== null && (
                <div className={cn('mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider', balanceChange >= 0 ? 'text-green-400/70' : 'text-red-400/70')}>
                  {balanceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(1)}% vs anterior
                </div>
              )}
            </Card>
          </div>

          {/* ── CAJA GENERAL + ACTIVIDADES ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Caja General */}
            {caja && (
              <Card className="lg:col-span-4 rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center">
                    <Wallet className="text-[var(--brand-primary)]" size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase italic text-white">Caja General</h3>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">Lo que hay en caja</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {/* Entradas con desglose */}
                  <div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase text-gray-400">Entró</p>
                      <p className="text-sm font-black text-green-500">{formatCurrency(caja.income)}</p>
                    </div>
                    {caja.categories?.filter(c => c.type === 'income').map(c => (
                      <div key={c.name} className="flex justify-between items-center pl-3 mt-1">
                        <p className="text-[9px] text-gray-600">{c.name}</p>
                        <p className="text-[9px] font-bold text-green-500/50">{formatCurrency(c.total)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Salidas con desglose */}
                  <div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase text-gray-400">Se gastó</p>
                      <p className="text-sm font-black text-red-500">{formatCurrency(caja.expense)}</p>
                    </div>
                    {caja.categories?.filter(c => c.type === 'expense').map(c => (
                      <div key={c.name} className="flex justify-between items-center pl-3 mt-1">
                        <p className="text-[9px] text-gray-600">{c.name}</p>
                        <p className="text-[9px] font-bold text-red-500/50">{formatCurrency(c.total)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Transferencias */}
                  {caja.transfers !== 0 && (
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase text-gray-400">Transferencias</p>
                      <p className={cn('text-sm font-black', caja.transfers > 0 ? 'text-blue-400' : 'text-yellow-500')}>
                        {caja.transfers > 0 ? '+' : ''}{formatCurrency(caja.transfers)}
                      </p>
                    </div>
                  )}

                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-white">Queda en caja</p>
                    <p className={cn('text-xl font-black italic', caja.balance >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {formatCurrency(caja.balance)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Actividades / Ventas */}
            <Card className={cn('rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-xl', caja ? 'lg:col-span-8' : 'lg:col-span-12')}>
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <CalendarCheck className="text-blue-400" size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black uppercase italic text-white">Actividades y Ventas</h3>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
                    {activities.length} actividad{activities.length !== 1 ? 'es' : ''} en este período
                    {' · '}
                    {activities.filter(a => a.status === 'FINALIZADO').length} terminada{activities.filter(a => a.status === 'FINALIZADO').length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {activities.length === 0 ? (
                <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest py-8">Sin actividades en este período</p>
              ) : (
                <div className="space-y-3">
                  {activities.map(a => (
                    <div key={a.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                            a.type === 'VENTA' ? 'bg-emerald-500/10' : 'bg-purple-500/10'
                          )}>
                            {a.type === 'VENTA'
                              ? <Store size={16} className="text-emerald-400" />
                              : <CalendarCheck size={16} className="text-purple-400" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white uppercase truncate">{a.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                'text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                                a.type === 'VENTA' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                              )}>
                                {a.type === 'VENTA' ? 'Venta' : 'Evento'}
                              </span>
                              <span className={cn(
                                'text-[8px] font-black uppercase tracking-widest flex items-center gap-1',
                                a.status === 'FINALIZADO' ? 'text-gray-500' : 'text-blue-400'
                              )}>
                                {a.status === 'FINALIZADO' ? <><CheckCircle2 size={10} /> Terminado</> : <><Clock size={10} /> En curso</>}
                              </span>
                              <span className="text-[8px] text-gray-600">{a.txCount} mov.</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {a.type === 'VENTA' ? (
                            <>
                              <p className={cn('text-sm font-black italic', a.profit >= 0 ? 'text-green-400' : 'text-red-400')}>
                                {a.profit >= 0 ? '+' : ''}{formatCurrency(a.profit)}
                              </p>
                              <p className="text-[8px] text-gray-500 font-bold uppercase">
                                {a.profit >= 0 ? 'Ganancia' : 'Pérdida'}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-black italic text-red-400">
                                -{formatCurrency(a.expense)}
                              </p>
                              <p className="text-[8px] text-gray-500 font-bold uppercase">Se invirtió</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Detailed breakdown for ventas */}
                      {a.type === 'VENTA' && (
                        <div className="mt-3 pt-3 border-t border-white/5 ml-12 space-y-3">
                          <div className="flex flex-wrap gap-x-5 gap-y-1">
                            {a.investment != null && (
                              <p className="text-[9px] text-gray-500 font-bold">
                                Capital: <span className="text-[var(--brand-primary)]">{formatCurrency(a.investment)}</span>
                              </p>
                            )}
                            <p className="text-[9px] text-gray-500 font-bold">
                              Vendido: <span className="text-green-500">{formatCurrency(a.income)}</span>
                            </p>
                            <p className="text-[9px] text-gray-500 font-bold">
                              Gastado: <span className="text-red-500">{formatCurrency(a.expense)}</span>
                            </p>
                            <p className="text-[9px] text-gray-500 font-bold">
                              Disponible: <span className="text-white">{formatCurrency(a.profit)}</span>
                            </p>
                          </div>

                          {/* Progress bar toward goal */}
                          {a.salesGoal != null && a.salesGoal > 0 && (
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-[8px] font-black uppercase text-gray-500">
                                  Progreso de venta
                                </p>
                                <p className="text-[8px] font-black text-gray-400">
                                  {formatCurrency(a.income)} / {formatCurrency(a.salesGoal)}
                                  <span className="ml-1.5 text-emerald-400">
                                    ({Math.min(100, (a.income / a.salesGoal) * 100).toFixed(0)}%)
                                  </span>
                                </p>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700"
                                  style={{ width: `${Math.min(100, (a.income / a.salesGoal) * 100)}%` }}
                                />
                              </div>
                              {a.salesGoal && a.investment != null && (
                                <p className="text-[8px] text-gray-600 font-bold mt-1">
                                  Ganancia esperada: <span className="text-emerald-400/70">{formatCurrency(a.salesGoal - a.investment)}</span>
                                  {' · '}Faltan: <span className="text-yellow-400/70">{formatCurrency(Math.max(0, a.salesGoal - a.income))}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── TREND CHART ── */}
          {trend.length > 1 && (
            <Card className="rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-xl mb-8">
              <CardHeader className="px-0 pb-6 border-b border-white/5 mb-6">
                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                  <BarChart3 className="text-[var(--brand-primary)]" /> Tendencia Mensual
                </CardTitle>
              </CardHeader>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(val) => {
                        const d = new Date(val + '-01');
                        return format(d, 'MMM yy', { locale: es });
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}
                    />
                    <Bar dataKey="income" name="Ingresos" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expense" name="Gastos" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* ── CATEGORIES + TRANSACTIONS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-5 rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-xl">
              <CardHeader className="px-0 pb-8 border-b border-white/5 mb-6">
                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                  <PieChart className="text-[var(--brand-primary)]" /> Resumen por Categorías
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {data.categories.length === 0 && (
                  <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest py-8">Sin datos para este período</p>
                )}
                {data.categories.map((cat) => (
                  <div key={cat.name} className="group">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <p className="text-[10px] font-black uppercase text-gray-400">{cat.name}</p>
                      <p className={cn('text-xs font-black', cat.type === 'income' ? 'text-green-500' : 'text-red-500')}>
                        {formatCurrency(cat.total)}
                      </p>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', cat.type === 'income' ? 'bg-green-500' : 'bg-red-500')}
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
                  <span className="text-[9px] font-bold text-gray-500 normal-case not-italic tracking-widest ml-auto">
                    {data.transactions.length} registro{data.transactions.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                {data.transactions.length === 0 && (
                  <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest py-8">Sin movimientos para este período</p>
                )}
                {data.transactions.map((t) => (
                  <div key={t.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/[0.05] transition-all">
                    <div>
                      <p className="text-[8px] font-black text-gray-500 uppercase">
                        {format(new Date(t.date), 'dd MMM yyyy', { locale: es })}
                        {t.category?.name && <span className="ml-2 text-gray-600">· {t.category.name}</span>}
                      </p>
                      <p className="text-xs font-black text-white uppercase truncate max-w-[250px]">{t.description}</p>
                    </div>
                    <p className={cn('font-black italic text-sm whitespace-nowrap', t.type === 'income' ? 'text-green-500' : 'text-red-500')}>
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
