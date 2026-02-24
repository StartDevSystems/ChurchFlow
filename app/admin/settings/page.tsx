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
  ChevronLeft, ShieldCheck, CheckCircle2, XCircle, Trash2, MoreVertical, Wifi, WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Tab = 'general' | 'visual' | 'users' | 'reports' | 'finance' | 'notifications' | 'security';

const DEFAULT_ORANGE = '#e85d26';

const PERMISSION_LABELS: Record<string, string> = {
  view_members: 'Miembros', view_transactions: 'Transacciones', view_reports: 'Reportes',
  view_stats: 'Estadísticas', view_dues: 'Cuotas', view_events: 'Eventos',
  manage_categories: 'Categorías', manage_settings: 'Ajustes'
};

const TABS = [
  { id: 'general',       label: 'General',   icon: Home },
  { id: 'visual',        label: 'Estilo',    icon: Palette },
  { id: 'users',         label: 'Equipo',    icon: Users },
  { id: 'reports',       label: 'Reportes',  icon: FileText },
  { id: 'finance',       label: 'Finanzas',  icon: DollarSign },
  { id: 'notifications', label: 'Alertas',   icon: Bell },
  { id: 'security',      label: 'Seguridad', icon: Shield },
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
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);

  useEffect(() => {
    setIsSimulatingOffline(localStorage.getItem('simulate-offline') === 'true');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, uRes, aRes] = await Promise.all([
        fetch('/api/settings'), fetch('/api/users'), fetch('/api/admin/audit'),
      ]);
      if (sRes.ok) { 
        const d = await sRes.json(); 
        setForm(f => ({ ...f, ...d, primaryColor: d.primaryColor || DEFAULT_ORANGE })); 
      }
      if (uRes.ok) setUsers(await uRes.json());
      if (aRes.ok) setAuditLogs(await aRes.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === 'authenticated') fetchData(); }, [status, fetchData]);

  const [form, setForm] = useState({
    churchName: '', churchSubtitle: '', currencySymbol: 'RD$', logoUrl: '',
    monthlyGoal: '0', primaryColor: DEFAULT_ORANGE, themeMode: 'system',
    reportSignatureName: '', reportFooterText: 'Dios les bendiga.',
    allowPublicRegistration: true, generalFundName: 'Caja General',
    lowBalanceAlert: '1000', webhookUrl: '', whatsappMessageTemplate: '',
    calculatorName: 'Calculadora Bendecida',
  });

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

  const toggleOfflineSimulation = () => {
    const newValue = !isSimulatingOffline;
    setIsSimulatingOffline(newValue);
    localStorage.setItem('simulate-offline', newValue.toString());
    window.dispatchEvent(new Event('storage'));
    toast({ 
      title: newValue ? 'Simulación Offline Activa 📡❌' : 'Modo Online Restaurado 📡✅',
      variant: newValue ? 'destructive' : 'success'
    } as any);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setForm(f => ({ ...f, logoUrl: reader.result as string })); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const updateUserInDB = async (userId: string, data: any) => {
    const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, ...data }) });
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, ...data } : u));
      if (editingUser?.id === userId) setEditingUser({ ...editingUser, ...data });
      toast({ title: 'Usuario actualizado ✓' });
    }
  };

  const toggleUserRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    await updateUserInDB(id, { role: newRole });
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Borrar este usuario permanentemente?')) return;
    const res = await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { setUsers(users.filter(u => u.id !== id)); setEditingUser(null); toast({ title: 'Usuario eliminado' }); }
  };

  const set = (key: keyof typeof form, val: any) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#0a0c14]"><Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0c14] -mx-4 md:-mx-8 -mt-4 md:-mt-8">
      <style>{`
        .tabs-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .tabs-scroll::-webkit-scrollbar { display: none; }
        .tab-item { transition: all 0.2s; }
        .tab-active { background: var(--brand-primary) !important; color: #fff !important; }
        .stta { width:100%; padding:14px 16px; border-radius:16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; font-weight:700; font-size:13px; outline:none; resize:vertical; transition:border-color 0.2s; font-family:inherit; }
        .stta:focus { border-color:var(--brand-primary); }
        input[type="color"] { -webkit-appearance:none; padding:0; border:none; cursor:pointer; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding:0; }
        input[type="color"]::-webkit-color-swatch { border:none; border-radius:16px; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-28 text-white">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter leading-none mb-2 pt-10">Control <span style={{ color: 'var(--brand-primary)' }}>Master</span></h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/25">Configuración Pro</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-56 shrink-0">
            <div className="tabs-scroll flex lg:hidden gap-2 overflow-x-auto pb-2">
              {TABS.map(t => (<button key={t.id} onClick={() => { setActiveTab(t.id as Tab); setEditingUser(null); }} className={cn('tab-item flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-none shrink-0', activeTab === t.id ? 'tab-active shadow-lg' : 'bg-white/[0.04] text-white/40')} style={{ minWidth: '56px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}><t.icon size={16} />{t.label}</button>))}
            </div>
            <div className="hidden lg:flex flex-col gap-1.5">
              {TABS.map(t => (<button key={t.id} onClick={() => { setActiveTab(t.id as Tab); setEditingUser(null); }} className={cn('tab-item flex items-center gap-3 px-5 py-3.5 rounded-2xl border-none cursor-pointer text-[10px] font-black uppercase tracking-widest', activeTab === t.id ? 'tab-active translate-x-1' : 'bg-transparent text-white/40')}><t.icon size={13} />{t.label}</button>))}
              <button onClick={handleSave} disabled={saving} className="mt-6 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest cursor-pointer border-none disabled:opacity-50 transition-all">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Guardar Cambios</button>
            </div>
          </aside>

          <div className="flex-1 min-w-0 w-full">
            {activeTab === 'general' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5"><CardTitle className="text-base font-black uppercase italic tracking-tight">Identidad</CardTitle></CardHeader>
                <CardContent className="p-5 sm:p-7 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2"><Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Nombre</Label><Input value={form.churchName} onChange={e => set('churchName', e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-13 font-bold text-sm" /></div>
                    <div className="space-y-2"><Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Subtítulo</Label><Input value={form.churchSubtitle} onChange={e => set('churchSubtitle', e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-13 font-bold text-sm" /></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-5 p-5 border-2 border-dashed border-white/8 rounded-2xl bg-white/[0.01]">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 bg-white/5 flex items-center justify-center">{form.logoUrl ? <Image src={form.logoUrl} alt="Logo" fill className="object-cover" unoptimized /> : <span className="text-white/20 text-xs font-bold">LOGO</span>}</div>
                    <div><p className="text-sm font-bold text-white mb-2">Logo oficial</p><input type="file" id="logo-up" className="hidden" accept="image/*" onChange={handleLogoUpload} /><label htmlFor="logo-up" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/70 text-xs font-bold cursor-pointer hover:bg-white/14 transition-colors">{uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}{uploading ? 'Subiendo...' : 'Cambiar Logo'}</label></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'visual' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5"><CardTitle className="text-base font-black uppercase italic tracking-tight">Estilo Visual</CardTitle></CardHeader>
                <CardContent className="p-5 sm:p-7 space-y-7">
                  <div className="space-y-4">
                    <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Color Principal</Label>
                    <div className="flex items-center gap-5 flex-wrap">
                      <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ width: '68px', height: '68px', borderRadius: '18px' }} />
                      <div><p style={{ fontSize: '22px', fontWeight: 900, color: form.primaryColor, letterSpacing: '-0.03em', marginBottom: '4px' }}>{form.primaryColor.toUpperCase()}</p><button onClick={() => set('primaryColor', DEFAULT_ORANGE)} className="text-[10px] font-bold text-white/30 bg-transparent border border-white/10 px-3 py-1.5 rounded-lg uppercase cursor-pointer">Resetear</button></div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Nombre Calculadora</Label>
                    <Input value={form.calculatorName} onChange={e => set('calculatorName', e.target.value)} className="bg-white/5 border-white/10 rounded-2xl font-bold text-sm" />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'finance' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5"><CardTitle className="text-base font-black uppercase italic tracking-tight">Finanzas</CardTitle></CardHeader>
                <CardContent className="p-5 sm:p-7"><div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{[{ label: 'Caja General', key: 'generalFundName' }, { label: 'Divisa', key: 'currencySymbol' }, { label: 'Meta Mensual', key: 'monthlyGoal', type: 'number' }, { label: 'Alerta Saldo Bajo', key: 'lowBalanceAlert', type: 'number' }].map(({ label, key, type }) => (<div key={key} className="space-y-2"><Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">{label}</Label><Input type={type || 'text'} value={(form as any)[key]} onChange={e => set(key as any, e.target.value)} className="bg-white/5 border-white/10 rounded-2xl font-bold text-sm" /></div>))}</div></CardContent>
              </Card>
            )}

            {activeTab === 'reports' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5"><CardTitle className="text-base font-black uppercase italic tracking-tight">Reportes</CardTitle></CardHeader>
                <CardContent className="p-5 sm:p-7 space-y-5"><div className="space-y-2"><Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Firma Responsable</Label><Input value={form.reportSignatureName} onChange={e => set('reportSignatureName', e.target.value)} placeholder="Ej: Pastor Juan Pérez" className="bg-white/5 border-white/10 rounded-2xl font-bold text-sm" /></div><div className="space-y-2"><Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Pie de Página</Label><textarea className="stta" rows={4} value={form.reportFooterText} onChange={e => set('reportFooterText', e.target.value)} /></div></CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5"><CardTitle className="text-base font-black uppercase italic tracking-tight">Alertas</CardTitle></CardHeader>
                <CardContent className="p-5 sm:p-7 space-y-5"><div className="space-y-2"><Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Plantilla WhatsApp</Label><textarea className="stta" rows={5} value={form.whatsappMessageTemplate} onChange={e => set('whatsappMessageTemplate', e.target.value)} placeholder="Hola {nombre}..." /><p className="text-[10px] text-white/20 ml-1">Variables: {'{nombre}'} {'{monto}'} {'{fecha}'}</p></div><div className="space-y-2"><Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Webhook URL</Label><Input value={form.webhookUrl} onChange={e => set('webhookUrl', e.target.value)} placeholder="https://..." className="bg-white/5 border-white/10 rounded-2xl font-bold text-sm" /></div></CardContent>
              </Card>
            )}

            {activeTab === 'users' && !editingUser && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl overflow-hidden animate-in fade-in duration-300">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5"><div className="flex justify-between items-center"><CardTitle className="text-base font-black uppercase italic tracking-tight">Equipo</CardTitle><div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10"><Label className="text-[8px] font-black uppercase tracking-tighter">Registro Público</Label><button onClick={() => set('allowPublicRegistration', !form.allowPublicRegistration)} className={cn("w-10 h-5 rounded-full relative transition-all", form.allowPublicRegistration ? "bg-green-500" : "bg-red-500")}><div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", form.allowPublicRegistration ? "right-1" : "left-1")} /></button></div></div></CardHeader>
                <div className="divide-y divide-white/5">{users.map(u => (<div key={u.id} onClick={() => setEditingUser(u)} className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"><div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">{u.image ? <Image src={u.image} alt="U" fill className="object-cover" unoptimized /> : <span className="text-base font-black text-white/30">{u.email[0].toUpperCase()}</span>}</div><div className="flex-1 min-w-0"><p className="font-black text-sm text-white truncate uppercase">{u.firstName || u.email.split('@')[0]}</p><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{u.role}</p></div><MoreVertical className="h-4 w-4 text-white/20 group-hover:text-white" /></div>))}</div>
              </Card>
            )}

            {activeTab === 'users' && editingUser && (
              <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
                <button onClick={() => setEditingUser(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"><ChevronLeft size={14} /> Volver</button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="rounded-[2.5rem] border-2 border-[var(--brand-primary)] p-8 text-center bg-[#13151f] shadow-2xl">
                    <div className="relative w-24 h-24 mx-auto mb-6 group"><div className="w-full h-full rounded-2xl overflow-hidden border-2 border-white/10 relative">{editingUser.image ? <Image src={editingUser.image} alt="U" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-white/5 text-2xl font-black">{editingUser.email[0].toUpperCase()}</div>}</div></div>
                    <h3 className="font-black uppercase text-white mb-4 truncate text-sm">{editingUser.email}</h3>
                    <button onClick={() => toggleUserRole(editingUser.id, editingUser.role)} disabled={editingUser.id === session?.user?.id} className={cn("w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all", editingUser.role === 'ADMIN' ? "bg-purple-600" : "bg-white/5 text-white/40 border border-white/10")}>{editingUser.role === 'ADMIN' ? 'ES ADMINISTRADOR' : 'CONVERTIR EN ADMIN'}</button>
                    <button onClick={() => deleteUser(editingUser.id)} disabled={editingUser.id === session?.user?.id} className="w-full mt-4 text-[9px] font-black uppercase text-red-500 hover:text-red-400 transition-colors opacity-50">Eliminar Cuenta</button>
                  </Card>
                  <Card className="md:col-span-2 rounded-[2.5rem] border-white/5 bg-[#13151f] shadow-2xl overflow-hidden h-fit">
                    <CardHeader className="bg-white/[0.02] p-6 border-b border-white/5"><CardTitle className="text-sm font-black uppercase italic flex items-center gap-3 text-green-500"><ShieldCheck size={18} /> Permisos</CardTitle></CardHeader>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">{Object.keys(PERMISSION_LABELS).map((key) => { const isActive = editingUser.permissions?.[key]; return (<button key={key} onClick={() => { const newPerms = { ...(editingUser.permissions || {}), [key]: !isActive }; updateUserInDB(editingUser.id, { permissions: newPerms }); }} className={cn("flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left", isActive ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-transparent border-white/5 text-white/30 hover:border-white/10")}><span className="font-black text-[9px] uppercase tracking-widest">{PERMISSION_LABELS[key]}</span>{isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} className="opacity-20" />}</button>); })}</div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-black uppercase italic tracking-tight">Control de Red</CardTitle>
                    <button 
                      onClick={toggleOfflineSimulation}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                        isSimulatingOffline ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-gray-500 hover:text-white"
                      )}
                    >
                      {isSimulatingOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
                      {isSimulatingOffline ? 'SIMULANDO OFFLINE' : 'MODO NORMAL'}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="p-6 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] mb-8">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Registro de Auditoría</p>
                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto no-scrollbar">
                      {auditLogs.map(log => (
                        <div key={log.id} className="audit-row flex flex-wrap gap-x-4 gap-y-1 py-3.5 transition-colors">
                          <span className="text-[10px] font-bold text-white/30 shrink-0 w-full sm:w-auto">{format(new Date(log.createdAt), 'dd/MM/yy HH:mm', { locale: es })}</span>
                          <span className="text-xs font-black text-white shrink-0 uppercase italic">{log.userEmail.split('@')[0]}</span>
                          <span className="text-xs text-white/40 italic flex-1 min-w-0 truncate sm:whitespace-normal uppercase">{log.details}</span>
                        </div>
                      ))}
                      {auditLogs.length === 0 && <p className="text-xs text-white/20 text-center py-10 uppercase font-black italic">Sin registros aún</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-6 right-5 z-50">
        <button onClick={handleSave} disabled={saving} style={{ background: 'var(--brand-primary)', boxShadow: '0 8px 24px color-mix(in srgb, var(--brand-primary) 40%, transparent)' }} className="w-14 h-14 rounded-2xl flex items-center justify-center border-none text-white active:scale-90 transition-transform disabled:opacity-50 cursor-pointer">{saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}</button>
      </div>
    </div>
  );
}
