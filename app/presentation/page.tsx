'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, TrendingUp, TrendingDown, Activity,
  Clock, Zap, ArrowUpRight, ArrowDownRight,
  Radio, Maximize, Minimize
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';

/* ══════════════════════════════════════════════════════════
   COUNT-UP HOOK — frame-accurate, ease-out quart
   Handles negative numbers correctly
══════════════════════════════════════════════════════════ */
function useCountUp(target: number, duration = 2000, delay = 500) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef   = useRef<number>();

  useEffect(() => {
    setValue(0);
    startRef.current = null;

    const timeout = setTimeout(() => {
      const absTarget = Math.abs(target);
      const sign      = target < 0 ? -1 : 1;

      const tick = (now: number) => {
        if (!startRef.current) startRef.current = now;
        const elapsed  = now - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 4);
        setValue(Math.round(eased * absTarget) * sign);
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}

/* ══════════════════════════════════════════════════════════
   LIVE CLOCK
══════════════════════════════════════════════════════════ */
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(
      new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time}</span>;
}

/* ══════════════════════════════════════════════════════════
   FULLSCREEN HOOK
══════════════════════════════════════════════════════════ */
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return { isFullscreen, toggle };
}

/* ══════════════════════════════════════════════════════════
   TRANSACTION ROW
══════════════════════════════════════════════════════════ */
function TxRow({ t, i }: { t: any; i: number }) {
  const isIncome = t.type === 'income';
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.1 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
          isIncome ? 'bg-green-500/12' : 'bg-red-500/12'
        )}>
          {isIncome
            ? <ArrowUpRight size={12} className="text-green-400" />
            : <ArrowDownRight size={12} className="text-red-400" />
          }
        </div>
        <div className="min-w-0">
          <p className="text-white font-black text-[11px] uppercase truncate tracking-tight leading-tight">
            {t.description}
          </p>
          <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest mt-0.5">
            {format(new Date(t.date), 'dd MMM', { locale: es })}
          </p>
        </div>
      </div>
      <span className={cn(
        'flex-shrink-0 ml-3 font-black text-sm tracking-tight',
        isIncome ? 'text-green-400' : 'text-red-400'
      )}>
        {isIncome ? '+' : ''}{formatCurrency(t.amount)}
      </span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function PresentationPage() {
  const router = useRouter();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [txRes, evRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/events'),
      ]);
      const tx: any[] = await txRes.json();
      const ev: any[] = await evRes.json();

      const totalIncome  = tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance      = totalIncome - totalExpense;

      setData({
        totalIncome,
        totalExpense,
        balance,
        activeEvents: ev.filter(e => e.status !== 'FINALIZADO').length,
        recentTx: tx.slice(0, 6),
        eventDetails: ev
          .filter(e => e.status !== 'FINALIZADO')
          .map(e => {
            const related = tx.filter(t => t.eventId === e.id);
            const bal = related.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
            return { name: e.name, balance: bal };
          }),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(), 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  /* Animated values — handle negative balance */
  const animBalance = useCountUp(data?.balance      ?? 0, 2200, 700);
  const animIncome  = useCountUp(data?.totalIncome  ?? 0, 1800, 1000);
  const animExpense = useCountUp(data?.totalExpense ?? 0, 1800, 1100);

  const isPositive   = (data?.balance ?? 0) >= 0;
  /* Coverage ratio: what % of expenses are covered by income.
     If positive: surplus %. If negative: deficit %. */
  const coverageRatio = data
    ? data.totalIncome > 0
      ? Math.round((data.balance / data.totalIncome) * 100)
      : -100
    : 0;
  const absRatio     = Math.abs(coverageRatio);
  /* Bar width: always 0-100 based on expense coverage */
  const barWidth = data
    ? Math.min(100, Math.round((data.totalIncome / Math.max(data.totalExpense, 1)) * 100))
    : 0;

  /* Loading */
  if (loading) return (
    <div className="fixed inset-0 bg-[#0a0c14] flex flex-col items-center justify-center gap-5">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
        <Zap size={40} className="text-[var(--brand-primary)]" fill="currentColor" />
      </motion.div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Cargando datos...</p>
    </div>
  );

  return (
    /*
      KEY FIX — Sidebar problem:
      The presentation page opens via Link target="_blank" so it has NO sidebar.
      But if it ever renders inside the layout, we use:
        - fixed inset-0 z-[9999]  → covers everything including sidebar
        - In fullscreen mode, sidebar is completely hidden by the browser
    */
    <div className="fixed inset-0 z-[9999] bg-[#0a0c14] overflow-hidden flex flex-col select-none">

      {/* ── Ambient glows ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={cn(
          'absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] transition-colors duration-1000',
          isPositive ? 'bg-[var(--brand-primary)]/7' : 'bg-red-500/6'
        )} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/4 blur-[140px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            'w-[900px] h-[500px] rounded-full blur-[200px] transition-colors duration-1000',
            isPositive ? 'bg-[var(--brand-primary)]/3' : 'bg-red-500/3'
          )} />
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,107,26,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,26,0.025) 1px,transparent 1px)',
        backgroundSize: '55px 55px',
      }} />

      {/* ════════════════════════════════
          HEADER
      ════════════════════════════════ */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-between px-5 md:px-10 pt-5 pb-4 border-b border-white/5"
      >
        {/* Brand + back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white/30 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Zap size={15} className="text-white" fill="white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-black text-xs uppercase tracking-[0.18em] leading-none">ChurchFlow</p>
              <p className="text-white/20 text-[8px] uppercase tracking-[0.3em] mt-0.5">Finanzas Jóvenes</p>
            </div>
          </div>
        </div>

        {/* Center — date */}
        <div className="hidden md:flex flex-col items-center gap-0.5">
          <p className="text-white/15 text-[8px] uppercase tracking-[0.35em] font-bold">
            {format(new Date(), "eeee, d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-white/20">
            <Clock size={11} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              <LiveClock />
            </span>
          </div>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa (proyección)'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 transition-all text-white/40 hover:text-white group"
          >
            {isFullscreen
              ? <Minimize size={14} />
              : <Maximize size={14} />
            }
            <span className="hidden md:block text-[9px] font-black uppercase tracking-widest">
              {isFullscreen ? 'Salir' : 'Proyectar'}
            </span>
          </button>

          {/* Live pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-green-400">En Vivo</span>
          </div>
        </div>
      </motion.header>

      {/* ════════════════════════════════
          MAIN CONTENT
          FIX: pl-0 always — this page is fixed z-[9999] so sidebar never overlaps
          In fullscreen mode sidebar is fully gone anyway
      ════════════════════════════════ */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden px-5 md:px-10 py-5 md:py-8 gap-6 lg:gap-0">

        {/* ── LEFT: Balance hero ── */}
        <div className="flex-1 flex flex-col justify-center lg:pr-10 gap-5 min-w-0">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className={cn(
              'w-8 h-px transition-colors duration-700',
              isPositive ? 'bg-[var(--brand-primary)]' : 'bg-red-400'
            )} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
              Patrimonio Actual
            </span>
          </motion.div>

          {/* ── GIANT BALANCE NUMBER ──
              FIX: uses w-full + truncate so it never clips on any screen.
              clamp() ensures it scales correctly from mobile → 4K projector */}
          <div className="overflow-hidden w-full">
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className={cn(
                  'block font-black italic tracking-tighter leading-none break-all',
                  isPositive ? 'text-white' : 'text-red-400'
                )}
                style={{ fontSize: 'clamp(2.8rem, 8vw, 8rem)' }}
              >
                {formatCurrency(animBalance)}
              </span>
            </motion.div>
          </div>

          {/* ── FINANCIAL HEALTH BAR ──
              FIX: replaces the confusing "%-97% neto" with clear human language.
              Shows: "Ingresos cubren X% de los gastos" with color logic.  */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-white/25 text-[9px] uppercase tracking-widest font-bold">
                {isPositive ? 'Cobertura financiera' : 'Déficit activo'}
              </span>
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide',
                isPositive
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              )}>
                {isPositive
                  ? `▲ Superávit ${absRatio}%`
                  : `▼ Déficit ${absRatio}% — Gastos superan ingresos`
                }
              </div>
            </div>

            {/* Bar: orange fill = income coverage of expenses */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ delay: 1.0, duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'h-full rounded-full',
                  isPositive
                    ? 'bg-gradient-to-r from-[var(--brand-primary)] to-orange-300'
                    : 'bg-gradient-to-r from-red-500 to-red-400'
                )}
              />
            </div>

            {/* Context line */}
            <p className="text-white/15 text-[9px] font-bold">
              {isPositive
                ? `Los ingresos superan los gastos en ${formatCurrency(data.balance)}`
                : `Faltan ${formatCurrency(Math.abs(data.balance))} para cubrir todos los gastos`
              }
            </p>
          </motion.div>

          {/* ── INCOME / EXPENSE CARDS ── */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl border border-green-500/20 bg-green-500/5 p-4 md:p-5 overflow-hidden"
            >
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-green-500/8 rounded-full blur-xl" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-green-400/60">Ingresos</span>
                <TrendingUp size={12} className="text-green-400" />
              </div>
              <p className="text-green-400 font-black italic tracking-tight leading-none"
                style={{ fontSize: 'clamp(1rem, 2.2vw, 1.6rem)' }}>
                +{formatCurrency(animIncome)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl border border-red-500/20 bg-red-500/5 p-4 md:p-5 overflow-hidden"
            >
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-red-500/8 rounded-full blur-xl" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400/60">Gastos</span>
                <TrendingDown size={12} className="text-red-400" />
              </div>
              <p className="text-red-400 font-black italic tracking-tight leading-none"
                style={{ fontSize: 'clamp(1rem, 2.2vw, 1.6rem)' }}>
                -{formatCurrency(animExpense)}
              </p>
            </motion.div>
          </div>

          {/* Active event pills */}
          {data.eventDetails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.45 }}
              className="flex flex-wrap gap-2"
            >
              {data.eventDetails.slice(0, 4).map((ev: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                  <Activity size={9} className="text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-wide text-white/50 max-w-[110px] truncate">
                    {ev.name}
                  </span>
                  <span className={cn('text-[9px] font-black', ev.balance >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {formatCurrency(ev.balance)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Vertical divider ── */}
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'top' }}
          className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/8 to-transparent self-stretch mx-6"
        />

        {/* ── RIGHT: Recent transactions ── */}
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="lg:w-[340px] xl:w-[400px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio size={12} className="text-[var(--brand-primary)]" />
              <span className="text-white font-black text-xs uppercase tracking-[0.25em]">Flujo Reciente</span>
            </div>
            <span className="text-white/20 text-[9px] uppercase tracking-widest">{data.recentTx.length} mov.</span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none">
            {data.recentTx.map((t: any, i: number) => (
              <TxRow key={t.id} t={t} i={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
            className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between"
          >
            <span className="text-white/15 text-[8px] uppercase tracking-widest">
              {data.activeEvents} actividad{data.activeEvents !== 1 ? 'es' : ''} activa{data.activeEvents !== 1 ? 's' : ''}
            </span>
            <span className="text-[var(--brand-primary)] font-black text-[8px] uppercase tracking-widest">
              {format(new Date(), 'MMM yyyy', { locale: es })}
            </span>
          </motion.div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="relative z-10 border-t border-white/5 px-5 md:px-10 py-3 flex items-center justify-between"
      >
        <p className="text-white/8 text-[8px] uppercase tracking-[0.4em] italic font-bold">Soli Deo Gloria</p>
        <p className="text-white/8 text-[8px] uppercase tracking-[0.4em] font-bold">ChurchFlow Pro v1.3.3</p>
      </motion.footer>
    </div>
  );
}