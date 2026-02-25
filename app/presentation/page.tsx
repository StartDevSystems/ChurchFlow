'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign,
  Activity, Loader2, Clock, Zap, ArrowUpRight, ArrowDownRight,
  Radio
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';

/* ══════════════════════════════════════════════════════════
   COUNT-UP HOOK
   Eased, frame-accurate, no interval drift
══════════════════════════════════════════════════════════ */
function useCountUp(target: number, duration = 2000, delay = 500) {
  const [value, setValue] = useState(0);
  const startRef  = useRef<number | null>(null);
  const rafRef    = useRef<number>();

  useEffect(() => {
    setValue(0);
    startRef.current = null;

    const timeout = setTimeout(() => {
      const tick = (now: number) => {
        if (!startRef.current) startRef.current = now;
        const elapsed  = now - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quart
        const eased = 1 - Math.pow(1 - progress, 4);
        setValue(Math.round(eased * target));
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
    const tick = () => setTime(new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

/* ══════════════════════════════════════════════════════════
   TRANSACTION ROW
══════════════════════════════════════════════════════════ */
function TxRow({ t, i }: { t: any; i: number }) {
  const isIncome = t.type === 'income';
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center justify-between py-4 border-b border-white/5 last:border-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
          isIncome ? 'bg-green-500/10' : 'bg-red-500/10'
        )}>
          {isIncome
            ? <ArrowUpRight size={13} className="text-green-400" />
            : <ArrowDownRight size={13} className="text-red-400" />
          }
        </div>
        <div className="min-w-0">
          <p className="text-white font-black text-xs uppercase truncate tracking-tight leading-tight">
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
        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
      </span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function PresentationPage() {
  const router  = useRouter();
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

  // Auto-refresh every 60s
  useEffect(() => {
    fetchData();
    const id = setInterval(() => { fetchData(); }, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  /* Animated balance values */
  const animBalance  = useCountUp(data?.balance      ?? 0, 2200, 700);
  const animIncome   = useCountUp(data?.totalIncome  ?? 0, 1800, 1000);
  const animExpense  = useCountUp(data?.totalExpense ?? 0, 1800, 1100);
  const netRatio     = data ? Math.round((data.balance / Math.max(data.totalIncome, 1)) * 100) : 0;
  const isPositive   = (data?.balance ?? 0) >= 0;

  /* ── Loading screen ── */
  if (loading) return (
    <div className="fixed inset-0 bg-[#0a0c14] flex flex-col items-center justify-center gap-5">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        <Zap size={40} className="text-[var(--brand-primary)]" fill="currentColor" />
      </motion.div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
        Cargando datos...
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0a0c14] overflow-hidden flex flex-col select-none">

      {/* ── Ambient glows ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[var(--brand-primary)]/7 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[140px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[900px] h-[500px] rounded-full bg-[var(--brand-primary)]/3 blur-[180px]" />
        </div>
      </div>

      {/* ── Grid texture ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,107,26,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,26,0.025) 1px,transparent 1px)',
        backgroundSize: '55px 55px',
      }} />

      {/* ════════════════════════════════
          HEADER
      ════════════════════════════════ */}
      <motion.header
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-6 pb-4 border-b border-white/5"
      >
        {/* Brand + back */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white/30 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shadow-lg">
              <Zap size={17} className="text-white" fill="white" />
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-[0.15em] leading-none">
                ChurchFlow
              </p>
              <p className="text-white/25 text-[8px] uppercase tracking-[0.3em] mt-0.5">
                Sistema Financiero
              </p>
            </div>
          </div>
        </div>

        {/* Center — date */}
        <div className="hidden md:flex flex-col items-center">
          <p className="text-white/20 text-[8px] uppercase tracking-[0.35em]">
            {format(new Date(), "eeee, d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        {/* Right — live + clock */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-white/20">
            <Clock size={11} />
            <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">
              <LiveClock />
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-green-400">
              En Vivo
            </span>
          </div>
        </div>
      </motion.header>

      {/* ════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════ */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden px-6 md:px-12 py-6 md:py-8">

        {/* ── LEFT: Balance hero ── */}
        <div className="flex-1 flex flex-col justify-center lg:pr-12 gap-6">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className="w-10 h-px bg-[var(--brand-primary)]" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/30">
              Patrimonio Actual
            </span>
          </motion.div>

          {/* Giant balance */}
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className={cn(
                  'block font-black italic tracking-tighter leading-none',
                  isPositive ? 'text-white' : 'text-red-400'
                )}
                style={{ fontSize: 'clamp(3rem, 9vw, 8.5rem)' }}
              >
                {formatCurrency(animBalance)}
              </span>
            </motion.div>
          </div>

          {/* Health bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/20 text-[9px] uppercase tracking-widest font-bold">
                Salud financiera
              </span>
              <span className="text-[var(--brand-primary)] text-[9px] font-black uppercase tracking-widest">
                {netRatio}% neto
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, netRatio))}%` }}
                transition={{ delay: 1.1, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-orange-300"
              />
            </div>
          </motion.div>

          {/* Income / Expense cards */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl border border-green-500/20 bg-green-500/5 p-4 md:p-6 overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-500/8 rounded-full blur-xl" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-green-400/60">
                  Ingresos
                </span>
                <TrendingUp size={13} className="text-green-400" />
              </div>
              <p
                className="text-green-400 font-black italic tracking-tight leading-none"
                style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}
              >
                +{formatCurrency(animIncome)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl border border-red-500/20 bg-red-500/5 p-4 md:p-6 overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-red-500/8 rounded-full blur-xl" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-red-400/60">
                  Gastos
                </span>
                <TrendingDown size={13} className="text-red-400" />
              </div>
              <p
                className="text-red-400 font-black italic tracking-tight leading-none"
                style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}
              >
                -{formatCurrency(animExpense)}
              </p>
            </motion.div>
          </div>

          {/* Active events pill row */}
          {data.eventDetails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              {data.eventDetails.slice(0, 4).map((ev: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-3 py-1.5"
                >
                  <Activity size={10} className="text-[var(--brand-primary)] flex-shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-wide text-white/60 max-w-[120px] truncate">
                    {ev.name}
                  </span>
                  <span className={cn(
                    'text-[9px] font-black',
                    ev.balance >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {formatCurrency(ev.balance)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Vertical divider (desktop only) ── */}
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'top' }}
          className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/8 to-transparent self-stretch mx-4"
        />

        {/* ── RIGHT: Recent activity ── */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="lg:w-[360px] xl:w-[420px] flex flex-col mt-6 lg:mt-0"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio size={13} className="text-[var(--brand-primary)]" />
              <span className="text-white font-black text-xs uppercase tracking-[0.25em]">
                Flujo Reciente
              </span>
            </div>
            <span className="text-white/20 text-[9px] uppercase tracking-widest">
              {data.recentTx.length} mov.
            </span>
          </div>

          {/* Transactions */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {data.recentTx.map((t: any, i: number) => (
              <TxRow key={t.id} t={t} i={i} />
            ))}
          </div>

          {/* Bottom stat */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between"
          >
            <span className="text-white/15 text-[9px] uppercase tracking-widest">
              {data.activeEvents} actividad{data.activeEvents !== 1 ? 'es' : ''} activa{data.activeEvents !== 1 ? 's' : ''}
            </span>
            <span className="text-[var(--brand-primary)] font-black text-[9px] uppercase tracking-widest">
              {format(new Date(), 'MMM yyyy', { locale: es })}
            </span>
          </motion.div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="relative z-10 border-t border-white/5 px-6 md:px-12 py-3 flex items-center justify-between"
      >
        <p className="text-white/10 text-[8px] uppercase tracking-[0.35em] italic font-bold">
          Soli Deo Gloria
        </p>
        <p className="text-white/10 text-[8px] uppercase tracking-[0.35em] font-bold">
          ChurchFlow Pro v1.3.3
        </p>
      </motion.footer>
    </div>
  );
}
