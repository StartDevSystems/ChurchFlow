"use client";

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Home, DollarSign, Image as ImageIcon, Save, Loader2, Upload, Trash, 
  Users, Palette, FileText, Shield, Bell, CheckCircle2, XCircle, Key, Lock, RotateCcw,
  User as UserIcon, MoreVertical, ShieldCheck, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Tab = 'general' | 'visual' | 'users' | 'reports' | 'finance' | 'notifications' | 'security';

const PERMISSION_LABELS: Record<string, string> = {
  view_members: 'Miembros', view_transactions: 'Transacciones', view_reports: 'Reportes',
  view_stats: 'Estadísticas', view_dues: 'Cuotas', view_events: 'Eventos',
  manage_categories: 'Categorías', manage_settings: 'Ajustes'
};

const DEFAULT_ORANGE = '#e85d26';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newPassword, setNewPass] = useState('');
  
  const [form, setForm] = useState({
    churchName: '', churchSubtitle: '', currencySymbol: 'RD$', logoUrl: '',
    monthlyGoal: '0', primaryColor: DEFAULT_ORANGE, themeMode: 'system',
    reportSignatureName: '', reportFooterText: 'Dios les bendiga.',
    allowPublicRegistration: true, generalFundName: 'Caja General',
    lowBalanceAlert: '1000', webhookUrl: '', whatsappMessageTemplate: '',
    calculatorName: 'Calculadora Bendecida'
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [session, status, router]);

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, usersRes, auditRes] = await Promise.all([
        fetch('/api/settings'), fetch('/api/users'), fetch('/api/admin/audit')
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setForm({ ...data, primaryColor: data.primaryColor || DEFAULT_ORANGE });
      }
      if (usersRes.ok) setUsers(await usersRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
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
        toast({ title: 'Ajustes Guardados ✓', variant: 'success' });
        document.documentElement.style.setProperty('--brand-primary', form.primaryColor);
      } else {
        toast({ title: 'Error al guardar', variant: 'destructive' });
      }
    } finally { setSaving(false); }
  };

  const updateUserInDB = async (userId: string, data: any) => {
    const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, ...data }) });
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, ...data } : u));
      toast({ title: 'Usuario actualizado' });
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-32 px-4 md:px-6">
      <div className="mb-10 pt-10 text-center lg:text-left">
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">Control <span className="text-[var(--brand-primary)]">Master</span></h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Configuración Central del Sistema</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Navegación - Scroll Horizontal en móvil */}
        <aside className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-6 lg:pb-0 no-scrollbar sticky top-0 z-30 bg-[#0a0c14]/90 backdrop-blur-xl py-4 border-b border-white/5 lg:border-none lg:bg-transparent">
          {[
            { id: 'general', label: 'General', icon: Home },
            { id: 'visual', label: 'Estilo', icon: Palette },
            { id: 'users', label: 'Equipo', icon: Users },
            { id: 'reports', label: 'Reportes', icon: FileText },
            { id: 'finance', label: 'Finanzas', icon: DollarSign },
            { id: 'notifications', label: 'Alertas', icon: Bell },
            { id: 'security', label: 'Auditoría', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as Tab); setEditingUser(null); }}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === item.id ? "bg-[var(--brand-primary)] text-white shadow-xl lg:translate-x-2" : "text-gray-500 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" /> {item.label}
            </button>
          ))}
          <Button onClick={handleSave} disabled={saving} className="hidden lg:flex mt-10 bg-white text-black font-black py-7 rounded-2xl shadow-2xl hover:bg-[var(--brand-primary)] hover:text-white transition-all">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />} GUARDAR
          </Button>
        </aside>

        {/* Contenido de Pestañas - Mobile First */}
        <div className="flex-1 w-full space-y-10">
          {activeTab === 'general' && (
            <Card className="rounded-[2.5rem] bg-[#13151f] border-2 border-white/5 overflow-hidden animate-in fade-in duration-500">
              <CardHeader className="bg-white/5 p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic">Identidad</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Nombre</Label><Input value={form.churchName} onChange={e => setForm({...form, churchName: e.target.value})} className="bg-white/5 border-white/10 h-14 rounded-2xl font-black uppercase" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Subtítulo</Label><Input value={form.churchSubtitle} onChange={e => setForm({...form, churchSubtitle: e.target.value})} className="bg-white/5 border-white/10 h-14 rounded-2xl font-black uppercase" /></div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8 p-8 border-2 border-dashed border-white/10 rounded-[2.5rem]">
                  <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl shrink-0"><Image src={form.logoUrl} alt="Logo" fill className="object-cover" unoptimized /></div>
                  <div className="text-center md:text-left"><input type="file" id="logo-up" className="hidden" accept="image/*" onChange={handleLogoUpload} /><Label htmlFor="logo-up" className="bg-white text-black px-8 py-4 rounded-xl cursor-pointer font-black text-[10px] uppercase inline-block shadow-xl hover:bg-[var(--brand-primary)] hover:text-white transition-all">Cambiar Logo</Label></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'visual' && (
            <Card className="rounded-[2.5rem] bg-[#13151f] border-2 border-white/5 overflow-hidden animate-in fade-in duration-500">
              <CardHeader className="bg-white/5 p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic">Estilo</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="space-y-6">
                  <Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Color Principal</Label>
                  <div className="flex items-center gap-6"><input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})} className="w-20 h-20 rounded-3xl cursor-pointer border-none bg-transparent" /><Button variant="outline" onClick={() => setForm({...form, primaryColor: DEFAULT_ORANGE})} className="rounded-xl border-white/10 text-gray-500 font-black text-[9px] uppercase">Resetear</Button></div>
                </div>
                <div className="space-y-2 pt-8 border-t border-white/5">
                  <Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Nombre Calculadora</Label>
                  <Input value={form.calculatorName} onChange={e => setForm({...form, calculatorName: e.target.value})} className="bg-white/5 border-white/10 h-14 rounded-2xl font-black uppercase italic" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'finance' && (
            <Card className="rounded-[2.5rem] bg-[#13151f] border-2 border-white/5 overflow-hidden animate-in fade-in duration-500">
              <CardHeader className="bg-white/5 p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic">Finanzas</CardTitle></CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Caja General</Label><Input value={form.generalFundName} onChange={e => setForm({...form, generalFundName: e.target.value})} className="bg-white/5 border-white/10 h-14 rounded-2xl font-black uppercase" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Divisa</Label><Input value={form.currencySymbol} onChange={e => setForm({...form, currencySymbol: e.target.value})} className="bg-white/5 border-white/10 h-14 rounded-2xl font-black uppercase" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Meta Mensual</Label><Input type="number" value={form.monthlyGoal} onChange={e => setForm({...form, monthlyGoal: e.target.value})} className="bg-white/5 border-white/10 h-14 rounded-2xl font-black" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Alerta Saldo</Label><Input type="number" value={form.lowBalanceAlert} onChange={e => setForm({...form, lowBalanceAlert: e.target.value})} className="bg-white/5 border-white/10 h-14 rounded-2xl font-black" /></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="rounded-[2.5rem] bg-[#13151f] border-2 border-white/5 overflow-hidden animate-in fade-in duration-500">
              <CardHeader className="bg-white/5 p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic">Alertas</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Plantilla WhatsApp</Label>
                  <textarea value={form.whatsappMessageTemplate} onChange={e => setForm({...form, whatsappMessageTemplate: e.target.value})} className="w-full h-40 p-6 rounded-[2rem] bg-white/5 border-2 border-transparent focus:border-[var(--brand-primary)] outline-none text-xs font-bold text-white transition-all leading-relaxed" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-500 ml-2">Webhook URL</Label>
                  <Input value={form.webhookUrl} onChange={e => setForm({...form, webhookUrl: e.target.value})} className="bg-white/5 border-white/10 h-14 rounded-2xl font-black text-xs" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card className="rounded-[2.5rem] bg-[#13151f] border-2 border-white/5 overflow-hidden animate-in fade-in duration-500">
              <CardHeader className="bg-white/5 p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic">Equipo</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left min-w-[400px]">
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-8 py-6 flex items-center gap-4">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white/5 shrink-0">{u.image ? <Image src={u.image} alt="U" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center font-black">{u.email[0].toUpperCase()}</div>}</div>
                          <p className="font-black uppercase text-xs truncate">{u.firstName || u.email}</p>
                        </td>
                        <td className="px-8 py-6 text-right text-[10px] font-black text-blue-400">{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Botón Guardar Flotante para Móvil */}
      <div className="lg:hidden fixed bottom-10 right-6 z-50">
        <Button onClick={handleSave} disabled={saving} className="bg-[var(--brand-primary)] text-white w-16 h-16 rounded-[2rem] shadow-2xl active:scale-90 transition-all flex items-center justify-center p-0">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
        </Button>
      </div>
    </div>
  );
}
