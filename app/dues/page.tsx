"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MessageCircle, Search, Target, TrendingUp, Calendar, Loader2, ChevronLeft, ChevronRight, Settings, Check, Users } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MemberDues {
  id: string;
  name: string;
  phone: string;
  monthlyDue: number;
  totalContributed: number;
  missing: number;
  isComplete: boolean;
}

export default function DuesPage() {
  const [members, setMembers] = useState<MemberDues[]>([]);
  const [defaultDue, setDefaultDue] = useState(200);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showConfig, setShowConfig] = useState(false);
  const [newDueAmount, setNewDueAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'complete'>('all');

  const monthKey = format(currentMonth, 'yyyy-MM');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dues?month=${monthKey}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
        setDefaultDue(data.defaultDue);
        setNewDueAmount(String(data.defaultDue));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (amount: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

  const sendWhatsAppReminder = async (member: MemberDues) => {
    try {
      const settingsRes = await fetch('/api/settings');
      const settings = await settingsRes.json();

      const monthName = format(currentMonth, 'MMMM', { locale: es });

      let message = settings.whatsappMessageTemplate || "Hola {nombre}! Te escribo para recordarte tu cuota de {mes}, falta {monto} para completar. Dios te bendiga!";
      message = message
        .replace('{nombre}', member.name)
        .replace('{monto}', fmt(member.missing))
        .replace('{mes}', monthName);

      const url = `https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error);
    }
  };

  const handleBulkAssign = async () => {
    const amount = parseFloat(newDueAmount);
    if (isNaN(amount) || amount < 0) return;
    setSaving(true);
    await fetch('/api/dues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    setSaving(false);
    setShowConfig(false);
    fetchData();
  };

  const filtered = members
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m => filter === 'all' ? true : filter === 'complete' ? m.isComplete : !m.isComplete);

  const totalCollected = members.reduce((s, m) => s + m.totalContributed, 0);
  const globalTarget = members.reduce((s, m) => s + m.monthlyDue, 0);
  const completedCount = members.filter(m => m.isComplete).length;
  const pendingCount = members.filter(m => !m.isComplete).length;

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
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Control Mensual</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
            Control de <span className="text-[var(--brand-primary)]">Cuotas</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Config button */}
          <button onClick={() => setShowConfig(true)}
            className="p-3 bg-[#13151f] rounded-2xl border-2 border-white/5 text-gray-500 hover:text-white hover:border-[var(--brand-primary)]/30 transition-all">
            <Settings size={18} />
          </button>
          {/* Search */}
          <div className="flex items-center gap-3 bg-[#13151f] p-4 rounded-2xl border-2 border-white/5 shadow-2xl">
            <Search className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="BUSCAR..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none font-black text-xs text-white uppercase w-full sm:w-48 placeholder:text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <button onClick={() => setCurrentMonth(d => subMonths(d, 1))}
          className="p-3 rounded-2xl bg-[#13151f] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
          <ChevronLeft size={18} />
        </button>
        <div className="px-8 py-3 bg-[#13151f] rounded-2xl border-2 border-white/5 min-w-[220px] text-center">
          <p className="text-xl font-black uppercase italic text-white tracking-tight">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </p>
        </div>
        <button onClick={() => setCurrentMonth(d => addMonths(d, 1))}
          className="p-3 rounded-2xl bg-[#13151f] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="rounded-[3rem] bg-[var(--brand-primary)] text-white border-none shadow-2xl overflow-hidden relative p-8">
          <TrendingUp className="absolute top-[-20px] right-[-20px] h-48 w-48 opacity-10 rotate-12" />
          <p className="text-white/70 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Recaudado</p>
          <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter">{fmt(totalCollected)}</h3>
          <p className="text-white/50 text-[10px] font-bold mt-2">de {fmt(globalTarget)} meta</p>
        </Card>

        <Card className="rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Progreso</p>
              <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white">
                {globalTarget > 0 ? Math.round((totalCollected / globalTarget) * 100) : 0}%
              </h3>
            </div>
            <div className="p-4 bg-white/5 rounded-3xl text-[var(--brand-primary)]">
              <Target size={28} />
            </div>
          </div>
          <ProgressBar value={totalCollected} max={globalTarget || 1} className="h-3 rounded-full bg-white/5" />
        </Card>

        <Card className="rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-2xl">
          <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4">Miembros</p>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-3xl font-black italic text-green-400">{completedCount}</p>
              <p className="text-[9px] font-bold uppercase text-green-400/50 tracking-widest">Al dia</p>
            </div>
            <div>
              <p className="text-3xl font-black italic text-orange-400">{pendingCount}</p>
              <p className="text-[9px] font-bold uppercase text-orange-400/50 tracking-widest">Pendientes</p>
            </div>
            <div>
              <p className="text-3xl font-black italic text-white/30">{members.length}</p>
              <p className="text-[9px] font-bold uppercase text-white/20 tracking-widest">Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8">
        {([
          { key: 'all', label: `Todos (${members.length})` },
          { key: 'pending', label: `Pendientes (${pendingCount})` },
          { key: 'complete', label: `Al dia (${completedCount})` },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all',
              filter === f.key
                ? 'bg-[var(--brand-primary)]/15 border-[var(--brand-primary)]/40 text-[var(--brand-primary)]'
                : 'border-white/5 text-gray-500 hover:text-white hover:bg-white/5'
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((member) => {
          const pct = member.monthlyDue > 0 ? Math.round((member.totalContributed / member.monthlyDue) * 100) : 0;

          return (
            <Card key={member.id} className={cn(
              "rounded-[3rem] bg-[#13151f] border-2 transition-all duration-500 group overflow-hidden shadow-xl",
              member.isComplete
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
                  {member.isComplete && (
                    <div className="bg-green-500 text-white p-2 rounded-2xl shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                      <Check size={20} strokeWidth={3} />
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
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Cuota</p>
                    <p className="text-sm font-black text-gray-400 italic">{fmt(member.monthlyDue)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    <span>{member.isComplete ? 'Completado' : `Falta ${fmt(member.missing)}`}</span>
                    <span className={cn(member.isComplete ? "text-green-500" : "text-[var(--brand-primary)]")}>{pct}%</span>
                  </div>
                  <ProgressBar
                    value={member.totalContributed}
                    max={member.monthlyDue || 1}
                    className={cn("h-2.5 rounded-full", member.isComplete ? "bg-green-500" : "bg-[var(--brand-primary)]")}
                  />
                </div>

                {!member.isComplete ? (
                  <button
                    onClick={() => sendWhatsAppReminder(member)}
                    className="w-full bg-[#25D366] hover:bg-[#1ebd5e] text-white font-black rounded-2xl py-5 shadow-2xl shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                  >
                    <MessageCircle size={20} />
                    Recordar ({fmt(member.missing)})
                  </button>
                ) : (
                  <div className="py-4 text-center border-2 border-dashed border-green-500/20 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-green-500 tracking-[0.2em] italic">Compromiso cumplido</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto text-white/10 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Sin miembros en este filtro</p>
        </div>
      )}

      {/* ── CONFIG MODAL ── */}
      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowConfig(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#13151f] border border-white/10 rounded-3xl w-full max-w-sm">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Configurar Cuota</h3>
                <p className="text-[9px] text-gray-500 font-bold mt-1">Se aplica a todos los miembros sin cuota personalizada</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[7px] font-black uppercase tracking-widest text-white/30 block mb-2">Cuota Mensual (RD$)</label>
                  <input value={newDueAmount} onChange={e => setNewDueAmount(e.target.value)}
                    type="number" placeholder="200"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-white focus:border-[var(--brand-primary)]/50 focus:outline-none transition-all" />
                </div>
                <p className="text-[9px] text-gray-500">
                  Actual: <span className="text-white font-bold">{fmt(defaultDue)}</span> por miembro
                  {' · '}{members.length} miembros = <span className="text-white font-bold">{fmt(defaultDue * members.length)}</span> meta total
                </p>
              </div>
              <div className="p-6 border-t border-white/5 flex gap-2">
                <button onClick={() => setShowConfig(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button onClick={handleBulkAssign} disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/80 text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-lg">
                  {saving ? 'Guardando...' : 'Aplicar a Todos'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
