"use client";

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/use-toast';
import {
  Home, DollarSign, Save, Loader2, Upload,
  Users, Palette, FileText, Shield, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Tab = 'general' | 'visual' | 'users' | 'reports' | 'finance' | 'notifications' | 'security';

const DEFAULT_ORANGE = '#e85d26';

const TABS = [
  { id: 'general',       label: 'General',   icon: Home },
  { id: 'visual',        label: 'Estilo',    icon: Palette },
  { id: 'users',         label: 'Equipo',    icon: Users },
  { id: 'reports',       label: 'Reportes',  icon: FileText },
  { id: 'finance',       label: 'Finanzas',  icon: DollarSign },
  { id: 'notifications', label: 'Alertas',   icon: Bell },
  { id: 'security',      label: 'Auditoría', icon: Shield },
] as const;

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [form, setForm] = useState({
    churchName: '', churchSubtitle: '', currencySymbol: 'RD$', logoUrl: '',
    monthlyGoal: '0', primaryColor: DEFAULT_ORANGE, themeMode: 'system',
    reportSignatureName: '', reportFooterText: 'Dios les bendiga.',
    allowPublicRegistration: true, generalFundName: 'Caja General',
    lowBalanceAlert: '1000', webhookUrl: '', whatsappMessageTemplate: '',
    calculatorName: 'Calculadora Bendecida',
  });

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') router.push('/');
  }, [session, status, router]);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, uRes, aRes] = await Promise.all([
        fetch('/api/settings'), fetch('/api/users'), fetch('/api/admin/audit'),
      ]);
      if (sRes.ok) { const d = await sRes.json(); setForm(f => ({ ...f, ...d, primaryColor: d.primaryColor || DEFAULT_ORANGE })); }
      if (uRes.ok) setUsers(await uRes.json());
      if (aRes.ok) setAuditLogs(await aRes.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === 'authenticated') fetchData(); }, [status, fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: 'Ajustes Guardados ✓', variant: 'success' } as any);
        document.documentElement.style.setProperty('--brand-primary', form.primaryColor);
      }
    } finally { setSaving(false); }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setForm(f => ({ ...f, logoUrl: reader.result as string })); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const set = (key: keyof typeof form, val: any) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0c14]">
      <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c14] -mx-4 md:-mx-8 -mt-4 md:-mt-8">
      <style>{`
        /* ocultar scrollbar del sidebar en móvil */
        .tabs-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .tabs-scroll::-webkit-scrollbar { display: none; }
        .tab-item { transition: all 0.2s; }
        .tab-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .tab-active { background: var(--brand-primary) !important; color: #fff !important; box-shadow: 0 4px 16px color-mix(in srgb,var(--brand-primary) 35%,transparent); }
        .stta { width:100%; padding:14px 16px; border-radius:16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; font-weight:700; font-size:13px; outline:none; resize:vertical; transition:border-color 0.2s; font-family:inherit; }
        .stta:focus { border-color:var(--brand-primary); }
        .audit-row:hover { background:rgba(255,255,255,0.02); }
        /* color picker cross-browser */
        input[type="color"] { -webkit-appearance:none; padding:0; border:none; cursor:pointer; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding:0; }
        input[type="color"]::-webkit-color-swatch { border:none; border-radius:16px; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-28">

        {/* ── Header ── */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
            Control <span style={{ color: 'var(--brand-primary)' }}>Master</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/25">Configuración Pro</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-56 shrink-0">

            {/* Móvil: chips horizontales con scroll */}
            <div className="tabs-scroll flex lg:hidden gap-2 overflow-x-auto pb-2">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as Tab)}
                  className={cn('tab-item tab-chip flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-none shrink-0 cursor-pointer',
                    activeTab === t.id ? 'tab-active' : 'bg-white/[0.04] text-white/40'
                  )}
                  style={{ minWidth: '56px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Desktop: columna */}
            <div className="hidden lg:flex flex-col gap-1.5">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as Tab)}
                  className={cn(
                    'tab-item flex items-center gap-3 px-5 py-3.5 rounded-2xl border-none cursor-pointer text-left',
                    'text-[10px] font-black uppercase tracking-widest',
                    activeTab === t.id ? 'tab-active translate-x-1' : 'bg-transparent text-white/40'
                  )}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-6 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest cursor-pointer border-none disabled:opacity-50 transition-opacity"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar
              </button>
            </div>
          </aside>

          {/* ── Panel de contenido ── */}
          <div className="flex-1 min-w-0 w-full">

            {/* ── GENERAL ── */}
            {activeTab === 'general' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5">
                  <CardTitle className="text-base font-black uppercase italic tracking-tight">Identidad de la Organización</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-7 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Nombre</Label>
                      <Input value={form.churchName} onChange={e => set('churchName', e.target.value)}
                        className="bg-white/5 border-white/10 rounded-2xl h-13 font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Subtítulo</Label>
                      <Input value={form.churchSubtitle} onChange={e => set('churchSubtitle', e.target.value)}
                        className="bg-white/5 border-white/10 rounded-2xl h-13 font-bold text-sm" />
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="flex flex-wrap items-center gap-5 p-5 border-2 border-dashed border-white/8 rounded-2xl bg-white/[0.01]">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 bg-white/5 flex items-center justify-center">
                      {form.logoUrl
                        ? <Image src={form.logoUrl} alt="Logo" fill className="object-cover" unoptimized />
                        : <span className="text-white/20 text-xs font-bold">LOGO</span>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-2">Logo de la organización</p>
                      <input type="file" id="logo-up" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      <label htmlFor="logo-up"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/70 text-xs font-bold cursor-pointer hover:bg-white/14 transition-colors">
                        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        {uploading ? 'Subiendo...' : 'Cambiar Logo'}
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── VISUAL ── */}
            {activeTab === 'visual' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5">
                  <CardTitle className="text-base font-black uppercase italic tracking-tight">Estilo Visual</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-7 space-y-7">
                  <div className="space-y-4">
                    <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Color Principal</Label>
                    <div className="flex items-center gap-5 flex-wrap">
                      <input
                        type="color"
                        value={form.primaryColor}
                        onChange={e => set('primaryColor', e.target.value)}
                        style={{ width: '68px', height: '68px', borderRadius: '18px' }}
                      />
                      <div>
                        <p style={{ fontSize: '22px', fontWeight: 900, color: form.primaryColor, letterSpacing: '-0.03em', marginBottom: '4px' }}>
                          {form.primaryColor.toUpperCase()}
                        </p>
                        <p className="text-xs text-white/25 mb-3">Se aplica en toda la app al guardar</p>
                        <button
                          onClick={() => set('primaryColor', DEFAULT_ORANGE)}
                          className="text-[10px] font-bold text-white/30 bg-transparent border border-white/10 px-3 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer hover:text-white/50 transition-colors"
                        >
                          Resetear
                        </button>
                      </div>
                    </div>
                    {/* Live preview */}
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex gap-3 flex-wrap items-center mt-1">
                      <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest w-full">Vista previa</span>
                      <span style={{ background: form.primaryColor }} className="px-4 py-2 rounded-lg text-white text-xs font-bold">Botón</span>
                      <span style={{ border: `1px solid ${form.primaryColor}`, color: form.primaryColor }} className="px-4 py-2 rounded-lg text-xs font-bold">Outline</span>
                      <span style={{ background: form.primaryColor, boxShadow: `0 0 8px ${form.primaryColor}` }} className="w-2.5 h-2.5 rounded-full inline-block" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Nombre Calculadora</Label>
                    <Input value={form.calculatorName} onChange={e => set('calculatorName', e.target.value)}
                      className="bg-white/5 border-white/10 rounded-2xl font-bold text-sm" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── FINANCE ── */}
            {activeTab === 'finance' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5">
                  <CardTitle className="text-base font-black uppercase italic tracking-tight">Configuración Financiera</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-7">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { label: 'Nombre Caja General', key: 'generalFundName' },
                      { label: 'Símbolo Divisa', key: 'currencySymbol' },
                      { label: 'Meta Mensual', key: 'monthlyGoal', type: 'number' },
                      { label: 'Alerta Saldo Bajo', key: 'lowBalanceAlert', type: 'number' },
                    ].map(({ label, key, type }) => (
                      <div key={key} className="space-y-2">
                        <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">{label}</Label>
                        <Input type={type || 'text'} value={(form as any)[key]} onChange={e => set(key as any, e.target.value)}
                          className="bg-white/5 border-white/10 rounded-2xl font-bold text-sm" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── REPORTS ── */}
            {activeTab === 'reports' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5">
                  <CardTitle className="text-base font-black uppercase italic tracking-tight">Configuración de Reportes</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-7 space-y-5">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Firma / Nombre Responsable</Label>
                    <Input value={form.reportSignatureName} onChange={e => set('reportSignatureName', e.target.value)}
                      placeholder="Ej: Pastor Juan Pérez"
                      className="bg-white/5 border-white/10 rounded-2xl font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Pie de Página</Label>
                    <textarea className="stta" rows={4}
                      value={form.reportFooterText}
                      onChange={e => set('reportFooterText', e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5">
                  <CardTitle className="text-base font-black uppercase italic tracking-tight">Alertas y Notificaciones</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-7 space-y-5">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Plantilla WhatsApp</Label>
                    <textarea className="stta" rows={5}
                      value={form.whatsappMessageTemplate}
                      onChange={e => set('whatsappMessageTemplate', e.target.value)}
                      placeholder="Hola {nombre}, tu cuota de {monto} está pendiente..." />
                    <p className="text-[10px] text-white/20 ml-1">Variables: {'{nombre}'} {'{monto}'} {'{fecha}'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Webhook URL</Label>
                    <Input value={form.webhookUrl} onChange={e => set('webhookUrl', e.target.value)}
                      placeholder="https://..." className="bg-white/5 border-white/10 rounded-2xl font-bold text-sm" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── USERS ── */}
            {activeTab === 'users' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5">
                  <CardTitle className="text-base font-black uppercase italic tracking-tight">Equipo</CardTitle>
                </CardHeader>
                <div className="divide-y divide-white/5">
                  {users.length === 0 && (
                    <p className="text-sm text-white/20 text-center py-10">No hay usuarios registrados</p>
                  )}
                  {users.map(u => (
                    <div key={u.id} className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                        {u.image
                          ? <Image src={u.image} alt="U" fill className="object-cover" unoptimized />
                          : <span className="text-base font-black text-white/30">{u.email[0].toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-white truncate">{u.firstName || u.email}</p>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{u.role}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
                        <span className="text-[9px] text-white/20 uppercase tracking-wider hidden sm:block">Activo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── SECURITY / AUDIT ── */}
            {activeTab === 'security' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5">
                  <CardTitle className="text-base font-black uppercase italic tracking-tight">Registro de Auditoría</CardTitle>
                </CardHeader>
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-white/20 text-center py-10">No hay registros aún</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {auditLogs.map(log => (
                      <div key={log.id} className="audit-row flex flex-wrap gap-x-4 gap-y-1 px-5 sm:px-6 py-3.5 transition-colors">
                        <span className="text-[10px] font-bold text-white/30 shrink-0 w-full sm:w-auto">
                          {format(new Date(log.createdAt), 'dd/MM/yy HH:mm', { locale: es })}
                        </span>
                        <span className="text-xs font-black text-white shrink-0">{log.userEmail}</span>
                        <span className="text-xs text-white/40 italic flex-1 min-w-0 truncate sm:whitespace-normal sm:overflow-visible">{log.details}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* ── FAB Guardar — solo móvil ── */}
      <div className="lg:hidden fixed bottom-6 right-5 z-50">
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: 'var(--brand-primary)', boxShadow: '0 8px 24px color-mix(in srgb, var(--brand-primary) 40%, transparent)' }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center border-none text-white active:scale-90 transition-transform disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
        </button>
      </div>
    </div>
  );
}