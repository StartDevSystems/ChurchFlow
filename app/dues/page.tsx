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
      
      let message = settings.whatsappMessageTemplate || "¡Dios te bendiga, {nombre}! \uD83D\uDE4C Te escribo por aquí para recordarte tu cuota de {mes}, todavía tenemos un pendiente de {monto} para completar la meta. ¡Contamos contigo para seguir impulsando el ministerio! \uD83D\uDE80\uD83D\uDD25\u26EA";
      
      // Reemplazar etiquetas
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
      <p className="text-xs font-black uppercase tracking-widest text-[#8c7f72]">Sincronizando cuotas...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-[var(--brand-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8c7f72]">
              Mes de {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#1a1714] dark:text-white uppercase tracking-tighter italic">
            Control de <span className="text-[var(--brand-primary)]">Cuotas</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl border-2 border-[#1a1714] dark:border-white shadow-[4px_4px_0px_0px_#1a1714] dark:shadow-[4px_4px_0px_0px_#fff]">
          <Search className="h-5 w-5 ml-2 text-[#8c7f72]" />
          <input 
            type="text" 
            placeholder="BUSCAR JOVEN..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none font-black text-xs p-2 w-48 uppercase"
          />
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="rounded-[2.5rem] bg-[var(--brand-primary)] text-white border-none shadow-2xl overflow-hidden relative">
          <TrendingUp className="absolute top-[-20px] right-[-20px] h-40 w-40 opacity-10 rotate-12" />
          <CardHeader>
            <CardDescription className="text-white/70 font-bold uppercase text-[10px] tracking-widest">Recaudado este mes</CardDescription>
            <CardTitle className="text-4xl font-black italic tracking-tighter">{fmt(totalCollected)}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="rounded-[2.5rem] border-2 border-[#1a1714] dark:border-white shadow-[8px_8px_0px_0px_#1a1714] dark:shadow-[8px_8px_0px_0px_#fff]">
          <CardHeader>
            <CardDescription className="text-[#8c7f72] font-bold uppercase text-[10px] tracking-widest">Meta Grupal</CardDescription>
            <CardTitle className="text-4xl font-black italic tracking-tighter text-[#1a1714] dark:text-white">{fmt(globalTarget)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar value={totalCollected} max={globalTarget} className="h-3 rounded-full bg-gray-100 dark:bg-gray-800" />
          </CardContent>
        </Card>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((member) => {
          const target = member.monthlyDue || 200;
          const isComplete = member.totalContributed >= target;
          const missing = target - member.totalContributed;

          return (
            <Card key={member.id} className={cn(
              "rounded-[2.5rem] border-2 transition-all duration-300 group hover:-translate-y-2",
              isComplete 
                ? "border-green-500 bg-green-50/30 dark:bg-green-900/10" 
                : "border-[#e8e2d9] dark:border-gray-800 hover:border-[var(--brand-primary)]"
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight group-hover:text-[var(--brand-primary)] transition-colors">
                      {member.name}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">{member.phone}</CardDescription>
                  </div>
                  {isComplete && <div className="bg-green-500 text-white p-1 rounded-full"><Target className="h-4 w-4" /></div>}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-[#8c7f72] uppercase mb-1">Aportado</p>
                    <p className="text-2xl font-black italic">{fmt(member.totalContributed)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#8c7f72] uppercase mb-1 text-right">Meta</p>
                    <p className="text-sm font-black text-[#1a1714] dark:text-white opacity-40">{fmt(target)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                    <span>Progreso</span>
                    <span>{Math.round((member.totalContributed / target) * 100)}%</span>
                  </div>
                  <ProgressBar 
                    value={member.totalContributed} 
                    max={target} 
                    className={cn("h-2 rounded-full", isComplete ? "bg-green-500" : "bg-[var(--brand-primary)]")} 
                  />
                </div>

                {!isComplete ? (
                  <Button 
                    onClick={() => sendWhatsAppReminder(member)}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-2xl py-6 shadow-lg shadow-green-500/20"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    RECORDAR POR WHATSAPP
                  </Button>
                ) : (
                  <div className="py-4 text-center">
                    <span className="text-[10px] font-black uppercase text-green-600 tracking-widest italic">¡Al día con el ministerio! ✓</span>
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
