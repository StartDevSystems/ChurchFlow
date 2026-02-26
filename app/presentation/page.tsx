'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, TrendingUp, TrendingDown, Activity, Clock, Zap,
  ArrowUpRight, ArrowDownRight, Radio, Maximize, Minimize,
  BarChart2, Target, Calendar, Trophy, TrendingUp as TrendUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type ChartType = 'candle' | 'area' | 'bar' | 'heat';
type TxFilter  = 'all' | 'income' | 'expense' | 'event';
type StatType  = 'income' | 'expense' | 'balance';

interface Candle {
  date: Date; label: string;
  open: number; close: number; high: number; low: number;
  income: number; expense: number; balance: number; isGreen: boolean;
}
interface EventDetail {
  id: string; name: string;
  income: number; expense: number; balance: number;
  goalAmount?: number;
}
interface PageData {
  totalIncome: number; totalExpense: number; balance: number;
  activeEvents: number;
  recentTx: any[];
  allTx: any[];
  eventDetails: EventDetail[];
  prevMonthIncome: number;
  prevWeekIncome: number;
  prevWeekExpense: number;
}

const MONTHLY_GOAL = 80000;

/* ══════════════════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════════════════ */
function useCountUp(target: number, duration = 2000, delay = 400) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    setValue(0);
    const t = setTimeout(() => {
      const abs = Math.abs(target), sign = target < 0 ? -1 : 1;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const e = 1 - Math.pow(1 - p, 4);
        setValue(Math.round(e * abs) * sign);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);
  return value;
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  const toggle = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);
  return { isFullscreen, toggle };
}

/* ══════════════════════════════════════════════════════════
   LIVE CLOCK
══════════════════════════════════════════════════════════ */
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time}</span>;
}

/* ══════════════════════════════════════════════════════════
   BUILD CANDLES
══════════════════════════════════════════════════════════ */
function buildCandles(transactions: any[]): Candle[] {
  const byDay = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const key = format(new Date(t.date), 'yyyy-MM-dd');
    const cur = byDay.get(key) ?? { income: 0, expense: 0 };
    if (t.type === 'income') cur.income += t.amount; else cur.expense += t.amount;
    byDay.set(key, cur);
  }
  let prev = 0;
  return Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, { income, expense }]) => {
    const balance = income - expense, isGreen = balance >= 0;
    const base = (income + expense) / 2;
    const open  = prev || base * 0.9;
    const close = open + balance * 0.75;
    const high  = Math.max(open, close) + income * 0.06;
    const low   = Math.min(open, close) - expense * 0.06;
    const date  = new Date(key + 'T00:00:00');
    prev = close;
    return { date, label: format(date, 'dd MMM', { locale: es }), open, close, high, low, income, expense, balance, isGreen };
  });
}

