'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { 
  format, addMonths, subMonths, startOfMonth as startOfMonthFn, 
  endOfMonth as endOfMonthFn, startOfWeek, endOfWeek, 
  addDays, isSameMonth, isSameDay, isToday 
} from 'date-fns';
import { CalendarIcon, ArrowLeft, PlusCircle, Save, Loader2, Target, ChevronLeft, ChevronRight, Calendar as CalendarLucide } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════
   CUSTOM COQUETO CALENDAR (HUD STYLE)
══════════════════════════════════════════════════════════ */
function CustomCalendar({ selected, onSelect }: { selected?: Date, onSelect: (d: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonthFn(currentMonth), { weekStartsOn: 1 });
    const end   = endOfWeek(endOfMonthFn(currentMonth), { weekStartsOn: 1 });
    const res = [];
    let day = start;
    while (day <= end) {
      res.push(day);
      day = addDays(day, 1);
    }
    return res;
  }, [currentMonth]);

  return (
    <div className="w-[280px] bg-[#0a0c14] p-4 select-none">
      {/* Header Selector */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </p>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 mb-2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
          <span key={d} className="text-center text-[8px] font-black text-white/20">{d}</span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const isSel = selected && isSameDay(day, selected);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTday = isToday(day);

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all relative group",
                !isCurrentMonth && "opacity-10",
                isSel ? "bg-[var(--brand-primary)] text-white shadow-lg shadow-orange-500/20 scale-110 z-10" : 
                isTday ? "text-[var(--brand-primary)] border border-[var(--brand-primary)]/30" : "text-white/60 hover:bg-white/5"
              )}
            >
              {format(day, 'd')}
              {isTday && !isSel && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--brand-primary)]" />}
            </button>
          );
        })}
      </div>

      {/* Selected Day Footer */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 pt-3 border-t border-white/5 text-center">
          <p className="text-[8px] font-black uppercase text-[var(--brand-primary)] tracking-widest leading-none mb-1">
            {format(selected, 'eeee', { locale: es })}
          </p>
          <p className="text-[14px] font-black italic text-white leading-none">
            {format(selected, 'dd / MM / yyyy')}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (!name || !startDate) {
      toast({
        title: "Error al crear evento",
        description: "El nombre y la fecha de inicio son obligatorios.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          startDate: startDate.toISOString(),
          endDate: endDate ? endDate.toISOString() : null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create event');
      }

      toast({
        title: "Evento Creado ✓",
        description: `El proyecto '${name}' ya está en el sistema.`,
      });
      router.push('/events');
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error al crear evento",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 md:px-0">
      {/* ══ HEADER ══ */}
      <div className="mb-12 flex items-center gap-6">
        <button 
          onClick={() => router.back()} 
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <PlusCircle className="text-[var(--brand-primary)] h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">
              Nuevo <span className="text-[var(--brand-primary)]">Proyecto</span>
            </h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#8c7f72] ml-1">Inicia la planificación de tu próxima actividad</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* FORM SIDE */}
        <div className="lg:col-span-8">
          <Card className="rounded-[3rem] bg-[#13151f] border-2 border-white/5 overflow-hidden shadow-2xl">
            <div className="h-1.5 w-full bg-[var(--brand-primary)] opacity-50" />
            <CardContent className="p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Nombre */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-[0.2em]">Nombre del Proyecto</Label>
                  <div className="relative">
                    <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="EJ: CAMPAMENTO DE JÓVENES 2026"
                      className="bg-white/5 border-2 border-white/5 p-7 pl-14 rounded-2xl font-black uppercase text-lg text-white focus:border-[var(--brand-primary)] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-[0.2em]">Descripción & Notas</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="DETALLES SOBRE EL OBJETIVO, LUGAR O LOGÍSTICA..."
                    className="bg-white/5 border-2 border-white/5 p-6 rounded-2xl font-bold uppercase text-xs text-white focus:border-[var(--brand-primary)] transition-all italic leading-relaxed min-h-[120px]"
                  />
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-[0.2em]">Fecha de Inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "w-full flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all font-black uppercase text-xs tracking-widest",
                            startDate ? "bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30 text-white" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <CalendarLucide size={18} className={startDate ? "text-[var(--brand-primary)]" : "text-gray-600"} />
                            {startDate ? format(startDate, "dd 'de' MMMM", { locale: es }) : "Elegir Día"}
                          </div>
                          {startDate && <div className="text-[10px] opacity-40 font-bold">{format(startDate, "yyyy")}</div>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#0a0c14] border-2 border-white/10 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]" align="start">
                        <CustomCalendar 
                          selected={startDate} 
                          onSelect={(d) => setStartDate(d)} 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-[0.2em]">Fecha de Cierre (Opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "w-full flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all font-black uppercase text-xs tracking-widest",
                            endDate ? "bg-blue-500/10 border-blue-500/30 text-white" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <CalendarLucide size={18} className={endDate ? "text-blue-400" : "text-gray-600"} />
                            {endDate ? format(endDate, "dd 'de' MMMM", { locale: es }) : "Elegir Día"}
                          </div>
                          {endDate && <div className="text-[10px] opacity-40 font-bold">{format(endDate, "yyyy")}</div>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#0a0c14] border-2 border-white/10 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]" align="start">
                        <CustomCalendar 
                          selected={endDate} 
                          onSelect={(d) => setEndDate(d)} 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-6 rounded-2xl bg-[var(--brand-primary)] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    style={{ color: 'var(--brand-text-on-primary)', boxShadow: '0 20px 40px var(--brand-primary)' }}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Confirmar & Lanzar Proyecto
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* INFO SIDE */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[2.5rem] bg-[#1a1d2e]/40 border-2 border-white/5 p-8 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black uppercase italic text-white mb-4">¿Qué es un Proyecto?</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed uppercase font-bold tracking-tight">
                Al crear un proyecto, habilitas una &quot;Carpeta Financiera&quot; dedicada. Todo el dinero que se mueva dentro de esta carpeta no afectará el balance de tu caja general hasta que tú decidas traspasarlo.
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-black text-[10px]">1</div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-wide">Registro de aportes exclusivos.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-black text-[10px]">2</div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-wide">Control de gastos operativos.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-black text-[10px]">3</div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-wide">Estadísticas de rentabilidad.</p>
                </div>
              </div>
            </div>
          </Card>

          {startDate && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="rounded-[2.5rem] bg-gradient-to-br from-[var(--brand-primary)] to-orange-600 border-none p-8 text-white shadow-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Fecha Programada</p>
                <h4 className="text-3xl font-black uppercase italic leading-none">{format(startDate, 'dd MMMM', { locale: es })}</h4>
                <p className="text-[10px] font-bold uppercase mt-4 bg-white/20 w-fit px-3 py-1 rounded-full">
                  Próximamente
                </p>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
