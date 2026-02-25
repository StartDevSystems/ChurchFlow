'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { ArrowDown, ArrowUp, DollarSign, Calendar as CalendarIcon, Trash2, Users, ArrowLeft, Save, TrendingUp, Target, Clock, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/AlertDialog";

interface Event { id: string; name: string; description?: string | null; startDate: string; endDate?: string | null; status: string; }
interface Transaction { id: string; type: 'income' | 'expense'; category: { name: string }; amount: number; date: string; description: string; member?: { id: string; name: string } | null; }
interface MemberContribution { memberId: string; memberName: string; totalContributed: number; txCount: number; }

const fmt = (amount: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState({ income: 0, expense: 0, net: 0 });
  const [memberContributions, setMemberContributions] = useState<MemberContribution[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('ACTIVO');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventRes, transRes] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch(`/api/transactions?eventId=${id}`)
      ]);
      if (!eventRes.ok) throw new Error('Failed to fetch event.');
      const eventData: Event = await eventRes.json();
      setName(eventData.name);
      setDescription(eventData.description || '');
      setStartDate(eventData.startDate.split('T')[0]);
      setEndDate(eventData.endDate ? eventData.endDate.split('T')[0] : '');
      setStatus(eventData.status);

      const transData: Transaction[] = await transRes.json();
      setTransactions(transData);

      const totalIncome = transData.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = transData.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      setBalance({ income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense });

      const contributionMap = new Map<string, MemberContribution>();
      transData.filter(t => t.type === 'income' && t.member).forEach(t => {
        const key = t.member!.id;
        if (!contributionMap.has(key)) contributionMap.set(key, { memberId: key, memberName: t.member!.name, totalContributed: 0, txCount: 0 });
        const entry = contributionMap.get(key)!;
        entry.totalContributed += t.amount;
        entry.txCount += 1;
      });
      setMemberContributions(Array.from(contributionMap.values()).sort((a, b) => b.totalContributed - a.totalContributed));
    } catch (error) {
      router.push('/events');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, status }),
      });
      if (res.ok) toast({ title: "Evento Actualizado ✓" });
    } finally { setSaving(false); }
  };

  const handleFinalize = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FINALIZADO' }),
      });
      if (res.ok) {
        toast({ title: "Evento Finalizado ✓" });
        fetchData();
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    router.push('/events');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0c14]">
      <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
    </div>
  );

  const totalByMembers = memberContributions.reduce((acc, m) => acc + m.totalContributed, 0);

  return (
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 min-h-screen bg-[#0a0c14] text-white pb-20 overflow-x-hidden">
      {/* Header Estilo Pro */}
      <div className="relative w-full pt-10 pb-16 px-6 bg-gradient-to-b from-blue-600/10 to-[#0a0c14] border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <button onClick={() => router.push('/events')} className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-all"><ArrowLeft size={14} /> Volver a eventos</button>
          
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-500">Actividad Ministerial</p>
              </div>
              <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none mb-4 break-words">{name}</h1>
              <p className="text-xl md:text-2xl font-black uppercase text-blue-400 italic tracking-widest">{format(new Date(startDate + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}</p>
            </div>
            <div className="flex gap-3">
              {status !== 'FINALIZADO' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="px-8 py-4 bg-green-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-green-700 transition-all flex items-center gap-2">
                      <CheckCircle2 size={16} /> Finalizar Evento
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[2.5rem] border-2 border-white/10 bg-[#13151f] text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-black text-2xl uppercase italic">¿Cerrar Actividad?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400 font-bold uppercase text-xs">
                        Al finalizar, el evento se moverá al historial y dejará de aparecer en los resúmenes activos. El dinero se mantendrá registrado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px]">No todavía</AlertDialogCancel>
                      <AlertDialogAction onClick={handleFinalize} className="bg-green-600 hover:bg-green-700 rounded-xl font-black uppercase text-[10px]">Sí, Finalizar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild><button className="px-8 py-4 bg-red-500/10 border-2 border-red-500/20 rounded-2xl text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Eliminar Evento</button></AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2.5rem] border-2 border-[#1a1714] bg-[#13151f] text-white">
                  <AlertDialogHeader><AlertDialogTitle className="font-black text-2xl uppercase italic">¿Borrar Evento?</AlertDialogTitle><AlertDialogDescription className="text-gray-400 font-bold uppercase text-xs">Esta acción borrará todos los registros financieros vinculados.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel className="rounded-xl font-black uppercase text-[10px]">No</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 rounded-xl font-black uppercase text-[10px]">Sí, Borrar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 relative z-20">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Ingresos', val: fmt(balance.income), Icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Gastos', val: fmt(balance.expense), Icon: ArrowDown, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Balance Neto', val: fmt(balance.net), Icon: DollarSign, color: balance.net >= 0 ? 'text-blue-400' : 'text-orange-500', bg: 'bg-white/5' }
          ].map((s, i) => (
            <Card key={i} className="rounded-[2.5rem] bg-[#13151f] border-2 border-white/5 p-8 flex flex-col items-center justify-center text-center shadow-2xl transition-all hover:border-white/10">
              <div className={cn("p-4 rounded-3xl mb-4", s.bg)}><s.Icon className={cn("h-8 w-8", s.color)} /></div>
              <p className="text-[9px] font-black uppercase text-gray-500 mb-2 tracking-[0.2em]">{s.label}</p>
              <h4 className="text-3xl font-black italic text-white tracking-tighter">{s.val}</h4>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-10">
            {/* Aportes por Miembro */}
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 mb-8"><Star className="text-yellow-500 h-6 w-6" /> Aportes del Equipo</h3>
              <div className="space-y-3">
                {memberContributions.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-white/5 rounded-[3rem] text-center text-[10px] font-black text-gray-600 uppercase">No hay aportes individuales aún</div>
                ) : memberContributions.map((m) => {
                  const pct = totalByMembers > 0 ? (m.totalContributed / totalByMembers) * 100 : 0;
                  return (
                    <Card key={m.memberId} className="rounded-[2rem] bg-[#13151f]/40 border border-white/5 p-5 group hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-400 text-xs shadow-inner uppercase">{m.memberName.charAt(0)}</div>
                          <p className="font-black uppercase text-sm tracking-tight">{m.memberName}</p>
                        </div>
                        <p className="font-black italic text-lg text-blue-400">{fmt(m.totalContributed)}</p>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" style={{ width: `${pct}%` }} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Editar Evento */}
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 mb-8"><Save className="text-[var(--brand-primary)] h-6 w-6" /> Ajustar Detalles</h3>
              <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#13151f]/40 p-10 rounded-[3rem] border border-white/5">
                <div className="space-y-2 md:col-span-2"><Label className="text-[9px] font-black uppercase text-gray-500 ml-3">Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-2 border-white/5 p-6 rounded-2xl font-black uppercase h-14" /></div>
                <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-gray-500 ml-3">Fecha Inicio</Label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 p-4 rounded-2xl text-white font-black uppercase outline-none focus:border-blue-500 color-scheme-dark" /></div>
                <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-gray-500 ml-3">Fecha Fin (Opcional)</Label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white/5 border-2 border-white/5 p-4 rounded-2xl text-white font-black uppercase outline-none focus:border-blue-500 color-scheme-dark" /></div>
                <div className="space-y-2 md:col-span-2"><Label className="text-[9px] font-black uppercase text-gray-500 ml-3">Descripción</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5 border-2 border-white/5 p-6 rounded-3xl font-black uppercase min-h-[120px]" /></div>
                <button type="submit" disabled={saving} className="md:col-span-2 w-full bg-white text-black p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl">{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
              </form>
            </div>
          </div>

          {/* Historial de Transacciones del Evento */}
          <div className="lg:col-span-5 space-y-8">
            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3"><Clock className="text-purple-500 h-6 w-6" /> Movimientos</h3>
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="p-5 bg-[#13151f] rounded-[1.5rem] border border-white/5 flex justify-between items-center group hover:border-white/20 transition-all shadow-lg">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-[8px] font-black text-gray-500 uppercase">{format(new Date(t.date), 'dd MMM yy', { locale: es })}</p>
                    <p className="text-xs font-black text-white uppercase truncate mt-1">{t.description}</p>
                    <span className="text-[8px] font-black uppercase text-blue-400 mt-1 block">{t.category.name}</span>
                  </div>
                  <p className={cn("font-black italic text-base shrink-0", t.type === 'income' ? "text-green-500" : "text-red-500")}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
                </div>
              ))}
              {transactions.length === 0 && <div className="p-10 border-2 border-dashed border-white/5 rounded-[2rem] text-center text-[10px] font-black text-gray-600 uppercase">Sin movimientos</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
