'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Package, DollarSign, Users, TrendingUp,
  Check, Clock, AlertCircle, Trash2, Pencil, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface SaleProduct {
  id: string;
  name: string;
  price: number;
  unitDescription: string | null;
  sortOrder: number;
}

interface SaleEntryItem {
  id: string;
  saleProductId: string;
  quantity: number;
  saleProduct: SaleProduct;
}

interface SaleEntry {
  id: string;
  clientName: string;
  deliveryDate: string | null;
  amountPaid: number;
  paymentStatus: string;
  comment: string | null;
  items: SaleEntryItem[];
  totalOwed: number;
  totalPending: number;
  createdAt: string;
}

interface Summary {
  totalOwed: number;
  totalPaid: number;
  totalPending: number;
  totalClients: number;
  countByStatus: Record<string, number>;
  progressPercent: number;
}

type StatusFilter = 'ALL' | 'PENDIENTE' | 'PARCIAL' | 'PAGADO';

/* ══════════════════════════════════════════════════════════
   STATUS BADGE
══════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    PAGADO:    { bg: 'bg-green-500/15 border-green-500/30', text: 'text-green-400', icon: Check,       label: 'Pagado' },
    PARCIAL:   { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400', icon: Clock,       label: 'Parcial' },
    PENDIENTE: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', icon: AlertCircle, label: 'Pendiente' },
  };
  const s = map[status] ?? map.PENDIENTE;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider', s.bg, s.text)}>
      <s.icon size={9} />
      {s.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function SalesPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [eventName, setEventName] = useState('');
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<SaleEntry | null>(null);
  const [showProducts, setShowProducts] = useState(false);

  // Product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [evRes, prodRes, entRes, sumRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/sales/products`),
        fetch(`/api/events/${eventId}/sales/entries`),
        fetch(`/api/events/${eventId}/sales/summary`),
      ]);
      if (evRes.ok) { const ev = await evRes.json(); setEventName(ev.name); }
      if (prodRes.ok) setProducts(await prodRes.json());
      if (entRes.ok) setEntries(await entRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addProduct = async () => {
    if (!newProdName || !newProdPrice) return;
    await fetch(`/api/events/${eventId}/sales/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProdName,
        price: parseFloat(newProdPrice),
        unitDescription: newProdUnit || null,
        sortOrder: products.length,
      }),
    });
    setNewProdName(''); setNewProdPrice(''); setNewProdUnit('');
    fetchAll();
  };

  const deleteProduct = async (id: string) => {
    await fetch(`/api/events/${eventId}/sales/products`, {
      method: 'POST', // We'll handle via a simple refetch - products don't have DELETE route yet
    });
    fetchAll();
  };

  const deleteEntry = async (entryId: string) => {
    await fetch(`/api/events/${eventId}/sales/entries/${entryId}`, { method: 'DELETE' });
    fetchAll();
  };

  const filtered = filter === 'ALL' ? entries : entries.filter(e => e.paymentStatus === filter);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white pb-24">
      {/* ── HEADER ── */}
      <div className="bg-gradient-to-b from-emerald-900/20 to-transparent border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button onClick={() => router.push(`/events/${eventId}`)}
            className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest mb-4 transition-all">
            <ArrowLeft size={14} /> Volver al evento
          </button>
          <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">{eventName}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mt-1">
            Control de Entregas y Cobros
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 space-y-6">

        {/* ── KPI CARDS ── */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total a Cobrar', value: summary.totalOwed, color: 'text-white', icon: DollarSign, iconBg: 'bg-emerald-500/15' },
              { label: 'Cobrado', value: summary.totalPaid, color: 'text-green-400', icon: Check, iconBg: 'bg-green-500/15' },
              { label: 'Pendiente', value: summary.totalPending, color: 'text-orange-400', icon: Clock, iconBg: 'bg-orange-500/15' },
              { label: 'Clientes', value: summary.totalClients, color: 'text-blue-400', icon: Users, iconBg: 'bg-blue-500/15', isCurrency: false },
            ].map(card => (
              <div key={card.label} className="bg-[#13151f] rounded-2xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', card.iconBg)}>
                    <card.icon size={13} className={card.color} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30">{card.label}</span>
                </div>
                <p className={cn('text-lg md:text-xl font-black italic', card.color)}>
                  {card.isCurrency === false ? card.value : formatCurrency(card.value as number)}
                </p>
              </div>
            ))}

            {/* Progress bar full width */}
            <div className="col-span-2 md:col-span-4 bg-[#13151f] rounded-2xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30 flex items-center gap-1.5">
                  <TrendingUp size={10} className="text-emerald-400" /> Progreso de Cobro
                </span>
                <span className="text-sm font-black text-emerald-400">{summary.progressPercent}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${summary.progressPercent}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400" />
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-[8px] text-green-400/60 font-bold">{summary.countByStatus.PAGADO ?? 0} pagados</span>
                <span className="text-[8px] text-yellow-400/60 font-bold">{summary.countByStatus.PARCIAL ?? 0} parciales</span>
                <span className="text-[8px] text-red-400/60 font-bold">{summary.countByStatus.PENDIENTE ?? 0} pendientes</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCT CONFIG (collapsible) ── */}
        <div className="bg-[#13151f] rounded-2xl border border-white/5 overflow-hidden">
          <button onClick={() => setShowProducts(v => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">
                Productos ({products.length})
              </span>
            </div>
            {showProducts ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
          </button>

          <AnimatePresence>
            {showProducts && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="border-t border-white/5 overflow-hidden">
                <div className="p-4 space-y-3">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2">
                      <div>
                        <span className="text-sm font-bold">{p.name}</span>
                        {p.unitDescription && <span className="text-[9px] text-white/30 ml-2">({p.unitDescription})</span>}
                      </div>
                      <span className="text-sm font-black text-emerald-400">{formatCurrency(p.price)}</span>
                    </div>
                  ))}

                  {/* Add product inline */}
                  <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-white/5">
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[7px] font-black uppercase tracking-widest text-white/20 block mb-1">Nombre</label>
                      <input value={newProdName} onChange={e => setNewProdName(e.target.value)}
                        placeholder="Ej: Paquete"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
                    </div>
                    <div className="w-24">
                      <label className="text-[7px] font-black uppercase tracking-widest text-white/20 block mb-1">Precio</label>
                      <input value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)}
                        type="number" placeholder="1600"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <label className="text-[7px] font-black uppercase tracking-widest text-white/20 block mb-1">Descripcion</label>
                      <input value={newProdUnit} onChange={e => setNewProdUnit(e.target.value)}
                        placeholder="Ej: 8 fundas"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
                    </div>
                    <button onClick={addProduct}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                      Agregar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FILTER + ADD BUTTON ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1.5">
            {(['ALL', 'PENDIENTE', 'PARCIAL', 'PAGADO'] as StatusFilter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all',
                  filter === f
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'border-white/5 text-white/25 hover:text-white/50 hover:bg-white/[0.03]'
                )}>
                {f === 'ALL' ? `Todos (${entries.length})` :
                 f === 'PAGADO' ? `Pagados (${summary?.countByStatus.PAGADO ?? 0})` :
                 f === 'PARCIAL' ? `Parciales (${summary?.countByStatus.PARCIAL ?? 0})` :
                 `Pendientes (${summary?.countByStatus.PENDIENTE ?? 0})`}
              </button>
            ))}
          </div>

          <button onClick={() => { setEditEntry(null); setShowAddModal(true); }}
            disabled={products.length === 0}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
              products.length === 0
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            )}>
            <Plus size={13} /> Agregar Cliente
          </button>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12 bg-[#13151f] rounded-2xl border border-white/5">
            <Package size={32} className="mx-auto text-white/10 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
              Primero configura los productos arriba
            </p>
          </div>
        )}

        {/* ── ENTRIES TABLE ── */}
        {products.length > 0 && (
          <div className="bg-[#13151f] rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Cliente', ...products.map(p => p.name), 'Total', 'Pagado', 'Pendiente', 'Estado', 'Fecha', ''].map((h, i) => (
                      <th key={i} className="text-[7px] font-black uppercase tracking-[0.15em] text-white/20 px-3 py-3 text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, i) => (
                    <tr key={entry.id}
                      className={cn('border-b border-white/[0.03] hover:bg-white/[0.02] transition-all', i % 2 === 1 && 'bg-white/[0.01]')}>
                      <td className="px-3 py-2.5 text-sm font-bold whitespace-nowrap">{entry.clientName}</td>
                      {products.map(p => {
                        const item = entry.items.find(it => it.saleProductId === p.id);
                        return (
                          <td key={p.id} className="px-3 py-2.5 text-sm text-center text-white/60">
                            {item?.quantity ?? 0}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-sm font-bold text-white/80 whitespace-nowrap">{formatCurrency(entry.totalOwed)}</td>
                      <td className="px-3 py-2.5 text-sm font-bold text-green-400 whitespace-nowrap">{formatCurrency(entry.amountPaid)}</td>
                      <td className="px-3 py-2.5 text-sm font-bold text-orange-400 whitespace-nowrap">
                        {entry.totalPending > 0 ? formatCurrency(entry.totalPending) : '-'}
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={entry.paymentStatus} /></td>
                      <td className="px-3 py-2.5 text-[10px] text-white/30 whitespace-nowrap">
                        {entry.deliveryDate ? format(new Date(entry.deliveryDate), 'dd/MM', { locale: es }) : '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditEntry(entry); setShowAddModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => deleteEntry(entry.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/15">Sin registros</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ADD/EDIT MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <EntryModal
            products={products}
            eventId={eventId}
            entry={editEntry}
            onClose={() => { setShowAddModal(false); setEditEntry(null); }}
            onSaved={() => { setShowAddModal(false); setEditEntry(null); fetchAll(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ENTRY MODAL
══════════════════════════════════════════════════════════ */
function EntryModal({
  products, eventId, entry, onClose, onSaved,
}: {
  products: SaleProduct[];
  eventId: string;
  entry: SaleEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!entry;
  const [clientName, setClientName] = useState(entry?.clientName ?? '');
  const [deliveryDate, setDeliveryDate] = useState(entry?.deliveryDate ? entry.deliveryDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [amountPaid, setAmountPaid] = useState(String(entry?.amountPaid ?? 0));
  const [comment, setComment] = useState(entry?.comment ?? '');
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const q: Record<string, number> = {};
    products.forEach(p => {
      const item = entry?.items.find(it => it.saleProductId === p.id);
      q[p.id] = item?.quantity ?? 0;
    });
    return q;
  });
  const [saving, setSaving] = useState(false);

  const totalOwed = products.reduce((sum, p) => sum + (quantities[p.id] ?? 0) * p.price, 0);
  const paid = parseFloat(amountPaid) || 0;

  const save = async () => {
    setSaving(true);
    const items = products.map(p => ({ saleProductId: p.id, quantity: quantities[p.id] ?? 0 })).filter(i => i.quantity > 0);
    const body = { clientName, deliveryDate: deliveryDate || null, amountPaid: paid, comment: comment || null, items };

    const url = isEdit
      ? `/api/events/${eventId}/sales/entries/${entry!.id}`
      : `/api/events/${eventId}/sales/entries`;

    await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#13151f] border border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest">
            {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Client name */}
          <div>
            <label className="text-[7px] font-black uppercase tracking-widest text-white/30 block mb-1">Nombre del Cliente</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
          </div>

          {/* Products quantities */}
          <div>
            <label className="text-[7px] font-black uppercase tracking-widest text-white/30 block mb-2">Productos Entregados</label>
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2">
                  <div>
                    <span className="text-sm font-bold">{p.name}</span>
                    <span className="text-[9px] text-white/20 ml-2">{formatCurrency(p.price)} c/u</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantities(q => ({ ...q, [p.id]: Math.max(0, (q[p.id] ?? 0) - 1) }))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 flex items-center justify-center transition-all font-bold">-</button>
                    <span className="w-8 text-center text-sm font-black">{quantities[p.id] ?? 0}</span>
                    <button onClick={() => setQuantities(q => ({ ...q, [p.id]: (q[p.id] ?? 0) + 1 }))}
                      className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center transition-all font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
            {totalOwed > 0 && (
              <p className="text-right text-[10px] text-white/30 font-bold mt-2">
                Total a pagar: <span className="text-white font-black">{formatCurrency(totalOwed)}</span>
              </p>
            )}
          </div>

          {/* Amount paid */}
          <div>
            <label className="text-[7px] font-black uppercase tracking-widest text-white/30 block mb-1">Monto Pagado</label>
            <input value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
              type="number" placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
            {totalOwed > 0 && paid < totalOwed && paid > 0 && (
              <p className="text-[9px] text-orange-400/60 font-bold mt-1">
                Falta: {formatCurrency(totalOwed - paid)}
              </p>
            )}
          </div>

          {/* Delivery date */}
          <div>
            <label className="text-[7px] font-black uppercase tracking-widest text-white/30 block mb-1">Fecha de Entrega</label>
            <input value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
              type="date"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
          </div>

          {/* Comment */}
          <div>
            <label className="text-[7px] font-black uppercase tracking-widest text-white/30 block mb-1">Comentario</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              rows={2} placeholder="Notas adicionales..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 focus:outline-none transition-all resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button onClick={save} disabled={!clientName || totalOwed === 0 || saving}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
              !clientName || totalOwed === 0
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            )}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Registrar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
