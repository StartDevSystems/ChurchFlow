'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Landmark, ArrowLeftRight, PlusCircle, TrendingUp, Activity, Zap } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useToast } from '@/components/ui/use-toast';

interface Transaction {
  id: string; type: 'income' | 'expense'; amount: number; date: string;
  description: string; eventId?: string | null;
  category: { id: string; name: string; type: string };
  member?: { id: string; name: string } | null;
  event?: { id: string; name: string } | null;
}
interface Event { id: string; name: string; startDate: string; endDate?: string; }
interface Transfer { id: string; amount: number; description: string; date: string; fromEventId?: string | null; toEventId?: string | null; }
interface EventWithStats extends Event { totalIncome: number; totalExpense: number; balance: number; txCount: number; }
interface MonthlyData { month: string; Ingresos: number; Gastos: number; }

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

const MONTH_MAP: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

// ─── 3D Transfer Visual ───────────────────────────────────────────────────────
function TransferVisual({ fromName, toName, amount }: { fromName: string; toName: string; amount: string }) {
  const amountNum = parseFloat(amount) || 0;
  return (
    <div style={{ perspective: '800px', width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ width: '110px', height: '68px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 60%, #f5a623))', animation: 'floatLeft 3s ease-in-out infinite, pulse3d 3s ease-in-out infinite', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '9px 11px', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <div style={{ width: '22px', height: '16px', borderRadius: '3px', background: 'linear-gradient(135deg, #ffd700, #ffaa00)' }} />
        <div>
          <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Origen</div>
          <div style={{ fontSize: '8px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '88px' }}>{fromName}</div>
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)', pointerEvents: 'none' }} />
      </div>

      <div style={{ position: 'relative', width: '70px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{ position: 'relative', width: '100%', height: '18px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ position: 'absolute', top: '50%', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--brand-primary)', animation: 'flowParticle 1.5s ease-in-out infinite', animationDelay: `${i * 0.5}s` }} />
          ))}
          <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), var(--brand-primary), rgba(255,255,255,0.1))', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: '6px solid var(--brand-primary)' }} />
        </div>
        {amountNum > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2px 7px', fontSize: '7px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>
            {fmt(amountNum)}
          </div>
        )}
      </div>

      <div style={{ width: '110px', height: '68px', borderRadius: '10px', background: 'linear-gradient(135deg, #1a4d8f, #2a8a5e)', animation: 'floatRight 3s ease-in-out infinite', animationDelay: '0.3s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '9px 11px', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <div style={{ width: '22px', height: '16px', borderRadius: '3px', background: 'linear-gradient(135deg, #ffd700, #ffaa00)' }} />
        <div>
          <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Destino</div>
          <div style={{ fontSize: '8px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '88px' }}>{toName}</div>
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [tfForm, setTfForm] = useState({ fromEventId: '', toEventId: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, evRes, trRes] = await Promise.all([fetch('/api/transactions'), fetch('/api/events'), fetch('/api/transfers')]);
      setTransactions(txRes.ok ? await txRes.json() : []);
      setEvents(evRes.ok ? await evRes.json() : []);
      setTransfers(trRes.ok ? await trRes.json() : []);
    } catch { toast({ title: 'Error al cargar datos', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const cajaTransactions = transactions.filter(t => !t.eventId);
  const cajaIncome = cajaTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const cajaExpense = cajaTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netCajaTransfers = transfers.reduce((acc, tr) => { if (!tr.fromEventId) return acc - tr.amount; if (!tr.toEventId) return acc + tr.amount; return acc; }, 0);
  const cajaBalance = cajaIncome - cajaExpense + netCajaTransfers;

  const now = new Date();
  const thisMontCaja = cajaTransactions.filter(t => { const d = new Date(t.date); return d >= startOfMonth(now) && d <= endOfMonth(now); });
  const monthIncome = thisMontCaja.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMontCaja.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const eventsWithStats: EventWithStats[] = events.map(ev => {
    const related = transactions.filter(t => t.eventId === ev.id);
    const totalIncome = related.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = related.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netEventTransfers = transfers.reduce((acc, tr) => { if (tr.fromEventId === ev.id) return acc - tr.amount; if (tr.toEventId === ev.id) return acc + tr.amount; return acc; }, 0);
    return { ...ev, totalIncome, totalExpense, balance: (totalIncome - totalExpense) + netEventTransfers, txCount: related.length };
  }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const monthlyMap = new Map<string, MonthlyData>();
  cajaTransactions.forEach(t => {
    const key = format(parseISO(t.date), 'MMM yy', { locale: es });
    if (!monthlyMap.has(key)) monthlyMap.set(key, { month: key, Ingresos: 0, Gastos: 0 });
    const m = monthlyMap.get(key)!;
    if (t.type === 'income') m.Ingresos += t.amount; else m.Gastos += t.amount;
  });
  const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) => {
    const parse = (s: string) => { const [mon, yr] = s.split(' '); return new Date(2000 + parseInt(yr), MONTH_MAP[mon.toLowerCase().replace('.', '')] ?? 0, 1).getTime(); };
    return parse(a.month) - parse(b.month);
  });

  const fundName = (eventId?: string | null) => { if (!eventId) return 'Caja General'; return events.find(e => e.id === eventId)?.name ?? 'Evento'; };
  const getOriginBalance = () => { if (!tfForm.fromEventId) return cajaBalance; return eventsWithStats.find(e => e.id === tfForm.fromEventId)?.balance ?? 0; };
  const originBalance = getOriginBalance();
  const amountNum = parseFloat(tfForm.amount) || 0;
  const afterTransfer = originBalance - amountNum;
  const totalBalance = cajaBalance + eventsWithStats.reduce((s, e) => s + e.balance, 0);

  const handleSaveTransfer = async () => {
    if (!tfForm.amount || !tfForm.description || !tfForm.date) { toast({ title: 'Completa todos los campos', variant: 'destructive' }); return; }
    if (tfForm.fromEventId === tfForm.toEventId) { toast({ title: 'Origen y destino no pueden ser iguales', variant: 'destructive' }); return; }
    if (amountNum > originBalance) { toast({ title: 'Fondos insuficientes', description: `El origen solo tiene ${fmt(originBalance)} disponible.`, variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: tfForm.amount, description: tfForm.description, date: tfForm.date, fromEventId: tfForm.fromEventId || null, toEventId: tfForm.toEventId || null }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast({ title: 'Transferencia registrada' });
      setShowTransfer(false);
      setTfForm({ fromEventId: '', toEventId: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      fetchAll();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8" style={{ background: '#0a0c14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--brand-primary)', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase' }}>Cargando</p>
      </div>
    </div>
  );

  return (
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8" style={{ background: '#0a0c14', minHeight: '100vh' }}>
      <style>{`
        @keyframes floatLeft {
          0%,100%{transform:rotateY(25deg) rotateX(8deg) translateZ(0) translateY(0);}
          50%{transform:rotateY(25deg) rotateX(8deg) translateZ(8px) translateY(-4px);}
        }
        @keyframes floatRight {
          0%,100%{transform:rotateY(-25deg) rotateX(8deg) translateZ(0) translateY(0);}
          50%{transform:rotateY(-25deg) rotateX(8deg) translateZ(8px) translateY(-4px);}
        }
        @keyframes flowParticle {
          0%{left:20%;opacity:0;transform:translateY(-50%) scale(0.5);}
          20%{opacity:1;transform:translateY(-50%) scale(1);}
          80%{opacity:1;transform:translateY(-50%) scale(1);}
          100%{left:80%;opacity:0;transform:translateY(-50%) scale(0.5);}
        }
        @keyframes pulse3d {
          0%,100%{box-shadow:0 8px 32px color-mix(in srgb, var(--brand-primary) 30%, transparent);}
          50%{box-shadow:0 12px 48px color-mix(in srgb, var(--brand-primary) 50%, transparent);}
        }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(18px);}
          to{opacity:1;transform:translateY(0);}
        }
        @keyframes glowPulse {
          0%,100%{opacity:0.5;}
          50%{opacity:1;}
        }
        .dash-card {
          animation: fadeUp 0.5s ease both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .dash-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        .glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          backdrop-filter: blur(10px);
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .row-item {
          padding: 10px;
          border-radius: 10px;
          transition: background 0.15s;
          cursor: default;
        }
        .row-item:hover { background: rgba(255,255,255,0.04); }
        .brand-dot {
          animation: glowPulse 2s ease-in-out infinite;
          box-shadow: 0 0 8px var(--brand-primary);
        }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', top: '-200px', left: '15%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 7%, transparent) 0%, transparent 70%)', animation: 'glowPulse 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-150px', right: '5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,77,143,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '36px 32px 60px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '36px', animation: 'fadeUp 0.4s ease both' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div className="brand-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0 }} />
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>SISTEMA ACTIVO · {format(now, "d 'de' MMMM yyyy", { locale: es })}</p>
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>
              Dashboard
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', animation: 'fadeUp 0.4s ease 0.1s both' }}>
            <button onClick={() => setShowTransfer(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--brand-primary)'; b.style.color = 'var(--brand-primary)'; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.09)'; b.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              <ArrowLeftRight size={14} /> Nueva Transferencia
            </button>
            <Link href="/transactions/new">
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: 'var(--brand-primary)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 24px color-mix(in srgb, var(--brand-primary) 40%, transparent)' }}>
                <PlusCircle size={14} /> Registrar Movimiento
              </button>
            </Link>
          </div>
        </div>

        {/* ── KPI Hero Banner ── */}
        <div className="dash-card glass" style={{ padding: '28px 32px', marginBottom: '20px', animationDelay: '0.05s', background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', overflow: 'hidden', position: 'relative' }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--brand-primary), transparent)' }} />
          {/* Corner decoration */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 8%, transparent), transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ flex: '1 1 200px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>Balance Total Consolidado</p>
              <p style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: totalBalance >= 0 ? '#4ade80' : '#f87171', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {fmt(totalBalance)}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>Caja General + {eventsWithStats.length} eventos</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {[
                { label: 'Caja General', value: cajaBalance, color: 'var(--brand-primary)', Icon: Landmark },
                { label: 'Ingresos mes', value: monthIncome, color: '#4ade80', Icon: ArrowUpRight },
                { label: 'Gastos mes', value: monthExpense, color: '#f87171', Icon: ArrowDownRight },
              ].map(({ label, value, color, Icon }, i) => (
                <div key={i} style={{ animation: `fadeUp 0.5s ease ${0.1 + i * 0.08}s both`, paddingLeft: '20px', borderLeft: `2px solid ${color}25` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', opacity: 0.6 }}>
                    <Icon size={11} color={color} />
                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color }}>
                      {label}
                    </p>
                  </div>
                  <p style={{ fontSize: '20px', fontWeight: 900, color, letterSpacing: '-0.03em' }}>{fmt(value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Eventos + Movimientos ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>

          {/* Eventos */}
          <div className="dash-card glass" style={{ padding: '22px', animationDelay: '0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={13} color="var(--brand-primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Fondos por Evento</p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{eventsWithStats.length} eventos</p>
                </div>
              </div>
              <Link href="/events" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none', opacity: 0.7 }}>Ver todos →</Link>
            </div>

            {eventsWithStats.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '28px 0' }}>No hay eventos registrados</p>
            ) : eventsWithStats.slice(0, 5).map((ev, i) => {
              const colors = ['var(--brand-primary)', '#60a5fa', '#0e7490', '#a78bfa', '#4ade80'];
              const c = colors[i % colors.length];
              const pct = ev.totalIncome > 0 ? Math.min(100, Math.max(0, (ev.balance / ev.totalIncome) * 100)) : 0;
              return (
                <div key={ev.id} className="row-item" style={{ marginBottom: '2px', animation: `fadeUp 0.4s ease ${0.2 + i * 0.05}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c, flexShrink: 0, boxShadow: `0 0 5px ${c}` }} />
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</p>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: ev.balance >= 0 ? '#4ade80' : '#f87171', letterSpacing: '-0.02em', flexShrink: 0 }}>
                      {ev.balance >= 0 ? '+' : ''}{fmt(ev.balance)}
                    </p>
                  </div>
                  <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden', marginLeft: '17px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: '1px', transition: 'width 1s ease' }} />
                  </div>
                  <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '3px', marginLeft: '17px' }}>{ev.txCount} tx · {fmt(ev.totalIncome)} in · {fmt(ev.totalExpense)} out</p>
                </div>
              );
            })}
          </div>

          {/* Últimos movimientos */}
          <div className="dash-card glass" style={{ padding: '22px', animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={13} color="#4ade80" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Últimos Movimientos</p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>Actividad reciente</p>
                </div>
              </div>
              <Link href="/transactions" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none', opacity: 0.7 }}>Ver todos →</Link>
            </div>

            {transactions.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '28px 0' }}>No hay transacciones aún</p>
            ) : transactions.slice(0, 5).map((t, i) => (
              <div key={t.id} className="row-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px', animation: `fadeUp 0.4s ease ${0.25 + i * 0.05}s both` }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.type === 'income' ? 'rgba(42,138,94,0.12)' : 'rgba(220,53,69,0.12)' }}>
                  {t.type === 'income' ? <ArrowUpRight size={13} color="#4ade80" /> : <ArrowDownRight size={13} color="#f87171" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</p>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '2px', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>{t.category?.name}</span>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>{format(new Date(t.date), 'd MMM', { locale: es })}</span>
                  </div>
                </div>
                <p style={{ fontSize: '12px', fontWeight: 800, color: t.type === 'income' ? '#4ade80' : '#f87171', letterSpacing: '-0.02em', flexShrink: 0 }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 3: Gráfica + Transferencias ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

          {/* Gráfica */}
          <div className="dash-card glass" style={{ padding: '22px', animationDelay: '0.28s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={13} color="#60a5fa" />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Tendencia Mensual</p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>Caja General · ingresos vs gastos</p>
              </div>
            </div>

            {monthlyTrends.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '40px 0' }}>No hay datos suficientes</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={monthlyTrends} margin={{ top: 5, right: 4, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2a8a5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2a8a5e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc3545" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#dc3545" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" stroke="transparent" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} />
                    <YAxis tickFormatter={(v: number) => fmt(v)} stroke="transparent" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.25)' }} width={80} />
                    <Tooltip formatter={(v: any, n: any) => [fmt(Number(v)), n]} contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: 11 }} labelStyle={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }} />
                    <Area type="monotone" dataKey="Ingresos" stroke="#2a8a5e" strokeWidth={2} fill="url(#gIn)" dot={{ r: 3, fill: '#2a8a5e', strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="Gastos" stroke="#dc3545" strokeWidth={2} fill="url(#gOut)" dot={{ r: 3, fill: '#dc3545', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '6px' }}>
                  {[{ c: '#2a8a5e', l: 'Ingresos' }, { c: '#dc3545', l: 'Gastos' }].map(x => (
                    <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '12px', height: '2px', background: x.c, borderRadius: '1px' }} />
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{x.l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Transferencias */}
          <div className="dash-card glass" style={{ padding: '22px', animationDelay: '0.33s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeftRight size={13} color="#60a5fa" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Transferencias</p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>Entre fondos</p>
                </div>
              </div>
              <button onClick={() => setShowTransfer(true)} style={{ fontSize: '11px', fontWeight: 700, padding: '5px 11px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--brand-primary)'; b.style.color = 'var(--brand-primary)'; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(255,255,255,0.4)'; }}
              >+ Nueva</button>
            </div>

            {transfers.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '28px 0' }}>No hay transferencias aún</p>
            ) : transfers.slice(0, 4).map((tr, i) => (
              <div key={tr.id} className="row-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px', animation: `fadeUp 0.4s ease ${0.38 + i * 0.05}s both` }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,77,143,0.15)' }}>
                  <ArrowLeftRight size={12} color="#60a5fa" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tr.description}</p>
                  <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fundName(tr.fromEventId)} → {fundName(tr.toEventId)} · {format(new Date(tr.date), 'd MMM', { locale: es })}
                  </p>
                </div>
                <p style={{ fontSize: '12px', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.02em', flexShrink: 0 }}>{fmt(tr.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal Transferencia ── */}
      {showTransfer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowTransfer(false); }}
        >
          <div style={{ width: '100%', maxWidth: '440px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', animation: 'fadeUp 0.3s ease' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(160deg, #0f1117 0%, #1a1d2e 50%, #0f1117 100%)', padding: '28px 28px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(color-mix(in srgb, var(--brand-primary) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 5%, transparent) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
              <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 14%, transparent) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--brand-primary) 75%, transparent)', marginBottom: '4px' }}>TRANSFERENCIA DE FONDOS</p>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>Mover Capital</h3>
                  </div>
                  <button onClick={() => setShowTransfer(false)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
                <TransferVisual fromName={fundName(tfForm.fromEventId || null)} toName={fundName(tfForm.toEventId || null)} amount={tfForm.amount} />
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                  <div>
                    <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>Disponible</p>
                    <p style={{ fontSize: '18px', fontWeight: 900, color: originBalance >= 0 ? '#4ade80' : '#f87171', letterSpacing: '-0.03em' }}>{fmt(originBalance)}</p>
                  </div>
                  {amountNum > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>Quedará</p>
                      <p style={{ fontSize: '18px', fontWeight: 900, color: afterTransfer >= 0 ? '#94a3b8' : '#f87171', letterSpacing: '-0.03em' }}>{fmt(afterTransfer)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <div style={{ background: '#0f1117', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 28px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {(['fromEventId', 'toEventId'] as const).map((key, i) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>{i === 0 ? 'Origen' : 'Destino'}</label>
                    <select style={{ width: '100%', padding: '9px 11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '12px', color: '#fff', outline: 'none' }} value={tfForm[key]} onChange={e => setTfForm(f => ({ ...f, [key]: e.target.value }))}>
                      <option value="" style={{ background: '#1a1d2e' }}>Caja General</option>
                      {events.map(ev => <option key={ev.id} value={ev.id} style={{ background: '#1a1d2e' }}>{ev.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Monto (RD$)</label>
                  <input type="number" placeholder="0" style={{ width: '100%', padding: '9px 11px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${amountNum > originBalance && amountNum > 0 ? '#f87171' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', fontSize: '12px', color: '#fff', outline: 'none' }} value={tfForm.amount} onChange={e => setTfForm(f => ({ ...f, amount: e.target.value }))} />
                  {amountNum > originBalance && amountNum > 0 && <p style={{ fontSize: '9px', color: '#f87171', marginTop: '4px', fontWeight: 600 }}>Excede el balance disponible</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Fecha</label>
                  <input type="date" style={{ width: '100%', padding: '9px 11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '12px', color: '#fff', outline: 'none', colorScheme: 'dark' }} value={tfForm.date} onChange={e => setTfForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Descripción</label>
                <input type="text" placeholder="ej. Ganancia del evento a caja general" style={{ width: '100%', padding: '9px 11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '12px', color: '#fff', outline: 'none' }} value={tfForm.description} onChange={e => setTfForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowTransfer(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSaveTransfer} disabled={saving || amountNum > originBalance} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--brand-primary)', fontSize: '13px', fontWeight: 700, color: '#fff', border: 'none', cursor: saving || amountNum > originBalance ? 'not-allowed' : 'pointer', opacity: saving || amountNum > originBalance ? 0.4 : 1, boxShadow: '0 4px 16px color-mix(in srgb, var(--brand-primary) 35%, transparent)' }}>
                  {saving ? 'Procesando...' : 'Transferir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}