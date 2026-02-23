'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, Edit, Trash2, Calendar, Receipt, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/AlertDialog';
import { useToast } from '@/components/ui/use-toast';

interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  eventId?: string;
}

interface EventWithStats extends Event {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  txCount: number;
}

const BANNERS = [
  { from: '#e85d26', to: '#f5a623', emoji: '🎪' },
  { from: '#1a8a5e', to: '#42c988', emoji: '🌿' },
  { from: '#1a4d8f', to: '#4a90d9', emoji: '🎤' },
  { from: '#6b3fa0', to: '#a56bd4', emoji: '🙏' },
  { from: '#0e7490', to: '#22d3ee', emoji: '⚡' },
  { from: '#b91c1c', to: '#f87171', emoji: '🔥' },
];

type FilterType = 'todos' | 'activos' | 'finalizados';

function getStatus(event: Event): { label: string; filter: FilterType } {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  if (end && end < now) return { label: 'Finalizado', filter: 'finalizados' };
  if (start > now) return { label: 'Próximo', filter: 'activos' };
  return { label: 'Activo', filter: 'activos' };
}

function fmt(amount: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [evRes, txRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/transactions'),
      ]);
      if (!evRes.ok) throw new Error('Error al cargar eventos');
      const evData: Event[] = await evRes.json();
      const txData: Transaction[] = txRes.ok ? await txRes.json() : [];

      const enriched: EventWithStats[] = evData.map((ev) => {
        const related = txData.filter((t) => t.eventId === ev.id);
        const totalIncome = related.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = related.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return { ...ev, totalIncome, totalExpense, balance: totalIncome - totalExpense, txCount: related.length };
      });

      setEvents(enriched);
    } catch (err: any) {
      toast({ title: 'Error al cargar eventos', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'No se pudo eliminar');
      }
      toast({ title: 'Evento eliminado', description: 'El evento fue eliminado con éxito.' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' });
    }
  };

  const totalBalance = events.reduce((s, e) => s + e.balance, 0);
  const activos = events.filter((e) => getStatus(e).filter === 'activos').length;
  const finalizados = events.filter((e) => getStatus(e).filter === 'finalizados').length;

  const proximos = events
    .filter((e) => new Date(e.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const proximoEvento = proximos[0];

  const filtered = events.filter((ev) => {
    const matchFilter = filter === 'todos' || getStatus(ev).filter === filter;
    const matchSearch = ev.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#f7f4ef] dark:bg-gray-950 p-6 md:p-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium tracking-widest text-[#8c7f72] dark:text-gray-500 uppercase mb-1">Módulo</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1714] dark:text-white" style={{ letterSpacing: '-0.04em' }}>
            Eventos 🎪
          </h1>
        </div>
        <Link href="/events/new">
          <Button className="flex items-center gap-2 bg-[#e85d26] hover:bg-[#cf4e1f] text-white shadow-lg shadow-orange-200 dark:shadow-none border-0 rounded-xl px-5 py-2.5 font-semibold">
            <PlusCircle className="h-4 w-4" />
            Nuevo Evento
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#e85d26]" />
          <p className="text-[10px] font-semibold tracking-widest text-[#8c7f72] uppercase mb-2">Total Eventos</p>
          <p className="text-4xl font-black text-[#e85d26]" style={{ letterSpacing: '-0.04em' }}>{loading ? '—' : events.length}</p>
          <p className="text-xs text-[#8c7f72] mt-1">{activos} activos · {finalizados} finalizados</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#2d8a5e]" />
          <p className="text-[10px] font-semibold tracking-widest text-[#8c7f72] uppercase mb-2">Balance General</p>
          {/* FIX: text-3xl en vez de text-4xl para que no se desborde con números grandes */}
          <p className={`text-3xl font-black break-all ${totalBalance >= 0 ? 'text-[#2d8a5e]' : 'text-red-500'}`} style={{ letterSpacing: '-0.03em' }}>
            {loading ? '—' : fmt(totalBalance)}
          </p>
          <p className="text-xs text-[#8c7f72] mt-1">Suma de todos los eventos</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#1a4d8f]" />
          <p className="text-[10px] font-semibold tracking-widest text-[#8c7f72] uppercase mb-2">Próximo Evento</p>
          <p className="text-lg font-black text-[#1a4d8f] leading-tight mt-1" style={{ letterSpacing: '-0.02em' }}>
            {loading ? '—' : proximoEvento ? proximoEvento.name : 'Sin eventos próximos'}
          </p>
          {proximoEvento && (
            <p className="text-xs text-[#8c7f72] mt-1">
              {format(new Date(proximoEvento.startDate), 'd MMM, yyyy', { locale: es })}
            </p>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(['todos', 'activos', 'finalizados'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
              filter === f
                ? 'bg-[#e85d26] border-[#e85d26] text-white'
                : 'bg-white dark:bg-gray-900 border-[#e8e2d9] dark:border-gray-700 text-[#8c7f72] hover:border-[#e85d26] hover:text-[#e85d26]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-white dark:bg-gray-900 border border-[#e8e2d9] dark:border-gray-700 rounded-lg px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-[#8c7f72]" />
          <input
            type="text"
            placeholder="Buscar evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none bg-transparent text-sm text-[#1a1714] dark:text-white placeholder:text-[#8c7f72] w-40"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 overflow-hidden animate-pulse">
              <div className="h-28 bg-gray-200 dark:bg-gray-800" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🗓️</p>
          <p className="text-xl font-bold text-[#1a1714] dark:text-white mb-2">No hay eventos</p>
          <p className="text-sm text-[#8c7f72] mb-6">
            {search ? 'Intenta con otro término de búsqueda.' : 'Crea tu primer evento para comenzar.'}
          </p>
          {!search && (
            <Link href="/events/new">
              <Button className="bg-[#e85d26] hover:bg-[#cf4e1f] text-white rounded-xl">
                <PlusCircle className="h-4 w-4 mr-2" /> Crear evento
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event, idx) => {
            const banner = BANNERS[idx % BANNERS.length];
            const status = getStatus(event);
            return (
              <EventCard
                key={event.id}
                event={event}
                banner={banner}
                statusLabel={status.label}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface EventCardProps {
  event: EventWithStats;
  banner: { from: string; to: string; emoji: string };
  statusLabel: string;
  onDelete: (id: string) => void;
}

function EventCard({ event, banner, statusLabel, onDelete }: EventCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-200 flex flex-col">

      {/* Banner */}
      <div
        className="h-28 relative flex items-end justify-between px-5 pb-4"
        style={{ background: `linear-gradient(135deg, ${banner.from}, ${banner.to})` }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6) 0%, transparent 50%)' }} />
        <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl backdrop-blur-sm">
          {banner.emoji}
        </div>
        <span className="relative z-10 text-[10px] font-semibold tracking-wider uppercase text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
          {statusLabel === 'Finalizado' ? '✓' : statusLabel === 'Próximo' ? '✦' : '●'} {statusLabel}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h2 className="font-extrabold text-[#1a1714] dark:text-white text-lg leading-tight mb-1" style={{ letterSpacing: '-0.02em' }}>
          {event.name}
        </h2>

        {event.description && (
          <p className="text-xs text-[#8c7f72] leading-relaxed mb-3 line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-[#8c7f72] mb-4">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {format(new Date(event.startDate), 'd MMM yyyy', { locale: es })}
            {event.endDate && ` — ${format(new Date(event.endDate), 'd MMM yyyy', { locale: es })}`}
          </span>
        </div>

        {/* FIX: Cambié grid-cols-3 por una lista vertical para que los números grandes no se corten */}
        <div className="bg-[#f7f4ef] dark:bg-gray-800 rounded-xl p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-[#8c7f72]">Ingresos</p>
            <p className="text-sm font-extrabold text-[#2d8a5e]">{fmt(event.totalIncome)}</p>
          </div>
          <div className="flex items-center justify-between border-t border-[#e8e2d9] dark:border-gray-700 pt-2">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-[#8c7f72]">Gastos</p>
            <p className="text-sm font-extrabold text-[#e85d26]">{fmt(event.totalExpense)}</p>
          </div>
          <div className="flex items-center justify-between border-t border-[#e8e2d9] dark:border-gray-700 pt-2">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-[#8c7f72]">Balance</p>
            <p className={`text-sm font-extrabold ${event.balance >= 0 ? 'text-[#1a1714] dark:text-white' : 'text-red-500'}`}>
              {event.balance >= 0 ? '+' : ''}{fmt(event.balance)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#8c7f72]">
            <Receipt className="h-3.5 w-3.5" />
            {event.txCount} transaccion{event.txCount !== 1 ? 'es' : ''}
          </div>
          <div className="flex gap-1.5">
            <Link href={`/events/edit/${event.id}`}>
              <button className="w-8 h-8 rounded-lg border border-[#e8e2d9] dark:border-gray-700 flex items-center justify-center text-[#8c7f72] hover:border-[#e85d26] hover:text-[#e85d26] transition-colors">
                <Edit className="h-3.5 w-3.5" />
              </button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-8 h-8 rounded-lg border border-[#e8e2d9] dark:border-gray-700 flex items-center justify-center text-[#8c7f72] hover:border-red-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará &quot;{event.name}&quot;. Las transacciones asociadas quedarán desvinculadas del evento. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(event.id)}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}