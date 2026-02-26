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
  ChevronLeft, ShieldCheck, CheckCircle2, XCircle, Trash2, MoreVertical, Wifi, WifiOff, Eye, EyeOff, Key, Lock, HelpCircle, PenTool
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [reverting, setReverting] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassReset, setShowPassReset] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [showPassText, setShowPassText] = useState(false);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);

  const [form, setForm] = useState({
    churchName: '', churchSubtitle: '', currencySymbol: 'RD$', logoUrl: '',
    monthlyGoal: '0', primaryColor: DEFAULT_ORANGE, themeMode: 'system',
    reportSignatureName: '', reportFooterText: 'Dios les bendiga.',
    signatureUrl: '',
    allowPublicRegistration: true, generalFundName: 'Caja General',
    lowBalanceAlert: '1000', webhookUrl: '', whatsappMessageTemplate: '',
    calculatorName: 'Calculadora Bendecida',
  });

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

  const handlePassReset = async () => {
    if (newPass.length < 6) { toast({ title: 'Clave muy corta', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editingUser.id, newPassword: newPass }),
      });
      if (res.ok) {
        toast({ title: 'Contraseña Actualizada ✓', variant: 'success' } as any);
        setShowPassReset(false);
        setNewPass('');
      } else {
        toast({ title: 'Error al actualizar', variant: 'destructive' });
      }
    } finally { setSaving(false); }
  };

  const handleRevertSync = async (auditId: string) => {
    toast({
      title: "¿Confirmar reversión?",
      description: "Esta acción borrará permanentemente los datos subidos en este lote.",
      action: (
        <button 
          onClick={async () => {
            setReverting(auditId);
            try {
              const res = await fetch('/api/admin/audit/revert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auditId }),
              });
              if (res.ok) {
                const result = await res.json();
                toast({ 
                  title: 'Operación Deshecha ✓', 
                  description: `Se eliminaron ${result.deletedTx} transacciones y ${result.deletedMem} miembros.`,
                  variant: 'success'
                } as any);
                fetchData();
              } else {
                toast({ title: 'Error al revertir', variant: 'destructive' });
              }
            } finally {
              setReverting(null);
            }
          }}
          className="bg-red-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
        >
          Confirmar
        </button>
      ),
    });
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

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setForm(f => ({ ...f, signatureUrl: reader.result as string })); setUploading(false); };
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
              <Card className="rounded-3xl border-white/5 bg-[#13151f] shadow-2xl overflow-hidden text-white">
                <CardHeader className="bg-white/[0.02] px-6 py-5 border-b border-white/5">
                  <CardTitle className="text-base font-black uppercase italic tracking-tight flex items-center gap-3">
                    <FileText size={18} className="text-orange-500" /> Personalización de Reportes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-8">
                  {/* Firma y Nombre */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Nombre del Firmante</Label>
                      <Input value={form.reportSignatureName} onChange={e => set('reportSignatureName', e.target.value)} placeholder="Ej: Pastor Silverio" className="bg-white/5 border-white/10 rounded-2xl h-14 font-bold text-sm" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest">Firma Digitalizada</Label>
                        <div className="group relative">
                          <HelpCircle size={14} className="text-white/20 cursor-help hover:text-[var(--brand-primary)] transition-colors" />
                          <div className="absolute bottom-full right-0 mb-2 w-64 p-4 bg-black border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                            <p className="text-[9px] font-black uppercase text-[var(--brand-primary)] mb-2">Recomendaciones Pro:</p>
                            <ul className="space-y-1.5">
                              <li className="text-[8px] text-gray-400 font-bold uppercase">• Usa bolígrafo negro grueso</li>
                              <li className="text-[8px] text-gray-400 font-bold uppercase">• Papel blanco sin rayas</li>
                              <li className="text-[8px] text-gray-400 font-bold uppercase">• PNG transparente recomendado</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="relative w-full h-14 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden group/sig hover:border-[var(--brand-primary)]/30 transition-all flex items-center justify-center">
                          {form.signatureUrl ? (
                            <Image src={form.signatureUrl} alt="Firma" fill className="object-contain p-2" unoptimized />
                          ) : (
                            <span className="text-[9px] font-black uppercase text-white/10">Sin Firma</span>
                          )}
                          <input type="file" id="sig-up" className="hidden" accept="image/*" onChange={handleSignatureUpload} />
                          <label htmlFor="sig-up" className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/60 opacity-0 group-hover/sig:opacity-100 transition-opacity">
                            <Upload size={16} className="text-white" />
                          </label>
                        </div>
                        {form.signatureUrl && (
                          <button onClick={() => set('signatureUrl', '')} className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vista Previa Firma Híbrida */}
                  <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center">
                    <p className="text-[8px] font-black text-gray-500 mb-6 tracking-widest uppercase">Vista Previa en Reporte</p>
                    <div className="w-full max-w-[240px] text-center">
                      <div className="h-16 flex items-center justify-center mb-2">
                        {form.signatureUrl ? (
                          <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={form.signatureUrl} alt="Firma" className="max-h-full object-contain" />
                        ) : form.reportSignatureName ? (
                          <p className="text-4xl text-white/60" style={{ fontFamily: "'Great Vibes', cursive" }}>{form.reportSignatureName}</p>
                        ) : (
                          <div className="w-20 h-px bg-white/10" />
                        )}
                      </div>
                      <div className="h-px w-full bg-white/20 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{form.reportSignatureName || 'NOMBRE RESPONSABLE'}</p>
                      <p className="text-[8px] font-bold uppercase text-gray-600">Firma Autorizada</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-black text-[10px] uppercase text-white/30 tracking-widest ml-1">Pie de Página (Mensaje u Oración)</Label>
                    <textarea className="stta h-24" value={form.reportFooterText} onChange={e => set('reportFooterText', e.target.value)} placeholder="Ej: Dios bendiga a los dadores alegres..." />
                  </div>
                </CardContent>
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
                <CardHeader className="bg-white/[0.02] px-6 py-6 border-b border-white/5">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <CardTitle className="text-base font-black uppercase italic tracking-tight">Equipo de Trabajo</CardTitle>
                    <div className={cn(
                      "flex items-center gap-4 px-5 py-2.5 rounded-2xl border transition-all duration-500",
                      form.allowPublicRegistration ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                    )}>
                      <div className="flex flex-col">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Registro Público</Label>
                        <span className={cn("text-[8px] font-bold uppercase mt-1", form.allowPublicRegistration ? "text-green-400" : "text-red-400")}>
                          {form.allowPublicRegistration ? 'Puerta Abierta' : 'Puerta Cerrada'}
                        </span>
                      </div>
                      <button 
                        onClick={() => set('allowPublicRegistration', !form.allowPublicRegistration)} 
                        className={cn(
                          "w-14 h-7 rounded-full relative transition-all shadow-inner border-2", 
                          form.allowPublicRegistration ? "bg-green-500 border-green-400" : "bg-red-500 border-red-400"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-lg", 
                          form.allowPublicRegistration ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>
                </CardHeader>
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
                    <div className="space-y-3">
                      <button 
                        onClick={() => toggleUserRole(editingUser.id, editingUser.role)} 
                        disabled={editingUser.id === session?.user?.id} 
                        className={cn(
                          "w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2", 
                          editingUser.role === 'ADMIN' ? "bg-purple-600/10 border-purple-600/30 text-purple-400" : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                        )}
                      >
                        {editingUser.role === 'ADMIN' ? 'ES ADMINISTRADOR' : 'CONVERTIR EN ADMIN'}
                      </button>
                      
                      <button 
                        onClick={() => setShowPassReset(true)} 
                        className="w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-blue-600/10 text-blue-400 border-2 border-blue-600/30 flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white"
                      >
                        <Key size={14} /> Resetear Seguridad
                      </button>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/5">
                      <button 
                        onClick={() => deleteUser(editingUser.id)} 
                        disabled={editingUser.id === session?.user?.id} 
                        className="w-full py-2 text-[9px] font-black uppercase text-red-500/40 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={12} /> Eliminar Cuenta
                      </button>
                    </div>
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
                    <CardTitle className="text-base font-black uppercase italic tracking-tight">Centro de Auditoría</CardTitle>
                    <button 
                      onClick={toggleOfflineSimulation}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                        isSimulatingOffline ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-gray-500 hover:text-white"
                      )}
                    >
                      {isSimulatingOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
                      {isSimulatingOffline ? 'MODO OFFLINE' : 'MODO NORMAL'}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="p-6 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Historial de Operaciones</p>
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Máquina del Tiempo v1.0</span>
                    </div>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
                      {auditLogs.map(log => {
                        const isSync = log.action === 'SYNC';
                        return (
                          <div key={log.id} className="group relative bg-white/[0.02] border border-white/5 p-4 rounded-2xl transition-all hover:border-white/10 hover:bg-white/[0.04]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-bold text-white/30 uppercase">{format(new Date(log.createdAt), 'dd MMM, HH:mm', { locale: es })}</span>
                                  <span className={cn(
                                    "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                                    isSync ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white/40"
                                  )}>
                                    {log.action}
                                  </span>
                                </div>
                                <p className="text-[11px] font-black text-white uppercase italic leading-tight mb-1">{log.details}</p>
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Ejecutado por: {log.userEmail.split('@')[0]}</p>
                              </div>
                              
                              {isSync && (
                                <button 
                                  onClick={() => handleRevertSync(log.id)}
                                  disabled={reverting === log.id}
                                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest disabled:opacity-50"
                                >
                                  {reverting === log.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                  Deshacer Carga
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {auditLogs.length === 0 && <p className="text-xs text-white/20 text-center py-10 uppercase font-black italic">Sin movimientos registrados</p>}
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

      <AnimatePresence>
          {showPassReset && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setShowPassReset(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#13151f] border-2 border-white/10 rounded-[3rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden text-white" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500" />
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-inner">
                    <Lock size={24} />
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Resetear <span className="text-blue-400">Clave</span></h3>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Usuario: {editingUser.email.split('@')[0]}</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input 
                        type={showPassText ? 'text' : 'password'} 
                        value={newPass} 
                        onChange={e => setNewPass(e.target.value)} 
                        placeholder="Mínimo 6 caracteres" 
                        className="bg-white/5 border-2 border-white/5 p-6 pr-14 rounded-2xl font-bold text-sm" 
                      />
                      <button onClick={() => setShowPassText(!showPassText)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">{showPassText ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                  <Button onClick={handlePassReset} disabled={saving} className="w-full py-6 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3">{saving ? <Loader2 className="animate-spin" /> : <Save size={16} />} Actualizar Ahora</Button>
                  <button onClick={() => setShowPassReset(false)} className="w-full py-2 text-[9px] font-black uppercase text-gray-500 hover:text-white transition-colors">Cancelar</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