/* ══════════════════════════════════════════════════════════
   CANVAS CHART
══════════════════════════════════════════════════════════ */
function CandleChart({
  candles, onHover, hovIdx, chartType,
}: {
  candles: Candle[]; onHover: (idx: number | null, x: number, y: number) => void;
  hovIdx: number | null; chartType: ChartType;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef   = useRef<HTMLCanvasElement>(null);
  const state   = useRef({ zStart: 0, zCount: 0, drag: false, dragX: 0, dragZ: 0 });

  useEffect(() => { state.current.zCount = candles.length; }, [candles.length]);

  const draw = useCallback((hov: number | null) => {
    const cv = cvRef.current; if (!cv) return;
    const cx = cv.getContext('2d'); if (!cx) return;
    const { zStart, zCount } = state.current;
    const W = cv.clientWidth, H = cv.clientHeight;
    cx.clearRect(0, 0, W, H);
    const vis = candles.slice(zStart, zStart + zCount);
    if (!vis.length) return;

    const PAD = { top: 16, right: 66, bottom: 28, left: 50 };
    const CW  = W - PAD.left - PAD.right;
    const CH  = H - PAD.top  - PAD.bottom;
    const maxP = Math.max(...vis.map(c => c.high)) * 1.02;
    const minP = Math.min(...vis.map(c => c.low))  * 0.97;
    const rng  = maxP - minP || 1;
    const xS   = (i: number) => PAD.left + (i / (vis.length - 1 || 1)) * CW;
    const yS   = (v: number) => PAD.top  + CH - ((v - minP) / rng) * CH;

    // Grid
    cx.strokeStyle = 'rgba(255,255,255,0.04)'; cx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = minP + rng * (i / 4), y = yS(v);
      cx.beginPath(); cx.moveTo(PAD.left, y); cx.lineTo(W - PAD.right, y); cx.stroke();
      cx.fillStyle = 'rgba(255,255,255,0.2)';
      cx.font = `${Math.max(8, W * 0.009)}px Inter,system-ui`;
      cx.textAlign = 'right';
      cx.fillText((v / 1000).toFixed(1) + 'K', PAD.left - 4, y + 4);
    }
    // X labels
    const step = Math.max(1, Math.floor(vis.length / Math.max(4, Math.floor(W / 80))));
    vis.forEach((c, i) => {
      if (i % step === 0 || i === vis.length - 1) {
        cx.fillStyle = 'rgba(255,255,255,0.2)';
        cx.font = `${Math.max(8, W * 0.009)}px Inter,system-ui`;
        cx.textAlign = 'center';
        cx.fillText(c.label, xS(i), H - PAD.bottom + 16);
      }
    });

    // Clip
    cx.save(); cx.beginPath(); cx.rect(PAD.left, PAD.top, CW, CH); cx.clip();

    if (chartType === 'candle') {
      const cW = Math.max(3, (CW / vis.length) * 0.52);
      vis.forEach((c, i) => {
        const col = c.isGreen ? '#4ade80' : '#f87171', h = hov === i;
        const bT  = Math.min(yS(c.open), yS(c.close));
        const bH  = Math.max(1.5, Math.abs(yS(c.open) - yS(c.close)));
        cx.globalAlpha = h ? 1 : 0.82;
        cx.strokeStyle = h ? '#fff' : col; cx.lineWidth = h ? 1.5 : 1;
        cx.beginPath(); cx.moveTo(xS(i), yS(c.high)); cx.lineTo(xS(i), yS(c.low)); cx.stroke();
        cx.fillStyle = h ? (c.isGreen ? '#86efac' : '#fca5a5') : col;
        rrect(cx, xS(i) - cW / 2, bT, cW, bH, 1.5); cx.fill();
      });
      cx.globalAlpha = 1;
    } else if (chartType === 'area') {
      cx.beginPath();
      vis.forEach((c, i) => i === 0 ? cx.moveTo(xS(i), yS(c.income)) : cx.lineTo(xS(i), yS(c.income)));
      cx.lineTo(xS(vis.length - 1), PAD.top + CH); cx.lineTo(xS(0), PAD.top + CH); cx.closePath();
      const ig = cx.createLinearGradient(0, PAD.top, 0, PAD.top + CH);
      ig.addColorStop(0, 'rgba(74,222,128,0.3)'); ig.addColorStop(1, 'rgba(74,222,128,0)');
      cx.fillStyle = ig; cx.fill();
      cx.beginPath();
      vis.forEach((c, i) => i === 0 ? cx.moveTo(xS(i), yS(c.income)) : cx.lineTo(xS(i), yS(c.income)));
      cx.strokeStyle = '#4ade80'; cx.lineWidth = 2; cx.stroke();
      cx.beginPath();
      vis.forEach((c, i) => i === 0 ? cx.moveTo(xS(i), yS(c.expense)) : cx.lineTo(xS(i), yS(c.expense)));
      cx.strokeStyle = '#f87171'; cx.lineWidth = 2; cx.setLineDash([4, 3]); cx.stroke(); cx.setLineDash([]);
    } else if (chartType === 'bar') {
      const bW = Math.max(3, (CW / vis.length) * 0.3), base = PAD.top + CH;
      vis.forEach((c, i) => {
        cx.fillStyle = 'rgba(74,222,128,0.7)';
        cx.fillRect(xS(i) - bW - 1.5, yS(c.income), bW, base - yS(c.income));
        cx.fillStyle = 'rgba(248,113,113,0.7)';
        cx.fillRect(xS(i) + 1.5, yS(c.expense), bW, base - yS(c.expense));
      });
    } else if (chartType === 'heat') {
      const mx = Math.max(...vis.map(c => Math.abs(c.balance))) || 1;
      const cW = Math.max(8, (CW / vis.length) - 2), cH = Math.min(CH * 0.6, 60);
      vis.forEach((c, i) => {
        const int = Math.abs(c.balance) / mx;
        cx.fillStyle = c.isGreen ? `rgba(74,222,128,${0.1 + int * 0.85})` : `rgba(248,113,113,${0.1 + int * 0.85})`;
        rrect(cx, xS(i) - cW / 2, PAD.top + CH / 2 - cH / 2, cW, cH, 4); cx.fill();
        if (hov === i) { cx.strokeStyle = '#fff'; cx.lineWidth = 1.5; rrect(cx, xS(i) - cW / 2, PAD.top + CH / 2 - cH / 2, cW, cH, 4); cx.stroke(); }
      });
    }
    cx.restore();

    // Last price line
    const last = vis[vis.length - 1], ly = yS(last.close);
    cx.setLineDash([4, 5]); cx.strokeStyle = 'rgba(255,107,26,0.4)'; cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(PAD.left, ly); cx.lineTo(W - PAD.right, ly); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = 'rgba(255,107,26,0.18)'; rrect(cx, W - PAD.right + 3, ly - 11, 60, 22, 5); cx.fill();
    cx.strokeStyle = 'rgba(255,107,26,0.5)'; rrect(cx, W - PAD.right + 3, ly - 11, 60, 22, 5); cx.stroke();
    cx.fillStyle = '#ff6b1a'; cx.font = `700 ${Math.max(8, W * 0.009)}px Inter,system-ui`;
    cx.textAlign = 'center'; cx.fillText((last.close / 1000).toFixed(1) + 'K', W - PAD.right + 33, ly + 4);

    // Crosshair
    if (hov !== null && hov < vis.length) {
      const c = vis[hov], cx2 = xS(hov), cy = yS(c.close);
      cx.setLineDash([3, 4]); cx.strokeStyle = 'rgba(255,255,255,0.13)'; cx.lineWidth = 1;
      cx.beginPath(); cx.moveTo(cx2, PAD.top); cx.lineTo(cx2, PAD.top + CH); cx.stroke();
      cx.beginPath(); cx.moveTo(PAD.left, cy); cx.lineTo(W - PAD.right, cy); cx.stroke(); cx.setLineDash([]);
      cx.fillStyle = c.isGreen ? '#4ade80' : '#f87171';
      rrect(cx, W - PAD.right + 3, cy - 10, 60, 20, 5); cx.fill();
      cx.fillStyle = '#000'; cx.font = `700 ${Math.max(8, W * 0.009)}px Inter,system-ui`;
      cx.textAlign = 'center'; cx.fillText((c.close / 1000).toFixed(1) + 'K', W - PAD.right + 33, cy + 4);
    }
  }, [candles, chartType]);

  // Resize
  useEffect(() => {
    const wrap = wrapRef.current; if (!wrap) return;
    const obs = new ResizeObserver(() => {
      const cv = cvRef.current; if (!cv) return;
      const { width, height } = wrap.getBoundingClientRect();
      cv.width = width * devicePixelRatio; cv.height = height * devicePixelRatio;
      cv.style.width = width + 'px'; cv.style.height = height + 'px';
      const cx = cv.getContext('2d'); if (cx) cx.scale(devicePixelRatio, devicePixelRatio);
      draw(null);
    });
    obs.observe(wrap); return () => obs.disconnect();
  }, [draw]);

  useEffect(() => { draw(hovIdx); }, [hovIdx, chartType, draw]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const cv = cvRef.current; if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const { zStart, zCount } = state.current;
    const CW   = cv.clientWidth - 50 - 66;
    const vis  = candles.slice(zStart, zStart + zCount);
    const idx  = Math.round(((mx - 50) / CW) * (vis.length - 1));
    if (idx >= 0 && idx < vis.length) onHover(idx, e.clientX, e.clientY);
    if (state.current.drag) {
      const dx = e.clientX - state.current.dragX;
      const sh = Math.round(-dx / (CW / zCount));
      state.current.zStart = Math.max(0, Math.min(candles.length - zCount, state.current.dragZ + sh));
      draw(hovIdx);
    }
  }, [candles, onHover, draw, hovIdx]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const s = state.current;
    s.zCount = Math.max(3, Math.min(candles.length, s.zCount + (e.deltaY > 0 ? 2 : -2)));
    s.zStart = Math.max(0, Math.min(candles.length - s.zCount, s.zStart));
    draw(hovIdx);
  }, [candles.length, draw, hovIdx]);

  return (
    <div ref={wrapRef} className="w-full h-full">
      <canvas ref={cvRef} className="block w-full h-full" style={{ cursor: 'crosshair' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => { onHover(null, 0, 0); draw(null); }}
        onMouseDown={e => { state.current.drag = true; state.current.dragX = e.clientX; state.current.dragZ = state.current.zStart; }}
        onWheel={onWheel}
      />
    </div>
  );
}

