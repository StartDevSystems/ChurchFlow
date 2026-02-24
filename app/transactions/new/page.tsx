'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ArrowUpRight, ArrowDownRight, ChevronLeft } from 'lucide-react';

interface Member { id: string; name: string; role: string; }
interface Category { id: string; name: string; type: 'income' | 'expense'; }
interface Event { id: string; name: string; }

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

export default function NewTransactionPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    memberId: '',
    eventId: '',
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [youngMembers, setYoungMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedYoungMembers, setSelectedYoungMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedCategoryName = useMemo(() =>
    categories.find(c => c.id === formData.categoryId)?.name || '', [formData.categoryId, categories]);
  const isDuesCategory = selectedCategoryName.toLowerCase() === 'cuota';
  const availableCategories = useMemo(() =>
    categories.filter(c => c.type === formData.type), [formData.type, categories]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mRes, cRes, eRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/categories'),
          fetch('/api/events', { cache: 'no-store' }),
        ]);
        if (mRes.ok) {
          const d: Member[] = await mRes.json();
          setMembers(d);
          setYoungMembers(d.filter(m => m.role === 'Joven'));
        }
        if (cRes.ok) setCategories(await cRes.json());
        if (eRes.ok) setEvents(await eRes.json());
      } catch (e: any) {
        toast({ title: 'Error al cargar datos', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'type' ? { categoryId: '' } : {}) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast({ title: 'Selecciona una categoría', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      if (isDuesCategory) {
        if (selectedYoungMembers.length === 0) {
          toast({ title: 'Selecciona al menos un joven', variant: 'destructive' });
          setSaving(false); return;
        }
        await Promise.all(selectedYoungMembers.map(memberId =>
          fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: formData.type, categoryId: formData.categoryId,
              amount: parseFloat(formData.amount), date: new Date(formData.date),
              description: formData.description, memberId,
              eventId: formData.eventId === 'none' ? null : formData.eventId || null,
            }),
          }).then(r => { if (!r.ok) throw new Error('Error al crear cuota'); })
        ));
        toast({ title: 'Cuotas registradas' });
      } else {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount),
            date: new Date(formData.date),
            memberId: formData.memberId === 'none' ? null : formData.memberId || null,
            eventId: formData.eventId === 'none' ? null : formData.eventId || null,
          }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        toast({ title: 'Transacción creada' });
      }
      router.push('/transactions');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const amountNum = parseFloat(formData.amount) || 0;
  const isIncome = formData.type === 'income';

  return (
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease both; }

        .grid-bg {
          background-image: linear-gradient(color-mix(in srgb, var(--brand-primary) 5%, transparent) 1px, transparent 1px),
                            linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 5%, transparent) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .label-brand {
          color: color-mix(in srgb, var(--brand-primary) 80%, transparent);
        }
        .select-all-btn {
          color: var(--brand-primary);
        }
        .member-selected {
          background: color-mix(in srgb, var(--brand-primary) 8%, transparent) !important;
          border-color: color-mix(in srgb, var(--brand-primary) 25%, transparent) !important;
        }
        .save-btn-income {
          background: #2a8a5e;
          box-shadow: 0 4px 14px rgba(42,138,94,0.35);
        }
        .save-btn-expense {
          background: #dc3545;
          box-shadow: 0 4px 14px rgba(220,53,69,0.35);
        }
        .save-btn-income:hover { filter: brightness(1.1); }
        .save-btn-expense:hover { filter: brightness(1.1); }
        .toggle-income-active {
          background: #2a8a5e !important;
          color: #fff !important;
          box-shadow: 0 4px 14px rgba(42,138,94,0.4);
        }
        .toggle-expense-active {
          background: #dc3545 !important;
          color: #fff !important;
          box-shadow: 0 4px 14px rgba(220,53,69,0.4);
        }
      `}</style>

      {/* ── Hero oscuro ── */}
      <div style={{
        background: 'linear-gradient(160deg, #0f1117 0%, #1a1d2e 65%, #0f1117 100%)',
        padding: '36px 40px 72px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0 }} />
        {/* Glow dinámico ingreso/gasto — estos van fijos porque son semánticos */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: isIncome ? '15%' : 'auto',
          right: isIncome ? 'auto' : '15%',
          width: '260px', height: '260px', borderRadius: '50%',
          background: isIncome
            ? 'radial-gradient(circle, rgba(42,138,94,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(220,53,69,0.15) 0%, transparent 70%)',
          transition: 'all 0.5s ease',
          pointerEvents: 'none',
        }} />

        <div className="relative z-10">
          <button
            onClick={() => router.push('/transactions')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 700,
              background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px',
              letterSpacing: '0.8px', textTransform: 'uppercase',
            }}
          >
            <ChevronLeft size={13} /> Volver
          </button>

          <p className="label-brand" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px' }}>
            NUEVA TRANSACCIÓN
          </p>
          <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: '24px' }}>
            Registrar Movimiento
          </h1>

          {/* Toggle tipo */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '13px', padding: '4px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '28px',
          }}>
            {(['income', 'expense'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleSelect('type', t)}
                className={formData.type === t ? (t === 'income' ? 'toggle-income-active' : 'toggle-expense-active') : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '9px 22px', borderRadius: '9px',
                  fontSize: '13px', fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.25s',
                  background: 'transparent',
                  color: formData.type === t ? '#fff' : 'rgba(255,255,255,0.35)',
                }}
              >
                {t === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {t === 'income' ? 'Ingreso' : 'Gasto'}
              </button>
            ))}
          </div>

          {/* Monto grande */}
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Monto</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>RD$</span>
              <input
                name="amount" type="number" step="1" placeholder="0"
                value={formData.amount} onChange={handleChange} required
                style={{
                  fontSize: '48px', fontWeight: 900,
                  color: isIncome ? '#4ade80' : '#f87171',
                  background: 'transparent', border: 'none', outline: 'none',
                  width: '100%', letterSpacing: '-0.04em',
                  caretColor: isIncome ? '#4ade80' : '#f87171',
                }}
              />
            </div>
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '1px', marginTop: '6px' }}>
              <div style={{
                height: '100%', borderRadius: '1px',
                background: isIncome ? '#2a8a5e' : '#dc3545',
                width: amountNum > 0 ? '100%' : '0%',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulario ── */}
      <div className="px-4 md:px-8 fade-up" style={{ marginTop: '-36px', paddingBottom: '48px' }}>
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e2d9] dark:border-gray-800 shadow-xl overflow-hidden">
            <div className="p-6 md:p-7 space-y-5">

              {/* Categoría + Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72]">Categoría</Label>
                  <div className="mt-1.5">
                    <Select name="categoryId" onValueChange={v => handleSelect('categoryId', v)} value={formData.categoryId}>
                      <SelectTrigger className="bg-[#f7f4ef] dark:bg-gray-800 border-[#e8e2d9] dark:border-gray-700 rounded-xl">
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.length === 0
                          ? <p className="p-3 text-sm text-[#8c7f72]">Sin categorías disponibles.</p>
                          : availableCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72]">Fecha</Label>
                  <Input
                    name="date" type="date" value={formData.date} onChange={handleChange} required
                    className="mt-1.5 bg-[#f7f4ef] dark:bg-gray-800 border-[#e8e2d9] dark:border-gray-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <Label className="text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72]">Descripción</Label>
                <Textarea
                  name="description" value={formData.description} onChange={handleChange}
                  placeholder="Describe el movimiento..." required rows={2}
                  className="mt-1.5 bg-[#f7f4ef] dark:bg-gray-800 border-[#e8e2d9] dark:border-gray-700 rounded-xl resize-none"
                />
              </div>

              {/* Evento */}
              <div>
                <Label className="text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72]">
                  Evento <span className="normal-case font-normal text-[#8c7f72]">(opcional)</span>
                </Label>
                <div className="mt-1.5">
                  <Select name="eventId" onValueChange={v => handleSelect('eventId', v)} value={formData.eventId || 'none'}>
                    <SelectTrigger className="bg-[#f7f4ef] dark:bg-gray-800 border-[#e8e2d9] dark:border-gray-700 rounded-xl">
                      <SelectValue placeholder="Asociar a un evento..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin evento — Caja General</SelectItem>
                      {events.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {formData.eventId && formData.eventId !== 'none' && (
                  <p className="text-[11px] text-[#0e7490] mt-1.5 font-semibold">
                    Se registrará en el fondo del evento seleccionado
                  </p>
                )}
              </div>

              {/* Cuotas o Miembro */}
              {isDuesCategory ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72]">
                      Jóvenes que aportaron
                    </Label>
                    <button
                      type="button"
                      className="select-all-btn"
                      onClick={() => setSelectedYoungMembers(
                        selectedYoungMembers.length === youngMembers.length ? [] : youngMembers.map(m => m.id)
                      )}
                      style={{ fontSize: '11px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {selectedYoungMembers.length === youngMembers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-3 bg-[#f7f4ef] dark:bg-gray-800 rounded-xl border border-[#e8e2d9] dark:border-gray-700">
                    {youngMembers.length > 0 ? youngMembers.map(m => (
                      <label
                        key={m.id}
                        className={selectedYoungMembers.includes(m.id) ? 'member-selected' : ''}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '7px 10px', borderRadius: '8px', cursor: 'pointer',
                          border: '1px solid transparent', transition: 'all 0.15s',
                        }}
                      >
                        <Checkbox
                          id={`m-${m.id}`}
                          checked={selectedYoungMembers.includes(m.id)}
                          onCheckedChange={c => setSelectedYoungMembers(prev =>
                            c ? [...prev, m.id] : prev.filter(id => id !== m.id)
                          )}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a1714' }} className="dark:text-white">{m.name}</span>
                      </label>
                    )) : <p className="col-span-2 text-sm text-[#8c7f72] p-2">No hay jóvenes registrados.</p>}
                  </div>
                  {selectedYoungMembers.length > 0 && amountNum > 0 && (
                    <div style={{ marginTop: '8px', padding: '9px 14px', borderRadius: '10px', background: 'rgba(42,138,94,0.08)', border: '1px solid rgba(42,138,94,0.2)' }}>
                      <p style={{ fontSize: '11px', color: '#2a8a5e', fontWeight: 700 }}>
                        {selectedYoungMembers.length} transacciones · Total: {fmt(amountNum * selectedYoungMembers.length)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Label className="text-[11px] font-semibold tracking-wider uppercase text-[#8c7f72]">
                    Miembro <span className="normal-case font-normal text-[#8c7f72]">(opcional)</span>
                  </Label>
                  <div className="mt-1.5">
                    <Select name="memberId" onValueChange={v => handleSelect('memberId', v)} value={formData.memberId || 'none'}>
                      <SelectTrigger className="bg-[#f7f4ef] dark:bg-gray-800 border-[#e8e2d9] dark:border-gray-700 rounded-xl">
                        <SelectValue placeholder="Asociar a un miembro..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin miembro</SelectItem>
                        {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Footer — oscuro para continuar el hero, no blanco */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: '#1a1d2e',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <button
                type="button"
                onClick={() => router.push('/transactions')}
                style={{
                  padding: '9px 18px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  fontSize: '13px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.45)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >Cancelar</button>

              <button
                type="submit"
                disabled={saving || loading}
                className={!saving ? (isIncome ? 'save-btn-income' : 'save-btn-expense') : ''}
                style={{
                  padding: '9px 24px', borderRadius: '10px',
                  background: saving ? 'rgba(255,255,255,0.1)' : undefined,
                  color: saving ? 'rgba(255,255,255,0.3)' : '#fff',
                  fontSize: '13px', fontWeight: 700,
                  border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '7px',
                }}
              >
                {saving ? 'Guardando...' : (
                  <>
                    {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    Guardar {isIncome ? 'Ingreso' : 'Gasto'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}