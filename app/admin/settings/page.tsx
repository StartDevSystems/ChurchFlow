"use client";

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Home, DollarSign, Image as ImageIcon, Save, Loader2, Upload, Trash, 
  Users, Palette, FileText, Shield, Bell, CheckCircle2, XCircle, Key, Lock, RotateCcw,
  User as UserIcon, MoreVertical, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Tab = 'general' | 'visual' | 'users' | 'reports' | 'finance' | 'notifications';

const PERMISSION_LABELS: Record<string, string> = {
  view_members: 'Miembros',
  view_transactions: 'Transacciones',
  view_reports: 'Reportes',
  view_stats: 'Estadísticas',
  view_dues: 'Cuotas',
  view_events: 'Eventos',
  manage_categories: 'Categorías',
  manage_settings: 'Ajustes'
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
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newPassword, setNewPass] = useState('');
  
  const [form, setForm] = useState({
    churchName: '',
    churchSubtitle: '',
    currencySymbol: 'RD$',
    logoUrl: '',
    monthlyGoal: '0',
    primaryColor: DEFAULT_ORANGE,
    themeMode: 'system',
    reportSignatureName: '',
    reportFooterText: 'Dios les bendiga.',
    allowPublicRegistration: true,
    generalFundName: 'Caja General',
    lowBalanceAlert: '1000',
    webhookUrl: ''
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, usersRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/users')
      ]);
      
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setForm({
          ...data,
          primaryColor: data.primaryColor || DEFAULT_ORANGE,
          monthlyGoal: (data.monthlyGoal || 0).toString(),
          lowBalanceAlert: (data.lowBalanceAlert || 0).toString(),
        });
      }
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        toast({ title: 'Configuración guardada ✓' });
        document.documentElement.style.setProperty('--brand-primary', form.primaryColor);
      }
    } finally { setSaving(false); }
  };

  const updateUserInDB = async (userId: string, data: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...data })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, ...data } : u));
        if (editingUser?.id === userId) setEditingUser({ ...editingUser, ...data });
        toast({ title: 'Usuario actualizado' });
        return true;
      }
      return false;
    } catch (error) { return false; }
  };

  const toggleUserRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    await updateUserInDB(id, { role: newRole });
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Borrar este usuario?')) return;
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      setUsers(users.filter(u => u.id !== id));
      setEditingUser(null);
      toast({ title: 'Usuario eliminado' });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, logoUrl: reader.result as string });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUserImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingUser) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await updateUserInDB(editingUser.id, { image: base64 });
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 md:px-0">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-[#1a1714] dark:text-white uppercase tracking-tighter italic">
          Control <span className="text-[var(--brand-primary)]">Master</span>
        </h1>
        <p className="text-xs md:text-sm text-[#8c7f72] font-bold uppercase tracking-[0.2em]">Administración Central</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
          {[
            { id: 'general', label: 'General', icon: Home },
            { id: 'visual', label: 'Estilo', icon: Palette },
            { id: 'users', label: 'Equipo', icon: Users },
            { id: 'reports', label: 'Papelería', icon: FileText },
            { id: 'finance', label: 'Cajas', icon: DollarSign },
            { id: 'notifications', label: 'Alertas', icon: Bell },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as Tab); setEditingUser(null); }}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                activeTab === item.id 
                  ? "bg-[var(--brand-primary)] text-white shadow-xl lg:translate-x-2" 
                  : "text-[#8c7f72] hover:bg-[#f7f4ef] dark:hover:bg-gray-800"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          <Button onClick={handleSave} disabled={saving} className="hidden lg:flex mt-8 bg-[#1a1714] dark:bg-white text-white dark:text-black font-black py-6 rounded-2xl shadow-2xl active:scale-95 transition-all">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            GUARDAR
          </Button>
        </aside>

        <div className="flex-1 min-w-0">
          {activeTab === 'users' && !editingUser && (
            <Card className="rounded-[2.5rem] border-[#e8e2d9] dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                  <div>
                    <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Equipo del Sistema</CardTitle>
                    <CardDescription className="font-bold text-[10px] uppercase text-[#8c7f72]">Administra accesos y perfiles</CardDescription>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-5 py-2.5 rounded-2xl border border-[#e8e2d9] dark:border-gray-800">
                    <Label className="text-[10px] font-black uppercase whitespace-nowrap">Registro Público</Label>
                    <button onClick={() => setForm({...form, allowPublicRegistration: !form.allowPublicRegistration})} className={cn("w-12 h-6 rounded-full relative transition-all duration-300", form.allowPublicRegistration ? "bg-green-500" : "bg-red-500")}>
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", form.allowPublicRegistration ? "right-1" : "left-1")} />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-[#f0ece6] dark:divide-gray-800">
                    {users.map(u => (
                      <tr key={u.id} onClick={() => setEditingUser(u)} className="group cursor-pointer hover:bg-[#fcfbf9] dark:hover:bg-gray-800/20 transition-all">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#e8e2d9] dark:border-gray-700 group-hover:border-[var(--brand-primary)] transition-colors">
                              {u.image ? <img src={u.image} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-[#f7f4ef] dark:bg-gray-800 text-[#8c7f72] font-black">{u.email[0].toUpperCase()}</div>}
                            </div>
                            <div>
                              <p className="font-black text-[#1a1714] dark:text-white text-sm tracking-tight">{u.firstName ? `${u.firstName} ${u.lastName}` : u.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={cn("text-[8px] font-black px-2 py-0.5 rounded uppercase", u.role === 'ADMIN' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>{u.role}</span>
                                <span className="text-[8px] font-bold text-[#8c7f72] uppercase tracking-widest">{Object.keys(u.permissions || {}).filter(k => u.permissions[k]).length} permisos</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <MoreVertical className="h-4 w-4 text-[#8c7f72] opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {editingUser && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
              <div className="flex items-center gap-4">
                <button onClick={() => setEditingUser(null)} className="p-2 rounded-xl hover:bg-[#f7f4ef] dark:hover:bg-gray-800 transition-all"><XCircle className="h-6 w-6 text-[#8c7f72]" /></button>
                <h2 className="text-xl font-black uppercase italic">Perfil de {editingUser.firstName || editingUser.email}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                  <Card className="rounded-[2.5rem] border-2 border-[var(--brand-primary)] p-8 text-center shadow-2xl">
                    <div className="relative w-32 h-32 mx-auto mb-6 group">
                      <div className="w-full h-full rounded-[2rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                        {editingUser.image ? <img src={editingUser.image} alt="Perfil" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-2xl font-black">{editingUser.email[0].toUpperCase()}</div>}
                      </div>
                      <input type="file" id="user-img" className="hidden" accept="image/*" onChange={handleUserImageUpload} />
                      <Label htmlFor="user-img" className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[2rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-[10px] font-black uppercase">Cambiar</Label>
                    </div>
                    <button onClick={() => toggleUserRole(editingUser.id, editingUser.role)} disabled={editingUser.id === session?.user?.id} className={cn("w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all", editingUser.role === 'ADMIN' ? "bg-purple-600 text-white shadow-lg" : "bg-[#f7f4ef] text-[#8c7f72] border border-[#e8e2d9]")}>
                      {editingUser.role}
                    </button>
                  </Card>

                  <Card className="rounded-[2rem] border-[#e8e2d9] dark:border-gray-800 p-6 space-y-4">
                    <Label className="text-[10px] font-black uppercase">Nueva Clave</Label>
                    <Input type="password" value={newPassword} onChange={e => setNewPass(e.target.value)} className="rounded-xl h-10 text-xs" />
                    <Button onClick={() => { updateUserInDB(editingUser.id, { password: newPassword }); setNewPass(''); }} className="w-full bg-[#1a1714] dark:bg-white text-white dark:text-black font-black text-[10px] rounded-xl py-4 uppercase">Resetear</Button>
                    <Button onClick={() => deleteUser(editingUser.id)} disabled={editingUser.id === session?.user?.id} variant="ghost" className="w-full text-red-500 font-bold text-[10px] uppercase">Eliminar</Button>
                  </Card>
                </div>

                <div className="md:col-span-2">
                  <Card className="rounded-[2.5rem] border-[#e8e2d9] dark:border-gray-800 h-full overflow-hidden shadow-sm">
                    <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8">
                      <CardTitle className="text-lg font-black uppercase flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-500" /> Permisos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.keys(PERMISSION_LABELS).map((key) => {
                        const isActive = editingUser.permissions?.[key];
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              const newPerms = { ...(editingUser.permissions || {}), [key]: !isActive };
                              updateUserInDB(editingUser.id, { permissions: newPerms });
                            }}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                              isActive 
                                ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400" 
                                : "bg-[#f7f4ef] dark:bg-gray-900 border-[#e8e2d9] dark:border-gray-800 text-[#8c7f72]"
                            )}
                          >
                            <span className="font-black text-[10px] uppercase tracking-wider">{PERMISSION_LABELS[key]}</span>
                            {isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 opacity-20" />}
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <Card className="rounded-[2.5rem] border-[#e8e2d9] dark:border-gray-800 overflow-hidden shadow-sm animate-in fade-in duration-500">
              <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8"><CardTitle className="text-xl font-black uppercase italic">Identidad</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Nombre Ministerio</Label><Input value={form.churchName} onChange={e => setForm({...form, churchName: e.target.value})} className="rounded-2xl h-12" /></div>
                  <div className="space-y-2"><Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Subtítulo</Label><Input value={form.churchSubtitle} onChange={e => setForm({...form, churchSubtitle: e.target.value})} className="rounded-2xl h-12" /></div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-10 p-8 border-2 border-dashed border-[#e8e2d9] dark:border-gray-800 rounded-[2.5rem] bg-[#fbfaf8] dark:bg-black/20">
                  <img src={form.logoUrl} alt="Logo" className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white dark:border-gray-800 shadow-2xl" />
                  <div className="flex-1 w-full space-y-4">
                    <input type="file" id="logo-up" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    <Label htmlFor="logo-up" className="inline-flex items-center gap-2 bg-[#1a1714] dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl cursor-pointer font-black text-[10px] uppercase tracking-widest">Subir Logo</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'visual' && (
            <Card className="rounded-[2.5rem] border-[#e8e2d9] dark:border-gray-800 shadow-sm animate-in fade-in duration-500">
              <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8"><CardTitle className="text-xl font-black uppercase italic">Apariencia</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="space-y-6">
                  <Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Color Primario</Label>
                  <div className="flex flex-wrap items-center gap-6">
                    <input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})} className="w-20 h-20 rounded-3xl cursor-pointer border-none bg-transparent" />
                    <Button variant="outline" onClick={() => setForm({...form, primaryColor: DEFAULT_ORANGE})} className="rounded-2xl border-[#e8e2d9] text-[#8c7f72] font-black text-[10px] uppercase h-12 px-6">Restablecer</Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {['system', 'light', 'dark'].map(m => (
                    <button key={m} onClick={() => { setForm({...form, themeMode: m}); setTheme(m); }} className={cn("py-5 rounded-[1.5rem] font-black text-[10px] uppercase border-2", form.themeMode === m ? "bg-[#1a1714] dark:bg-white text-white dark:text-black" : "text-[#8c7f72]")}>{m}</button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'reports' && (
            <Card className="rounded-[2.5rem] border-[#e8e2d9] dark:border-gray-800 shadow-sm animate-in fade-in duration-500">
              <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8"><CardTitle className="text-xl font-black uppercase italic">Reportes</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2"><Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Nombre Firma</Label><Input value={form.reportSignatureName} onChange={e => setForm({...form, reportSignatureName: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-2"><Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Texto Pie</Label><textarea value={form.reportFooterText} onChange={e => setForm({...form, reportFooterText: e.target.value})} className="w-full h-24 p-4 rounded-2xl bg-[#f7f4ef] dark:bg-gray-900 border-none text-sm" /></div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'finance' && (
            <Card className="rounded-[2.5rem] border-[#e8e2d9] dark:border-gray-800 shadow-sm animate-in fade-in duration-500">
              <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8"><CardTitle className="text-xl font-black uppercase italic">Finanzas</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Fondo General</Label><Input value={form.generalFundName} onChange={e => setForm({...form, generalFundName: e.target.value})} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Moneda</Label><Input value={form.currencySymbol} onChange={e => setForm({...form, currencySymbol: e.target.value})} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Meta Mensual</Label><Input type="number" value={form.monthlyGoal} onChange={e => setForm({...form, monthlyGoal: e.target.value})} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Alerta Saldo</Label><Input type="number" value={form.lowBalanceAlert} onChange={e => setForm({...form, lowBalanceAlert: e.target.value})} className="rounded-xl" /></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="rounded-[2.5rem] border-[#e8e2d9] dark:border-gray-800 shadow-sm animate-in fade-in duration-500">
              <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8"><CardTitle className="text-xl font-black uppercase italic">Alertas</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2"><Label className="font-bold text-[10px] uppercase text-[#8c7f72]">Webhook URL</Label><Input value={form.webhookUrl} onChange={e => setForm({...form, webhookUrl: e.target.value})} className="rounded-xl" placeholder="Discord / Telegram" /></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Button onClick={handleSave} disabled={saving} className="bg-[var(--brand-primary)] text-white font-black p-5 rounded-full shadow-2xl active:scale-95 transition-all">
          {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
}
