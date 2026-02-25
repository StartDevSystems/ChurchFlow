"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusCircle, Calendar, Users, TrendingUp, ArrowRight, Loader2, Calculator, X, Clock, CheckCircle2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

export default function EventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  const [calcName, setCalcName] = useState('Calculadora Pro');
  
  // Estado para la calculadora
  const [calc, setCalc] = useState({ people: 50, cost: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, sRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/settings')
      ]);
      
      if (eRes.ok) setEvents(await eRes.json());
      if (sRes.ok) {
        const sData = await sRes.json();
        setCalcName(sData.calculatorName || 'Calculadora Pro');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFinalize = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FINALIZADO' })
      });
      if (res.ok) {
        toast({ title: 'Evento finalizado con éxito ✓' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error al finalizar evento', variant: 'destructive' });
    }
  };

  const activeEvents = events.filter(e => e.status !== 'FINALIZADO');
  const finishedEvents = events.filter(e => e.status === 'FINALIZADO');

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-0">
      <div className="mb-12 flex flex-col md:flex-row justify-between md:items-end gap-8">
        <div>
          <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
            Eventos & <span className="text-[var(--brand-primary)]">Proyectos</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#8c7f72] mt-4">Planificación y seguimiento de actividades</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowCalc(true)}
            className="px-6 py-4 bg-white/5 border-2 border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-xl"
          >
            <Calculator size={16} /> {calcName}
          </button>
          <Link href="/events/new" className="w-full sm:w-auto">
            <button className="w-full px-8 py-4 bg-[var(--brand-primary)] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-2xl shadow-orange-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <PlusCircle size={16} /> Crear Evento
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeEvents.map((event) => (
          <div key={event.id} className="relative group">
            <Link href={`/events/${event.id}`}>
              <Card className="rounded-[3rem] bg-[#13151f] border-2 border-white/5 overflow-hidden group hover:border-[var(--brand-primary)] transition-all shadow-xl h-full flex flex-col">
                <div className="bg-gradient-to-r from-[var(--brand-primary)] to-orange-600 p-6 relative overflow-hidden shrink-0">
                  <Calendar className="absolute top-[-10px] right-[-10px] h-24 w-24 opacity-20 -rotate-12" />
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1">Actividad en Curso</p>
                  <CardTitle className="text-2xl font-black uppercase italic text-white truncate">{event.name}</CardTitle>
                </div>
                
                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-6 text-gray-400">
                    <Clock size={14} className="text-[var(--brand-primary)]" />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      {format(new Date(event.startDate), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-8 flex-1 uppercase tracking-tight italic leading-relaxed">
                    {event.description || 'Sin descripción detallada.'}
                  </p>

                  <div className="pt-6 border-t border-white/5 flex justify-between items-center mt-auto">
                    <div>
                      <p className="text-[8px] font-black uppercase text-gray-600 mb-1">Ver Detalles</p>
                      <ArrowRight size={16} className="text-[var(--brand-primary)] transition-transform group-hover:translate-x-2" />
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase text-gray-600 mb-1">Estado</p>
                      <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest">Abierto</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <button 
              onClick={(e) => { e.preventDefault(); handleFinalize(event.id); }}
              className="absolute top-4 right-4 z-20 p-3 bg-black/40 hover:bg-black/60 text-white rounded-2xl backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all shadow-xl flex items-center gap-2"
              title="Finalizar Evento"
            >
              <CheckCircle2 size={16} className="text-green-400" />
              <span className="text-[8px] font-black uppercase tracking-widest">Finalizar</span>
            </button>
          </div>
        ))}
      </div>

      {finishedEvents.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-white/5" />
            <h2 className="text-xl font-black uppercase italic text-gray-600 tracking-widest flex items-center gap-3">
              <Lock size={18} /> Historial de Finalizados
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            {finishedEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="rounded-[2.5rem] bg-[#0a0c14] border-2 border-white/5 overflow-hidden hover:border-gray-700 transition-all h-full flex flex-col">
                  <div className="bg-gray-800 p-5 relative overflow-hidden shrink-0">
                    <CardTitle className="text-lg font-black uppercase italic text-gray-400 truncate">{event.name}</CardTitle>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <p className="text-[10px] font-black text-gray-600 uppercase mb-4">Finalizado el {format(new Date(event.startDate), 'dd/MM/yyyy')}</p>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                      <span className="text-[8px] font-black uppercase text-gray-500">Consultar Histórico</span>
                      <Lock size={12} className="text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CALCULADORA MODAL RESPONSIVA */}
      <AnimatePresence>
        {showCalc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setShowCalc(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-[#13151f] border-2 border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 w-full max-w-lg shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--brand-primary)]" />
              <button onClick={() => setShowCalc(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-500 hover:text-white transition-colors p-2"><X size={24} /></button>
              
              <div className="text-center mb-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-2xl md:rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-inner">
                  <Calculator className="w-7 h-7 md:w-8 md:h-8" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase italic text-white tracking-tighter">
                  {calcName.split(' ')[0]} <span className="text-[var(--brand-primary)]">{calcName.split(' ').slice(1).join(' ')}</span>
                </h3>
                <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Presupuesto Inteligente</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase ml-3 tracking-widest">Cantidad de Jóvenes</label>
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border-2 border-white/5 p-4 md:p-5 rounded-2xl text-white font-black text-xl md:text-2xl outline-none focus:border-[var(--brand-primary)] transition-all"
                    value={calc.people}
                    onChange={e => setCalc({...calc, people: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase ml-3 tracking-widest">Costo Total (RD$)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border-2 border-white/5 p-4 md:p-5 rounded-2xl text-white font-black text-xl md:text-2xl outline-none focus:border-[var(--brand-primary)] transition-all"
                    placeholder="0.00"
                    onChange={e => setCalc({...calc, cost: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <Card className="rounded-[2rem] md:rounded-[2.5rem] bg-[var(--brand-primary)] text-white p-6 md:p-8 mt-6 shadow-2xl border-none text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                  <p className="relative z-10 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Aporte Sugerido por Joven</p>
                  <h4 className="relative z-10 text-3xl md:text-5xl font-black italic tracking-tighter">
                    {formatCurrency(calc.cost / (calc.people || 1))}
                  </h4>
                  <p className="relative z-10 text-[8px] md:text-[9px] font-bold mt-3 uppercase tracking-widest opacity-60">Meta: {formatCurrency(calc.cost)}</p>
                </Card>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
