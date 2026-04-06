'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Package, DollarSign, Users, TrendingUp,
  Check, Clock, AlertCircle, Trash2, Pencil, X, ChevronDown, ChevronUp,
  Search, ArrowUpDown, ArrowUp, ArrowDown, Target, Wallet,
  Download, MessageCircle,
} from 'lucide-react';
import { toPng } from 'html-to-image';
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

interface ProductStat {
  productId: string;
  productName: string;
  totalSold: number;
}

interface Summary {
  totalOwed: number;
  totalPaid: number;
  totalPending: number;
  totalClients: number;
  countByStatus: Record<string, number>;
  progressPercent: number;
  productStats: ProductStat[];
}

interface EventData {
  name: string;
  investment?: number;
  salesGoal?: number;
  type: string;
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

  const [event, setEvent] = useState<EventData | null>(null);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<SaleEntry | null>(null);
  const [showProducts, setShowProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('clientName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'entry'; id: string; name: string } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdUnit, setEditProdUnit] = useState('');

  // Inline payment state
  const [activePaymentEntryId, setActivePaymentEntryId] = useState<string | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [evRes, prodRes, entRes, sumRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/sales/products`),
        fetch(`/api/events/${eventId}/sales/entries`),
        fetch(`/api/events/${eventId}/sales/summary`),
      ]);
      if (evRes.ok) { const ev = await evRes.json(); setEvent(ev); }
      if (prodRes.ok) setProducts(await prodRes.json());
      if (entRes.ok) setEntries(await entRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addPayment = async (entryId: string) => {
    const amount = parseFloat(newPaymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setAddingPayment(true);
    try {
      const res = await fetch(`/api/events/${eventId}/sales/entries/${entryId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        setActivePaymentEntryId(null);
        setNewPaymentAmount('');
        fetchAll();
      }
    } finally {
      setAddingPayment(false);
    }
  };

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
    await fetch(`/api/events/${eventId}/sales/products/${id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchAll();
  };

  const startEditProduct = (p: SaleProduct) => {
    setEditingProduct(p.id);
    setEditProdName(p.name);
    setEditProdPrice(String(p.price));
    setEditProdUnit(p.unitDescription ?? '');
  };

  const saveEditProduct = async (id: string) => {
    if (!editProdName || !editProdPrice) return;
    await fetch(`/api/events/${eventId}/sales/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editProdName,
        price: parseFloat(editProdPrice),
        unitDescription: editProdUnit || null,
        sortOrder: products.find(p => p.id === id)?.sortOrder ?? 0,
      }),
    });
    setEditingProduct(null);
    fetchAll();
  };

  const deleteEntry = async (entryId: string) => {
    await fetch(`/api/events/${eventId}/sales/entries/${entryId}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchAll();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'product') deleteProduct(deleteTarget.id);
    else deleteEntry(deleteTarget.id);
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const exportImage = async () => {
    const node = reportRef.current;
    if (!node) return;
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: '#0a0c14',
        width: 600,
        height: node.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `ventas-${event?.name ?? 'reporte'}-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting image:', err);
    }
  };

  const shareWhatsApp = () => {
    if (!summary) return;
    const pending = entries.filter(e => e.paymentStatus !== 'PAGADO');
    let text = `📊 *VENTAS - ${(event?.name ?? '').toUpperCase()}*\n`;
    text += `📅 ${format(new Date(), "dd/MM/yyyy", { locale: es })}\n\n`;
    text += `💰 *Resumen:*\n`;
    text += `• Total a Cobrar: ${formatCurrency(summary.totalOwed)}\n`;
    text += `• Cobrado: ${formatCurrency(summary.totalPaid)}\n`;
    text += `• Pendiente: ${formatCurrency(summary.totalPending)}\n\n`;
    if (pending.length > 0) {
      text += `⏳ *Clientes Pendientes de Cobro:*\n`;
      pending.forEach((e, i) => {
        text += `${i + 1}. *${e.clientName}* - Debe: ${formatCurrency(e.totalPending)} (Pagó: ${formatCurrency(e.amountPaid)})\n`;
      });
      text += `\n`;
    }
    text += `✅ Pagados: ${summary.countByStatus.PAGADO ?? 0}\n`;
    text += `⏳ Parciales: ${summary.countByStatus.PARCIAL ?? 0}\n`;
    text += `❌ Pendientes: ${summary.countByStatus.PENDIENTE ?? 0}`;
    window.open('https://wa.me/?text=' + encodeURIComponent(text));
  };

  const filtered = entries.filter(e => {
    const matchStatus = filter === 'ALL' || e.paymentStatus === filter;
    const matchSearch = !searchQuery || e.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: any, bVal: any;
    switch (sortField) {
      case 'clientName': aVal = a.clientName.toLowerCase(); bVal = b.clientName.toLowerCase(); break;
      case 'totalOwed': aVal = a.totalOwed; bVal = b.totalOwed; break;
      case 'amountPaid': aVal = a.amountPaid; bVal = b.amountPaid; break;
      case 'totalPending': aVal = a.totalPending; bVal = b.totalPending; break;
      case 'paymentStatus': aVal = a.paymentStatus; bVal = b.paymentStatus; break;
      case 'deliveryDate': aVal = a.deliveryDate ?? ''; bVal = b.deliveryDate ?? ''; break;
      default: return 0;
    }
    if (aVal === bVal) return 0;
    const result = aVal < bVal ? -1 : 1;
    return sortDirection === 'asc' ? result : -result;
  });

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
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.push(`/events/${eventId}`)}
              className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">
              <ArrowLeft size={14} /> Volver al evento
            </button>
            <div className="flex gap-2">
              <button onClick={exportImage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 text-[9px] font-black uppercase tracking-widest transition-all">
                <Download size={12} /> Exportar
              </button>
              <button onClick={shareWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest transition-all">
                <MessageCircle size={12} /> WhatsApp
              </button>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">{event?.name}</h1>
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

            {event?.salesGoal && event.salesGoal > 0 && (
              <div className="bg-[#13151f] rounded-2xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-yellow-500/15">
                    <Target size={13} className="text-yellow-400" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30">Meta de Venta</span>
                </div>
                <p className="text-lg md:text-xl font-black italic text-yellow-400">{formatCurrency(event.salesGoal)}</p>
                <p className="text-[9px] text-white/30 font-bold mt-1">
                  Alcanzado: {Math.round((summary.totalOwed / event.salesGoal) * 100)}%
                </p>
              </div>
            )}

            {event?.investment && event.investment > 0 && (
              <div className="bg-[#13151f] rounded-2xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/15">
                    <Wallet size={13} className="text-purple-400" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30">Inversión</span>
                </div>
                <p className="text-lg md:text-xl font-black italic text-purple-400">{formatCurrency(event.investment)}</p>
                <p className={cn('text-[9px] font-bold mt-1', summary.totalPaid - event.investment >= 0 ? 'text-green-400/60' : 'text-red-400/60')}>
                  Ganancia: {formatCurrency(summary.totalPaid - event.investment)}
                </p>
              </div>
            )}

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
                    <div key={p.id} className="bg-white/[0.03] rounded-xl px-3 py-2">
                      {editingProduct === p.id ? (
                        <div className="flex flex-wrap gap-2 items-end">
                          <div className="flex-1 min-w-[100px]">
                            <input value={editProdName} onChange={e => setEditProdName(e.target.value)}
                              className="w-full bg-white/5 border border-emerald-500/30 rounded-lg px-2 py-1.5 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
                          </div>
                          <div className="w-24">
                            <input value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)}
                              type="number"
                              className="w-full bg-white/5 border border-emerald-500/30 rounded-lg px-2 py-1.5 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
                          </div>
                          <div className="flex-1 min-w-[80px]">
                            <input value={editProdUnit} onChange={e => setEditProdUnit(e.target.value)}
                              placeholder="Descripción"
                              className="w-full bg-white/5 border border-emerald-500/30 rounded-lg px-2 py-1.5 text-sm focus:border-emerald-500/50 focus:outline-none transition-all" />
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => saveEditProduct(p.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-all">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingProduct(null)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-all">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold">{p.name}</span>
                            {p.unitDescription && <span className="text-[9px] text-white/30 ml-2">({p.unitDescription})</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-emerald-400">{formatCurrency(p.price)}</span>
                            {summary?.productStats && (() => {
                              const stat = summary.productStats.find(s => s.productId === p.id);
                              return stat && stat.totalSold > 0 ? (
                                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[8px] font-black">{stat.totalSold} vendidos</span>
                              ) : null;
                            })()}
                            <button onClick={() => startEditProduct(p)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => setDeleteTarget({ type: 'product', id: p.id, name: p.name })}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
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

        {/* ── FILTER + SEARCH + ADD BUTTON ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
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
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente..."
                className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none transition-all w-40" />
            </div>
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
                    {[
                      { label: 'Cliente', field: 'clientName' },
                      ...products.map(p => ({ label: p.name, field: '' })),
                      { label: 'Total', field: 'totalOwed' },
                      { label: 'Pagado', field: 'amountPaid' },
                      { label: 'Pendiente', field: 'totalPending' },
                      { label: 'Estado', field: 'paymentStatus' },
                      { label: 'Fecha', field: 'deliveryDate' },
                      { label: '', field: '' },
                    ].map((h, i) => (
                      <th key={i}
                        onClick={() => h.field && handleSort(h.field)}
                        className={cn(
                          'text-[7px] font-black uppercase tracking-[0.15em] text-white/20 px-3 py-3 text-left whitespace-nowrap',
                          h.field && 'cursor-pointer hover:text-white/40 select-none'
                        )}>
                        <span className="inline-flex items-center gap-1">
                          {h.label}
                          {h.field && (sortField === h.field
                            ? (sortDirection === 'asc' ? <ArrowUp size={9} className="text-emerald-400" /> : <ArrowDown size={9} className="text-emerald-400" />)
                            : h.label && <ArrowUpDown size={9} className="opacity-30" />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry, i) => (
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
                      <td className="px-3 py-2.5 text-sm font-bold text-green-400 whitespace-nowrap">
                        {activePaymentEntryId === entry.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              type="number"
                              value={newPaymentAmount}
                              onChange={(e) => setNewPaymentAmount(e.target.value)}
                              className="w-16 bg-white/10 border border-emerald-500/50 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addPayment(entry.id);
                                if (e.key === 'Escape') setActivePaymentEntryId(null);
                              }}
                            />
                            <button
                              onClick={() => addPayment(entry.id)}
                              disabled={addingPayment}
                              className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 transition-all"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setActivePaymentEntryId(null)}
                              className="p-1 rounded hover:bg-white/10 text-white/30 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActivePaymentEntryId(entry.id);
                              setNewPaymentAmount('');
                            }}
                            className="hover:underline decoration-emerald-500/30 underline-offset-4"
                          >
                            {formatCurrency(entry.amountPaid)}
                          </button>
                        )}
                      </td>
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
                          <button onClick={() => setDeleteTarget({ type: 'entry', id: entry.id, name: entry.clientName })}
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

            {sorted.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/15">Sin registros</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CONFIRM DELETE MODAL ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#13151f] border border-white/10 rounded-3xl w-full max-w-sm p-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-2">Confirmar Eliminación</h3>
              <p className="text-sm text-white/50 mb-6">
                ¿Estás seguro de eliminar {deleteTarget.type === 'product' ? 'el producto' : 'el cliente'} <span className="text-white font-bold">{deleteTarget.name}</span>?
                {deleteTarget.type === 'product' && <span className="block text-[10px] text-red-400/60 mt-1">Se eliminarán los items asociados en las ventas.</span>}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-widest transition-all">
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ── HIDDEN REPORT FOR EXPORT ── */}
      <div ref={reportRef} style={{ visibility: 'hidden', position: 'absolute', left: '-9999px' }}>
        <div style={{ background: '#0a0c14', color: 'white', padding: '32px', width: '600px', fontFamily: 'system-ui' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '4px' }}>{event?.name}</h2>
          <p style={{ fontSize: '10px', color: '#34d399', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase' }}>Control de Entregas y Cobros</p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}</p>

          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', margin: '16px 0' }}>
              {[
                { label: 'Total a Cobrar', value: formatCurrency(summary.totalOwed), color: 'white' },
                { label: 'Cobrado', value: formatCurrency(summary.totalPaid), color: '#4ade80' },
                { label: 'Pendiente', value: formatCurrency(summary.totalPending), color: '#fb923c' },
                { label: 'Clientes', value: String(summary.totalClients), color: '#60a5fa' },
              ].map(c => (
                <div key={c.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px' }}>
                  <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{c.label}</p>
                  <p style={{ fontSize: '16px', fontWeight: 900, fontStyle: 'italic', color: c.color, marginTop: '4px' }}>{c.value}</p>
                </div>
              ))}
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Cliente', 'Total', 'Pagado', 'Pendiente', 'Estado'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '6px', fontWeight: 700 }}>{e.clientName}</td>
                  <td style={{ padding: '6px', color: 'rgba(255,255,255,0.8)' }}>{formatCurrency(e.totalOwed)}</td>
                  <td style={{ padding: '6px', color: '#4ade80' }}>{formatCurrency(e.amountPaid)}</td>
                  <td style={{ padding: '6px', color: '#fb923c' }}>{e.totalPending > 0 ? formatCurrency(e.totalPending) : '-'}</td>
                  <td style={{ padding: '6px', color: e.paymentStatus === 'PAGADO' ? '#4ade80' : e.paymentStatus === 'PARCIAL' ? '#facc15' : '#f87171', fontWeight: 700, fontSize: '9px' }}>{e.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
