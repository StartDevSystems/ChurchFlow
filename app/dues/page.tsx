"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { MessageCircle, Search, Target, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MemberDues {
  id: string;
  name: string;
  phone: string;
  monthlyDue: number;
  totalContributed: number;
}

export default function DuesPage() {
  const [membersDues, setMembersDues] = useState<MemberDues[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentMonth] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dues');
      if (response.ok) {
        setMembersDues(await response.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (amount: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

  const sendWhatsAppReminder = async (member: MemberDues) => {
    try {
      const settingsRes = await fetch('/api/settings');
      const settings = await settingsRes.json();
      
      const missing = (member.monthlyDue || 200) - member.totalContributed;
      const monthName = format(currentMonth, 'MMMM', { locale: es });
      
      let message = settings.whatsappMessageTemplate || "¡Dios te bendiga, {nombre}! \uD83D\uDE4C Te escribo por aquí para saludarte y recordarte tu cuota de {mes}, todavía tenemos un pendiente de {monto} para completar la meta. ¡Contamos contigo para seguir impulsando el ministerio! \uD83D\uDE80\uD83D\uDD25\u26EA";
      
      message = message
        .replace('{nombre}', member.name)
        .replace('{monto}', fmt(missing))
        .replace('{mes}', monthName);

      const url = `https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error);
    }
  };

  const filtered = membersDues.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const totalCollected = membersDues.reduce((s, m) => s + m.totalContributed, 0);
  const globalTarget = membersDues.reduce((s, m) => s + (m.monthlyDue || 200), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
      <p className="text-xs font-black uppercase tracking-widest text-gray-500">Sincronizando cuotas...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 pt-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-[var(--brand-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
              Ciclo: {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
            Control de <span className="text-[var(--brand-primary)]">Cuotas</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-[#13151f] p-4 rounded-2xl border-2 border-white/5 shadow-2xl">
          <Search className="h-5 w-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="BUSCAR JOVEN..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none font-black text-xs text-white uppercase w-full sm:w-48 placeholder:text-gray-700"
          />
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <Card className="rounded-[3rem] bg-[var(--brand-primary)] text-white border-none shadow-2xl overflow-hidden relative p-8">
          <TrendingUp className="absolute top-[-20px] right-[-20px] h-48 w-48 opacity-10 rotate-12" />
          <p className="text-white/70 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Recaudación Mensual</p>
          <h3 className="text-5xl md:text-6xl font-black italic tracking-tighter">{fmt(totalCollected)}</h3>
        </Card>
        
        <Card className="rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Meta Grupal</p>
              <h3 className="text-5xl md:text-6xl font-black italic tracking-tighter text-white">{fmt(globalTarget)}</h3>
            </div>
            <div className="p-4 bg-white/5 rounded-3xl text-[var(--brand-primary)] shadow-inner">
              <Target size={32} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
              <span>Progreso General</span>
              <span>{Math.round((totalCollected / (globalTarget || 1)) * 100)}%</span>
            </div>
            <ProgressBar value={totalCollected} max={globalTarget} className="h-4 rounded-full bg-white/5" />
          </div>
        </Card>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((member) => {
          const target = member.monthlyDue || 200;
          const isComplete = member.totalContributed >= target;
          const pct = Math.round((member.totalContributed / target) * 100);

          return (
            <Card key={member.id} className={cn(
              "rounded-[3rem] bg-[#13151f] border-2 transition-all duration-500 group overflow-hidden shadow-xl",
              isComplete 
                ? "border-green-500/30" 
                : "border-white/5 hover:border-[var(--brand-primary)]"
            )}>
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-white truncate leading-none mb-2 group-hover:text-[var(--brand-primary)] transition-colors">
                      {member.name}
                    </CardTitle>
                    <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">{member.phone}</p>
                  </div>
                  {isComplete && (
                    <div className="bg-green-500 text-white p-2 rounded-2xl shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="flex justify-between items-end bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Aportado</p>
                    <p className="text-2xl font-black italic text-white leading-none">{fmt(member.totalContributed)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Meta</p>
                    <p className="text-sm font-black text-gray-400 italic">{fmt(target)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    <span>Impacto Individual</span>
                    <span className={cn(isComplete ? "text-green-500" : "text-[var(--brand-primary)]")}>{pct}%</span>
                  </div>
                  <ProgressBar 
                    value={member.totalContributed} 
                    max={target} 
                    className={cn("h-2.5 rounded-full", isComplete ? "bg-green-500" : "bg-[var(--brand-primary)]")} 
                  />
                </div>

                {!isComplete ? (
                  <button 
                    onClick={() => sendWhatsAppReminder(member)}
                    className="w-full bg-[#25D366] hover:bg-[#1ebd5e] text-white font-black rounded-2xl py-5 shadow-2xl shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                  >
                    <MessageCircle size={20} />
                    Recordar
                  </button>
                ) : (
                  <div className="py-4 text-center border-2 border-dashed border-green-500/20 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-green-500 tracking-[0.2em] italic">Compromiso cumplido ✓</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Icono faltante
function CheckCircle2({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
