'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Maximize, TrendingUp, DollarSign, Calendar, Users, Activity, Loader2, Star, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';

// Componente para el conteo animado de números
function CountUp({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalMiliseconds = duration * 1000;
    let incrementTime = (totalMiliseconds / end) * 10;

    let timer = setInterval(() => {
      start += Math.max(1, Math.floor(end / 100));
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{formatCurrency(count)}</span>;
}

export default function PresentationPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [txRes, evRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/events')
      ]);
      const tx = await txRes.json();
      const ev = await evRes.json();

      const totalIncome = tx.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
      const totalExpense = tx.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
      
      setData({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        activeEvents: ev.filter((e: any) => e.status !== 'FINALIZADO').length,
        recentTx: tx.slice(0, 5)
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Pantalla completa automática si es posible
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      // document.documentElement.requestFullscreen().catch(() => {});
    }
  }, [fetchData]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-[var(--brand-primary)]" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0a0c14] z-[200] overflow-hidden flex flex-col font-sans selection:bg-[var(--brand-primary)]">
      {/* Fondo Animado sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--brand-primary)]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 px-10 py-8 flex justify-between items-center border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Reporte <span className="text-[var(--brand-primary)]">En Vivo</span></h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">{format(new Date(), "eeee, d 'de' MMMM yyyy", { locale: es })}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Sincronizado</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 relative z-10 p-10 grid grid-cols-12 gap-8 items-stretch">
        
        {/* Lado Izquierdo: Grandes Números */}
        <div className="col-span-8 flex flex-col gap-8">
          
          {/* Main Balance Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-gradient-to-br from-[#13151f] to-[#0a0c14] rounded-[4rem] border-2 border-white/5 p-16 flex flex-col justify-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <DollarSign size={300} />
            </div>
            
            <p className="text-xs font-black uppercase tracking-[0.6em] text-gray-500 mb-6 flex items-center gap-4">
              <span className="w-12 h-px bg-[var(--brand-primary)]" />
              Patrimonio Actual de la Sociedad
            </p>
            
            <h2 className={cn(
              "text-[10rem] font-black italic tracking-tighter leading-none mb-8",
              data.balance >= 0 ? "text-white" : "text-red-500"
            )}>
              <CountUp value={data.balance} />
            </h2>

            <div className="flex gap-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-green-500/60 mb-2">Ingresos Totales</p>
                <p className="text-4xl font-black italic text-green-500">+{formatCurrency(data.totalIncome)}</p>
              </div>
              <div className="w-px h-16 bg-white/5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60 mb-2">Gastos Realizados</p>
                <p className="text-4xl font-black italic text-red-500">-{formatCurrency(data.totalExpense)}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-8">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="bg-[#13151f]/50 backdrop-blur-md rounded-[3rem] p-10 border border-white/5 flex items-center gap-8"
             >
                <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-inner">
                  <Activity size={40} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Actividades Activas</p>
                  <h4 className="text-5xl font-black italic text-white">{data.activeEvents}</h4>
                </div>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="bg-[#13151f]/50 backdrop-blur-md rounded-[3rem] p-10 border border-white/5 flex items-center gap-8"
             >
                <div className="w-20 h-20 rounded-3xl bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] shadow-inner">
                  <TrendingUp size={40} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Rendimiento Mensual</p>
                  <h4 className="text-5xl font-black italic text-white">+12%</h4>
                </div>
             </motion.div>
          </div>
        </div>

        {/* Lado Derecho: Actividad Reciente Minimalista */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-4 bg-[#13151f] rounded-[4rem] border-2 border-white/5 p-12 flex flex-col shadow-2xl"
        >
          <h3 className="text-xl font-black uppercase italic tracking-widest text-white mb-10 flex items-center gap-4">
            <Clock size={20} className="text-[var(--brand-primary)]" />
            Flujo Reciente
          </h3>

          <div className="flex-1 space-y-8">
            {data.recentTx.map((t: any, i: number) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="flex justify-between items-center group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-gray-600 uppercase mb-1">{format(new Date(t.date), 'dd MMMM', { locale: es })}</p>
                  <p className="text-lg font-black text-white uppercase truncate group-hover:text-[var(--brand-primary)] transition-colors">{t.description}</p>
                </div>
                <div className="text-right ml-4">
                  <p className={cn(
                    "text-xl font-black italic tracking-tighter",
                    t.type === 'income' ? "text-green-500" : "text-red-500"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-auto pt-10 border-t border-white/5 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-700">ChurchFlow v1.3.3 \u2022 Sociedad de Jóvenes</p>
          </div>
        </motion.div>

      </main>

      {/* Footer Branding */}
      <footer className="px-10 py-6 text-center">
        <p className="text-[8px] font-bold uppercase tracking-[1em] text-white/10 italic">Soli Deo Gloria</p>
      </footer>
    </div>
  );
}
