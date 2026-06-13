"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  MessageCircle, Search, Target, TrendingUp, Calendar, Loader2,
  ChevronLeft, ChevronRight, Settings, Check, Users, DollarSign, CheckCheck,
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ──────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────

type DuesType = 'local' | 'sede';

interface MemberDues {
  id: string;
  name: string;
  phone: string;
  due: number;            // meta (mensual para local, anual para sede)
  totalContributed: number;
  missing: number;
  isComplete: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// DATOS DE EJEMPLO (mock) — solo para ver el diseño.
// Cuando conectemos la API, esto se reemplaza por fetch a /api/dues?type=local|sede&...
// ──────────────────────────────────────────────────────────────────────────

export default function DuesPage() {
  const [activeTab, setActiveTab] = useState<DuesType>('local');

  const [localMembers, setLocalMembers] = useState<MemberDues[]>([]);
  const [sedeMembers, setSedeMembers] = useState<MemberDues[]>([]);

  const [defaultLocalDue, setDefaultLocalDue] = useState(0);
  const [defaultSedeDue, setDefaultSedeDue] = useState(0);

  const [loading, setLoading] = useState(true); // poner en true cuando se conecte la API
  const [search, setSearch] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showConfig, setShowConfig] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'complete'>('all');

  // estado del modal "registrar abono"
  const [payingMember, setPayingMember] = useState<MemberDues | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // estado del input de meta default en el modal de config
  const [newDueAmount, setNewDueAmount] = useState('');