function rrect(cx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  cx.beginPath(); cx.moveTo(x + r, y); cx.lineTo(x + w - r, y);
  cx.quadraticCurveTo(x + w, y, x + w, y + r); cx.lineTo(x + w, y + h - r);
  cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); cx.lineTo(x + r, y + h);
  cx.quadraticCurveTo(x, y + h, x, y + h - r); cx.lineTo(x, y + r);
  cx.quadraticCurveTo(x, y, x + r, y); cx.closePath();
}

/* ══════════════════════════════════════════════════════════
   CHART TOOLTIP
══════════════════════════════════════════════════════════ */
function ChartTooltip({ candle, x, y }: { candle: Candle | null; x: number; y: number }) {
  return (
    <AnimatePresence>
      {candle && (
        <motion.div key="ctip"
          initial={{ opacity: 0, scale: 0.95, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
          className="fixed z-[10000] pointer-events-none hidden md:block"
          style={{ left: x + 16, top: Math.max(60, y - 120) }}
        >
          <div className="bg-[#13151f]/97 border border-white/10 rounded-2xl p-3 min-w-[190px] shadow-2xl backdrop-blur-xl">
            <p className="text-[8px] uppercase tracking-widest font-bold text-white/30 mb-2">
              {format(candle.date, "eeee d 'de' MMM", { locale: es })}
            </p>
            {[
              { l: 'Ingresos', v: formatCurrency(candle.income),  c: 'text-green-400' },
              { l: 'Gastos',   v: formatCurrency(candle.expense), c: 'text-red-400'   },
              { l: 'Balance',  v: formatCurrency(candle.balance), c: candle.balance >= 0 ? 'text-green-400' : 'text-red-400' },
            ].map(r => (
              <div key={r.l} className="flex justify-between gap-4 mb-1">
                <span className="text-[9px] text-white/25">{r.l}</span>
                <span className={cn('text-[9px] font-bold', r.c)}>{r.v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════
   OHLC BAR
══════════════════════════════════════════════════════════ */
function OHLCBar({ candle }: { candle: Candle | null }) {
  return (
    <AnimatePresence>
      {candle && (
        <motion.div key="ohlc"
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 26 }} exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3 md:gap-5 px-4 border-b border-white/5 overflow-hidden flex-shrink-0 text-[9px]"
        >
          {[
            { l: 'ING', v: formatCurrency(candle.income),  c: 'text-green-400' },
            { l: 'GAS', v: formatCurrency(candle.expense), c: 'text-red-400'   },
            { l: 'BAL', v: formatCurrency(candle.balance), c: candle.balance >= 0 ? 'text-green-400' : 'text-red-400' },
          ].map(r => (
            <span key={r.l}>
              <span className="text-white/20 mr-1">{r.l}</span>
              <span className={cn('font-bold', r.c)}>{r.v}</span>
            </span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════
   TICKER TAPE
══════════════════════════════════════════════════════════ */
function TickerTape({ transactions }: { transactions: any[] }) {
  const items = [...transactions.slice(0, 10), ...transactions.slice(0, 10)];
  return (
    <div className="flex-shrink-0 h-[30px] border-t border-white/5 bg-[#0a0c14]/92 flex items-center overflow-hidden relative z-10">
      <div className="flex-shrink-0 px-2.5 h-full flex items-center border-r border-white/5 bg-[var(--brand-primary)]/8">
        <Radio size={9} className="text-[var(--brand-primary)]" />
        <span className="text-[7.5px] font-black uppercase tracking-widest text-[var(--brand-primary)] ml-1.5 hidden sm:block">En Vivo</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <motion.div className="flex items-center whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }} transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}>
          {items.map((t, i) => {
            const isInc = t.type === 'income';
            return (
              <span key={i} className="inline-flex items-center gap-1.5 px-4 border-r border-white/5 text-[8.5px]">
                <span className="text-white/35 font-medium truncate max-w-[110px]">{t.description}</span>
                <span className={cn('font-black', isInc ? 'text-green-400' : 'text-red-400')}>
                  {isInc ? '▲' : '▼'} {formatCurrency(Math.abs(t.amount))}
                </span>
                <span className="text-white/10">·</span>
              </span>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   GOAL BAR
══════════════════════════════════════════════════════════ */
function GoalBar({ totalIncome }: { totalIncome: number }) {
  const pct = Math.min(100, Math.round((totalIncome / MONTHLY_GOAL) * 100));
  const animated = useCountUp(totalIncome, 1600, 600);
  return (
    <div className="flex-shrink-0 px-4 py-2 border-t border-white/5 bg-[#0a0c14]/70">
      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Target size={9} className="text-[var(--brand-primary)]" />
          <span className="text-[7.5px] font-black uppercase tracking-widest text-white/25">Meta del Mes</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-green-400 font-black italic text-[11px] leading-none">{formatCurrency(animated)}</span>
          <span className="text-white/20 text-[7.5px]">/ {formatCurrency(MONTHLY_GOAL)}</span>
          <span className="text-[var(--brand-primary)] font-black text-[9px]">{pct}%</span>
        </div>
      </div>
      <div className="h-[5px] bg-white/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: 'linear-gradient(90deg, #4ade80, #86efac)' }}>
          <motion.div className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
            animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DAY PROGRESS BAR
══════════════════════════════════════════════════════════ */
function DayProgressBar({ totalIncome, prevMonthIncome, lastActivityMins = 3 }: {
  totalIncome: number; prevMonthIncome: number; lastActivityMins?: number;
}) {
  const today = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const vsPct = prevMonthIncome > 0 ? Math.round(((totalIncome - prevMonthIncome) / prevMonthIncome) * 100) : 0;
  const isUp  = vsPct >= 0;

  return (
    <div className="flex-shrink-0 flex items-center gap-2 md:gap-4 px-3 md:px-5 py-1.5 border-b border-white/5 bg-[#0a0c14]/80 flex-wrap text-[8px]">
      <div className="flex items-center gap-2">
        <Calendar size={9} className="text-white/20 flex-shrink-0" />
        <span className="text-white/20 font-bold uppercase tracking-widest whitespace-nowrap">
          Día <span className="text-[var(--brand-primary)] font-black">{today}</span> de {daysInMonth}
        </span>
        <div className="w-16 md:w-24 h-[3px] bg-white/6 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }}
            animate={{ width: `${Math.round((today / daysInMonth) * 100)}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,var(--brand),#ffb347)' }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-white/20">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
        </span>
        <span>Última actividad hace <span className="text-white/50 font-bold">{lastActivityMins} min</span></span>
      </div>
      <div className="flex-1" />
      <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full font-black border',
        isUp ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400')}>
        {isUp ? '▲' : '▼'} {Math.abs(vsPct)}% vs mes anterior
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HEALTH GAUGE (SVG)
══════════════════════════════════════════════════════════ */
function HealthGauge({ score }: { score: number }) {
  const color  = score < 40 ? '#f87171' : score < 70 ? '#fbbf24' : '#4ade80';
  const status = score < 40 ? '⚠️ Déficit' : score < 70 ? '⚡ Precaución' : '✅ Saludable';
  const statusBg = score < 40 ? 'bg-red-500/10 text-red-400 border-red-500/20' : score < 70 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20';

  // Arc math: 180° half circle, left to right
  const cx2 = 60, cy2 = 60, r = 50;
  const clampedScore = Math.max(0, Math.min(100, score));
  const endAngle = Math.PI + (clampedScore / 100) * Math.PI;
  const x1 = cx2 + r * Math.cos(Math.PI), y1 = cy2 + r * Math.sin(Math.PI);
  const x2 = cx2 + r * Math.cos(endAngle), y2 = cy2 + r * Math.sin(endAngle);
  const largeArc = endAngle - Math.PI > Math.PI ? 1 : 0;
  const needleDeg = -90 + (clampedScore / 100) * 180;

  const animScore = useCountUp(score, 1400, 700);

  return (
    <div className="flex flex-col items-center p-3 rounded-2xl bg-white/[0.03] border border-white/5">
      <p className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">💊 Salud Financiera</p>
      <svg viewBox="0 0 120 68" className="w-[110px] h-[60px]">
        {/* BG arc */}
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
        {/* Zone colors */}
        <path d="M10,60 A50,50 0 0,1 43,18"  fill="none" stroke="rgba(248,113,113,0.25)"  strokeWidth="10" strokeLinecap="round"/>
        <path d="M43,18 A50,50 0 0,1 77,18"  fill="none" stroke="rgba(251,191,36,0.25)"   strokeWidth="10" strokeLinecap="round"/>
        <path d="M77,18 A50,50 0 0,1 110,60" fill="none" stroke="rgba(74,222,128,0.25)"   strokeWidth="10" strokeLinecap="round"/>
        {/* Fill */}
        <motion.path
          initial={{ d: `M${x1},${y1} A${r},${r} 0 0,1 ${x1},${y1}` }}
          animate={{ d: `M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2}` }}
          transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        />
        {/* Needle */}
        <motion.line x1="60" y1="60" x2="60" y2="18"
          stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"
          initial={{ rotate: -90 }} animate={{ rotate: needleDeg }}
          transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: '60px 60px' }}
        />
        <circle cx="60" cy="60" r="3.5" fill="white" opacity="0.4"/>
      </svg>
      <p className="font-black italic leading-none mt-1" style={{ fontSize: 'clamp(1.1rem,2.5vw,1.6rem)', color }}>{animScore}</p>
      <div className={cn('mt-1.5 text-[7.5px] font-black px-2 py-0.5 rounded-full border', statusBg)}>{status}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROJECTION CARD
══════════════════════════════════════════════════════════ */
function ProjectionCard({ totalIncome, today }: { totalIncome: number; today: number }) {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyAvg    = today > 0 ? totalIncome / today : 0;
  const projected   = Math.round(dailyAvg * daysInMonth);
  const isAboveGoal = projected >= MONTHLY_GOAL;
  const diff        = Math.abs(projected - MONTHLY_GOAL);
  const animProj    = useCountUp(projected, 1400, 800);

  return (
    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
      <p className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 flex items-center gap-1.5">
        <TrendUp size={9} className="text-[var(--brand-primary)]" /> Proyección Final de Mes
      </p>
      <p className={cn('font-black italic leading-none', isAboveGoal ? 'text-green-400' : 'text-red-400')}
        style={{ fontSize: 'clamp(1rem,2.2vw,1.4rem)' }}>
        {formatCurrency(animProj)}
      </p>
      <p className="text-[7.5px] text-white/25 mt-1.5 leading-relaxed">
        A este ritmo cerrarás en{' '}
        <span className={cn('font-bold', isAboveGoal ? 'text-green-400' : 'text-red-400')}>{formatCurrency(projected)}</span>
        {' · '}Meta: {formatCurrency(MONTHLY_GOAL)}
      </p>
      <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
        <span className="text-[7px] text-white/20">vs Meta</span>
        <span className={cn('text-[8px] font-black', isAboveGoal ? 'text-green-400' : 'text-red-400')}>
          {isAboveGoal ? '▲ +' : '▼ -'}{formatCurrency(diff)}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TOP SOURCES CARD
══════════════════════════════════════════════════════════ */
function TopSourcesCard({ transactions }: { transactions: any[] }) {
  const byCategory = transactions
    .filter(t => t.type === 'income')
    .reduce((acc: Record<string, number>, t) => {
      const cat = t.category?.name || t.description?.split(' ')[0] || 'Otros';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {});

  const sorted = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const max = sorted[0]?.[1] || 1;

  return (
    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
      <p className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/20 mb-2.5 flex items-center gap-1.5">
        <Trophy size={9} className="text-[var(--brand-primary)]" /> Top Fuentes de Ingreso
      </p>
      {sorted.map(([name, amount], i) => (
        <div key={name} className="flex items-center gap-2 mb-2 last:mb-0">
          <span className="text-[8px] font-black text-white/20 w-3 flex-shrink-0">{i + 1}</span>
          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            <span className="text-[7.5px] font-bold text-white/40 truncate">{name}</span>
            <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }}
                animate={{ width: `${(amount / max) * 100}%` }}
                transition={{ duration: 0.9, delay: 0.8 + i * 0.1 }}
                className="h-full rounded-full"
                style={{ background: `rgba(74,222,128,${0.8 - i * 0.2})` }} />
            </div>
          </div>
          <span className="text-[8px] font-black text-green-400 flex-shrink-0">{formatCurrency(amount)}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   EVENT CARD WITH PROGRESS
══════════════════════════════════════════════════════════ */
function EventProgressRow({ ev, i }: { ev: EventDetail; i: number }) {
  const isPos   = ev.balance >= 0;
  const goalAmt = ev.goalAmount || ev.income * 1.4;
  const pct     = Math.min(100, Math.round((ev.income / goalAmt) * 100));

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.9 + i * 0.08 }}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 mb-1.5 last:mb-0"
    >
      <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isPos ? 'bg-green-400' : 'bg-red-400')} />
      <span className="text-[8px] font-bold text-white/50 flex-1 truncate">{ev.name}</span>
      <div className="w-14 h-[3px] bg-white/6 rounded-full overflow-hidden flex-shrink-0">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, delay: 1 + i * 0.1 }}
          className={cn('h-full rounded-full', isPos ? 'bg-green-400/70' : 'bg-red-400/70')} />
      </div>
      <span className={cn('text-[7.5px] font-black w-8 text-right flex-shrink-0', isPos ? 'text-green-400' : 'text-red-400')}>{pct}%</span>
      <span className={cn('text-[8px] font-black flex-shrink-0', isPos ? 'text-green-400' : 'text-red-400')}>
        {isPos ? '+' : ''}{formatCurrency(ev.balance)}
      </span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   TRANSACTION ROW
══════════════════════════════════════════════════════════ */
const CAT_ICONS: Record<string, string> = {
  diezmo: '💚', ofrenda: '💜', evento: '🟠', gasto: '🔴', servicio: '🔵',
};
const CAT_COLORS: Record<string, string> = {
  diezmo:  'bg-green-500/10 text-green-400/70',
  ofrenda: 'bg-purple-500/10 text-purple-400/70',
  evento:  'bg-orange-500/10 text-orange-400/70',
  gasto:   'bg-red-500/10 text-red-400/70',
  servicio:'bg-blue-500/10 text-blue-400/70',
};

function TxRow({ t, i }: { t: any; i: number }) {
  const isInc = t.type === 'income';
  const cat   = (t.category?.name || 'gasto').toLowerCase();
  return (
    <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.0 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 py-3.5 border-b border-white/5 last:border-0"
    >
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[13px]',
        isInc ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
        {CAT_ICONS[cat] || (isInc ? '↑' : '↓')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black uppercase truncate tracking-tight text-white/90 leading-tight">{t.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">
            {format(new Date(t.date), 'dd MMM', { locale: es })}
          </span>
          {cat && (
            <span className={cn('text-[7.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter', CAT_COLORS[cat] || 'bg-white/8 text-white/40')}>
              {cat}
            </span>
          )}
        </div>
      </div>
      <span className={cn('flex-shrink-0 font-black text-[13px] tracking-tighter', isInc ? 'text-green-400' : 'text-red-400')}>
        {isInc ? '+' : '-'}{formatCurrency(t.amount)}
      </span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   STAT CARD (chart side panel)
══════════════════════════════════════════════════════════ */
function StatCard({ label, value, colorClass, bgClass, sparkPts, tag, selected, onClick }: {
  label: string; value: number; colorClass: string; bgClass: string;
  sparkPts: string; tag: string; selected: boolean; onClick: () => void;
}) {
  const anim = useCountUp(value, 1600, 400);
  const sparkColor = colorClass.includes('green') ? '#4ade80' : colorClass.includes('red') ? '#f87171' : '#fff';
  return (
    <button onClick={onClick}
      className={cn('w-full text-left px-3 py-2.5 border-b border-white/5 transition-all duration-200',
        selected ? bgClass : 'hover:bg-white/[0.02]')}>
      <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/25 mb-1">{label}</p>
      <p className={cn('font-black italic tracking-tight leading-none', colorClass)}
        style={{ fontSize: 'clamp(0.9rem,2.2vw,1.25rem)' }}>
        {formatCurrency(anim)}
      </p>
      <AnimatePresence>
        {selected && (
          <motion.div key="spark" initial={{ height: 0, opacity: 0 }} animate={{ height: 28, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            className="overflow-hidden mt-1.5">
            <svg viewBox="0 0 160 28" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor}/>
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <polyline points={sparkPts} fill="none" stroke={sparkColor} strokeWidth="1.5" opacity="0.85"/>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
      <p className={cn('text-[7px] font-bold mt-1 transition-opacity', selected ? 'opacity-100' : 'opacity-0', colorClass.replace('text-', 'text-').replace('400', '400/70'))}>
        {tag}
      </p>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function PresentationPage() {
  const router = useRouter();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [data, setData]     = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  // View toggle
  const [showChart, setShowChart] = useState(false);

  // Chart state
  const [chartType, setChartType]   = useState<ChartType>('candle');
  const [hovIdx, setHovIdx]         = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [candles, setCandles]       = useState<Candle[]>([]);
  const [selStat, setSelStat]       = useState<StatType>('income');

  // Panel state
  const [txFilter, setTxFilter] = useState<TxFilter>('all');

  const fetchData = useCallback(async () => {
    try {
      const [txRes, evRes] = await Promise.all([fetch('/api/transactions'), fetch('/api/events')]);
      const tx: any[] = await txRes.json();
      const ev: any[] = await evRes.json();

      const totalIncome  = tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance      = totalIncome - totalExpense;
      const activeEvs    = ev.filter(e => e.status !== 'FINALIZADO');

      // Simulated prev month/week (replace with real API call)
      const prevMonthIncome  = totalIncome * 0.78;
      const prevWeekIncome   = totalIncome * 0.22;
      const prevWeekExpense  = totalExpense * 0.23;

      setData({
        totalIncome, totalExpense, balance,
        activeEvents: activeEvs.length,
        recentTx: tx.slice(0, 8),
        allTx: tx,
        prevMonthIncome, prevWeekIncome, prevWeekExpense,
        eventDetails: activeEvs.map(e => {
          const rel = tx.filter(t => t.eventId === e.id);
          const inc = rel.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
          const exp = rel.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          return { id: e.id, name: e.name, income: inc, expense: exp, balance: inc - exp, goalAmount: e.goalAmount };
        }),
      });
      setCandles(buildCandles(tx));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const onHover = useCallback((idx: number | null, x: number, y: number) => {
    setHovIdx(idx); setTooltipPos({ x, y });
  }, []);

  const animBalance  = useCountUp(data?.balance      ?? 0, 2200, 700);
  const animIncome   = useCountUp(data?.totalIncome  ?? 0, 1800, 900);
  const animExpense  = useCountUp(data?.totalExpense ?? 0, 1800, 1000);
  const isPositive   = (data?.balance ?? 0) >= 0;
  const barWidth     = data ? Math.min(100, Math.round((data.totalIncome / Math.max(data.totalExpense, 1)) * 100)) : 0;
  const coveragePct  = data?.totalIncome ? Math.round((data.balance / data.totalIncome) * 100) : 0;
  const healthScore  = data ? Math.min(100, Math.max(0, Math.round(barWidth * 0.7 + (isPositive ? 30 : 0)))) : 0;

  // TX filter
  const filteredTx = (data?.allTx ?? []).filter(t => {
    if (txFilter === 'income')  return t.type === 'income';
    if (txFilter === 'expense') return t.type === 'expense';
    if (txFilter === 'event')   return t.eventId !== null && t.eventId !== undefined;
    return true;
  }).slice(0, 10);

  const hovCandle = hovIdx !== null ? candles[hovIdx] ?? null : null;

  // Context line for balance
  const weeksOfExpenses = data && data.totalExpense > 0
    ? ((data.balance / (data.totalExpense / 4.33)) ).toFixed(1)
    : '0';
  const monthsReserve = data && data.totalExpense > 0
    ? (data.balance / data.totalExpense).toFixed(1)
    : '0';

  // Week-over-week trend
  const incWeekPct = data?.prevWeekIncome ? Math.round(((data.totalIncome * 0.22 - data.prevWeekIncome) / data.prevWeekIncome) * 100) : 0;
  const expWeekPct = data?.prevWeekExpense ? Math.round(((data.totalExpense * 0.23 - data.prevWeekExpense) / data.prevWeekExpense) * 100) : 0;

  if (loading) return (
    <div className="fixed inset-0 bg-[#0a0c14] flex flex-col items-center justify-center gap-5">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
        <Zap size={36} className="text-[var(--brand-primary)]" fill="currentColor" />
      </motion.div>
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Cargando datos...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0c14] overflow-hidden flex flex-col select-none">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={cn('absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px] transition-colors duration-1000',
          isPositive ? 'bg-[var(--brand-primary)]/7' : 'bg-red-500/6')} />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-blue-600/4 blur-[140px]" />
      </div>
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,107,26,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,26,0.025) 1px,transparent 1px)',
        backgroundSize: '55px 55px',
      }} />

      {/* ══ HEADER ══ */}
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
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shadow-lg shadow-orange-500/20">
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

        <p className="hidden md:block text-white/20 text-[8px] uppercase tracking-[0.35em]">
          {format(new Date(), "eeee, d 'de' MMMM yyyy", { locale: es })}
        </p>

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
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row gap-8 lg:gap-0 overflow-y-auto lg:overflow-hidden px-6 md:px-12 py-6 md:py-8 no-scrollbar">

        {/* ── LEFT: Balance hero ── */}
        <div className="flex-1 flex flex-col justify-center lg:pr-12 gap-4 md:gap-6 min-h-fit">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className="w-8 md:w-10 h-px bg-[var(--brand-primary)]" />
            <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-white/30">
              Patrimonio Actual
            </span>
          </motion.div>

          {/* Giant balance */}
          <div className="overflow-visible">
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
                style={{ fontSize: 'clamp(2.5rem, 12vw, 8.5rem)' }}
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
          className="lg:w-[360px] xl:w-[420px] flex flex-col mt-8 lg:mt-0 pb-10 lg:pb-0"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-4 bg-[#0a0c14] lg:bg-transparent sticky top-0 py-2 lg:relative z-20">
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
          <div className="flex-1 overflow-y-visible lg:overflow-y-auto scrollbar-none">
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