  // ── Fetch desde API real ─────────────────────────────────────────────────
  const fetchDues = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/dues?type=${activeTab}`;
      if (activeTab === 'local') {
        url += `&month=${format(currentMonth, 'yyyy-MM')}`;
      } else {
        url += `&year=${currentYear}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (activeTab === 'local') {
        setLocalMembers(data.members);
        setDefaultLocalDue(data.defaultDue);
      } else {
        setSedeMembers(data.members);
        setDefaultSedeDue(data.defaultDue);
      }
    } catch (error) {
      console.error('Error cargando cuotas:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentMonth, currentYear]);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  const members = activeTab === 'local' ? localMembers : sedeMembers;
  const setMembers = activeTab === 'local' ? setLocalMembers : setSedeMembers;
  const defaultDue = activeTab === 'local' ? defaultLocalDue : defaultSedeDue;

  useEffect(() => {
    setNewDueAmount(String(defaultDue));
  }, [defaultDue, activeTab]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const fmt = (amount: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

  const sendWhatsAppReminder = async (member: MemberDues) => {
    try {
      const settingsRes = await fetch('/api/settings');
      const settings = await settingsRes.json();

      const periodLabel = activeTab === 'local'
        ? format(currentMonth, 'MMMM', { locale: es })
        : String(currentYear);

      let message = settings.whatsappMessageTemplate
        || "Hola {nombre}! Te escribo para recordarte tu cuota de {mes}, falta {monto} para completar. Dios te bendiga!";
      message = message
        .replace('{nombre}', member.name)
        .replace('{monto}', fmt(member.missing))
        .replace('{mes}', periodLabel);

      const url = `https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error);
    }
  };

  // Actualiza la meta individual de un miembro (local o sede)
  const handleMemberDueChange = (memberId: string, value: string) => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) return;
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const missing = Math.max(amount - m.totalContributed, 0);
      return { ...m, due: amount, missing, isComplete: missing === 0 };
    }));
    fetch('/api/dues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, amount, type: activeTab }),
    }).catch(console.error);
  };

  // Abre el mini-modal de "registrar abono"
  const openPayModal = (member: MemberDues) => {
    setPayingMember(member);
    setPayAmount(String(member.missing > 0 ? member.missing : ''));
  };

  // Guarda el abono (mock: solo actualiza estado local)
  const handleSavePayment = async () => {
    if (!payingMember) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    setMembers(prev => prev.map(m => {
      if (m.id !== payingMember.id) return m;
      const totalContributed = m.totalContributed + amount;
      const missing = Math.max(m.due - totalContributed, 0);
      return { ...m, totalContributed, missing, isComplete: missing === 0 };
    }));

    await fetch('/api/dues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'payment',
        type: activeTab,
        memberId: payingMember.id,
        amount,
        date: new Date().toISOString(),
      }),
    }).catch(console.error);

    setPayingMember(null);
    setPayAmount('');
  };

  // Aplica la meta general a todos los miembros de la pestaña activa
  const handleBulkAssign = async () => {
    const amount = parseFloat(newDueAmount);
    if (isNaN(amount) || amount < 0) return;

    if (activeTab === 'local') setDefaultLocalDue(amount);
    else setDefaultSedeDue(amount);

    setMembers(prev => prev.map(m => {
      const missing = Math.max(amount - m.totalContributed, 0);
      return { ...m, due: amount, missing, isComplete: missing === 0 };
    }));

    await fetch('/api/dues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign', type: activeTab, amount }),
    }).catch(console.error);

    setShowConfig(false);
  };

  // Marca a todos los pendientes como completados (rellena lo que falta)
  const handleMarkAllPaid = async () => {
    const pending = members.filter(m => !m.isComplete && m.missing > 0);

    setMembers(prev => prev.map(m => ({
      ...m,
      totalContributed: m.due,
      missing: 0,
      isComplete: true,
    })));

    await fetch('/api/dues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'markAllPaid',
        type: activeTab,
        members: pending.map(m => ({ id: m.id, missing: m.missing })),
        date: new Date().toISOString(),
      }),
    }).catch(console.error);

    setShowConfig(false);
  };

  // ── derivados ────────────────────────────────────────────────────────────

  const filtered = members
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m => filter === 'all' ? true : filter === 'complete' ? m.isComplete : !m.isComplete);

  const totalCollected = members.reduce((s, m) => s + m.totalContributed, 0);
  const globalTarget = members.reduce((s, m) => s + m.due, 0);
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
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-8 pt-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-[var(--brand-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Control de aportes</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
            Control de <span className="text-[var(--brand-primary)]">Cuotas</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowConfig(true)}
            className="p-3 bg-[#13151f] rounded-2xl border-2 border-white/5 text-gray-500 hover:text-white hover:border-[var(--brand-primary)]/30 transition-all">
            <Settings size={18} />
          </button>
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

      {/* ── TABS: Iglesia Local / Sede Principal ── */}
      <div className="flex gap-2 mb-8">
        {([
          { key: 'local' as DuesType, label: 'Iglesia Local' },
          { key: 'sede' as DuesType, label: 'Sede Principal' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex-1 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all',
              activeTab === t.key
                ? 'bg-[var(--brand-primary)]/15 border-[var(--brand-primary)] text-[var(--brand-primary)]'
                : 'border-white/5 bg-[#13151f] text-gray-500 hover:text-white hover:bg-white/5'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Selector de periodo: mes (local) o año (sede) */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {activeTab === 'local' ? (
          <>
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
          </>
        ) : (
          <>
            <button onClick={() => setCurrentYear(y => y - 1)}
              className="p-3 rounded-2xl bg-[#13151f] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <ChevronLeft size={18} />
            </button>
            <div className="px-8 py-3 bg-[#13151f] rounded-2xl border-2 border-white/5 min-w-[220px] text-center">
              <p className="text-xl font-black uppercase italic text-white tracking-tight">
                Año {currentYear}
              </p>
            </div>
            <button onClick={() => setCurrentYear(y => y + 1)}
              className="p-3 rounded-2xl bg-[#13151f] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="rounded-[3rem] bg-[var(--brand-primary)] text-white border-none shadow-2xl overflow-hidden relative p-8">
          <TrendingUp className="absolute top-[-20px] right-[-20px] h-48 w-48 opacity-10 rotate-12" />
          <p className="text-white/70 font-black uppercase text-[10px] tracking-[0.2em] mb-2">
            Recaudado {activeTab === 'sede' && '(anual)'}
          </p>
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
          const pct = member.due > 0 ? Math.round((member.totalContributed / member.due) * 100) : 0;

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
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">
                      Meta {activeTab === 'sede' ? 'anual' : 'mensual'}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-xs font-black">$</span>
                      <input
                        type="number"
                        value={member.due}
                        onChange={e => handleMemberDueChange(member.id, e.target.value)}
                        className="w-20 bg-transparent text-right text-sm font-black text-gray-300 italic border-b border-dashed border-white/10 focus:border-[var(--brand-primary)] focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    <span>{member.isComplete ? 'Completado' : `Falta ${fmt(member.missing)}`}</span>
                    <span className={cn(member.isComplete ? "text-green-500" : "text-[var(--brand-primary)]")}>{pct}%</span>
                  </div>
                  <ProgressBar
                    value={member.totalContributed}
                    max={member.due || 1}
                    className={cn("h-2.5 rounded-full", member.isComplete ? "bg-green-500" : "bg-[var(--brand-primary)]")}
                  />
                </div>

                {!member.isComplete ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => openPayModal(member)}
                      className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-black rounded-2xl py-5 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
                    >
                      <DollarSign size={18} />
                      Pagado
                    </button>
                    <button
                      onClick={() => sendWhatsAppReminder(member)}
                      className="flex-1 bg-[#25D366] hover:bg-[#1ebd5e] text-white font-black rounded-2xl py-5 shadow-2xl shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
                    >
                      <MessageCircle size={18} />
                      Recordar
                    </button>
                  </div>
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

      {/* ── MODAL: REGISTRAR ABONO ── */}
      <AnimatePresence>
        {payingMember && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setPayingMember(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#13151f] border-2 border-[var(--brand-primary)] rounded-3xl w-full max-w-sm">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Registrar abono</h3>
                <p className="text-[9px] text-gray-500 font-bold mt-1">
                  {payingMember.name} · {activeTab === 'local' ? 'Cuota Local' : 'Cuota Sede'}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[7px] font-black uppercase tracking-widest text-white/30 block mb-2">Monto (RD$)</label>
                  <input
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    type="number" autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-white focus:border-[var(--brand-primary)]/50 focus:outline-none transition-all"
                  />
                </div>
                {payingMember.missing > 0 && (
                  <button
                    onClick={() => setPayAmount(String(payingMember.missing))}
                    className="w-full text-left px-4 py-3 rounded-xl border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[var(--brand-primary)]/20"
                  >
                    Completar ({fmt(payingMember.missing)})
                  </button>
                )}
              </div>
              <div className="p-6 border-t border-white/5 flex gap-2">
                <button onClick={() => setPayingMember(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button onClick={handleSavePayment}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/80 text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-lg">
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: CONFIGURACIÓN ── */}
      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowConfig(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#13151f] border border-white/10 rounded-3xl w-full max-w-sm">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">
                  Configurar {activeTab === 'local' ? 'cuota local' : 'cuota sede'}
                </h3>
                <p className="text-[9px] text-gray-500 font-bold mt-1">
                  {activeTab === 'local'
                    ? `${format(currentMonth, 'MMMM yyyy', { locale: es })}`
                    : `Año ${currentYear}`}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[7px] font-black uppercase tracking-widest text-white/30 block mb-2">
                    Meta {activeTab === 'sede' ? 'anual' : 'mensual'} (RD$)
                  </label>
                  <input value={newDueAmount} onChange={e => setNewDueAmount(e.target.value)}
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-white focus:border-[var(--brand-primary)]/50 focus:outline-none transition-all" />
                </div>
                <p className="text-[9px] text-gray-500">
                  Actual: <span className="text-white font-bold">{fmt(defaultDue)}</span> por miembro
                  {' · '}{members.length} miembros = <span className="text-white font-bold">{fmt(defaultDue * members.length)}</span> meta total
                </p>

                <button onClick={handleBulkAssign}
                  className="w-full text-left px-4 py-3 rounded-xl border border-white/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Aplicar meta a todos
                </button>

                <button onClick={handleMarkAllPaid}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all">
                  <CheckCheck size={16} />
                  Marcar todos como pagados {activeTab === 'local' ? '(este mes)' : '(este año)'}
                </button>
              </div>
              <div className="p-6 border-t border-white/5">
                <button onClick={() => setShowConfig(false)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}