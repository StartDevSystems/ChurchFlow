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
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
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
    webhookUrl: '',
    whatsappMessageTemplate: '',
    calculatorName: 'Calculadora Bendecida'
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, usersRes, auditRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/users'),
        fetch('/api/admin/audit')
      ]);
      
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setForm({
          ...data,
          primaryColor: data.primaryColor || DEFAULT_ORANGE,
          monthlyGoal: (data.monthlyGoal || 0).toString(),
          lowBalanceAlert: (data.lowBalanceAlert || 0).toString(),
          calculatorName: data.calculatorName || 'Calculadora Bendecida'
        });
      }
      
      if (usersRes.ok) setUsers(await usersRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        toast({ title: 'Configuración guardada ✓', variant: 'success' });
        document.documentElement.style.setProperty('--brand-primary', form.primaryColor);
      } else {
        const errorData = await response.json();
        toast({ title: 'Error al guardar', description: errorData.error || 'Ocurrió un problema', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error de conexión', variant: 'destructive' });
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
    <div className="max-w-6xl mx-auto pb-24 px-4 md:px-0">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-black text-[#1a1714] dark:text-white uppercase tracking-tighter italic leading-none mb-3">
          Control <span className="text-[var(--brand-primary)]">Master</span>
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c7f72]">Configuración de alto nivel</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navegación de pestañas responsiva */}
        <aside className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar sticky top-0 lg:top-8 z-30 bg-[#f7f4ef]/80 dark:bg-[#0a0c14]/80 backdrop-blur-xl p-2 rounded-[2rem] border-2 border-white/5 lg:border-none">
          {[
            { id: 'general', label: 'General', icon: Home },
            { id: 'visual', label: 'Estilo', icon: Palette },
            { id: 'users', label: 'Equipo', icon: Users },
            { id: 'reports', label: 'Papelería', icon: FileText },
            { id: 'finance', label: 'Finanzas', icon: DollarSign },
            { id: 'notifications', label: 'Alertas', icon: Bell },
            { id: 'security', label: 'Seguridad', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as Tab); setEditingUser(null); }}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap min-w-max lg:min-w-0",
                activeTab === item.id 
                  ? "bg-[var(--brand-primary)] text-white shadow-xl shadow-orange-500/20 scale-[1.02] lg:translate-x-2" 
                  : "text-[#8c7f72] hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          <Button onClick={handleSave} disabled={saving} className="hidden lg:flex mt-8 bg-[#1a1714] dark:bg-white text-white dark:text-black font-black py-7 rounded-2xl shadow-2xl hover:brightness-110 active:scale-95 transition-all">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            GUARDAR CAMBIOS
          </Button>
        </aside>

        <div className="flex-1 w-full">
          {activeTab === 'users' && !editingUser && (
            <Card className="rounded-[3rem] border-[#e8e2d9] dark:border-gray-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                  <div>
                    <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Equipo del Sistema</CardTitle>
                    <CardDescription className="font-bold text-[10px] uppercase text-[#8c7f72] tracking-widest mt-1">Administra accesos y perfiles</CardDescription>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-5 py-3 rounded-2xl border border-[#e8e2d9] dark:border-gray-800">
                    <Label className="text-[10px] font-black uppercase whitespace-nowrap">Registro Público</Label>
                    <button onClick={() => setForm({...form, allowPublicRegistration: !form.allowPublicRegistration})} className={cn("w-12 h-6 rounded-full relative transition-all duration-300", form.allowPublicRegistration ? "bg-green-500" : "bg-red-500")}>
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", form.allowPublicRegistration ? "right-1" : "left-1")} />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <tbody className="divide-y divide-[#f0ece6] dark:divide-gray-800">
                      {users.map(u => (
                        <tr key={u.id} onClick={() => setEditingUser(u)} className="group cursor-pointer hover:bg-[#fcfbf9] dark:hover:bg-white/[0.02] transition-all">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#e8e2d9] dark:border-gray-700 group-hover:border-[var(--brand-primary)] transition-colors">
                                {u.image ? <Image src={u.image} alt="Avatar" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-[#f7f4ef] dark:bg-gray-800 text-[#8c7f72] font-black">{u.email[0].toUpperCase()}</div>}
                              </div>
                              <div>
                                <p className="font-black text-[#1a1714] dark:text-white text-sm tracking-tight">{u.firstName ? `${u.firstName} ${u.lastName}` : u.email}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className={cn("text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest", u.role === 'ADMIN' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}>{u.role}</span>
                                  <span className="text-[8px] font-bold text-[#8c7f72] uppercase tracking-[0.2em]">{Object.keys(u.permissions || {}).filter(k => u.permissions[k]).length} permisos</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <MoreVertical className="h-4 w-4 text-[#8c7f72] opacity-40 group-hover:opacity-100 transition-opacity ml-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {editingUser && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
              <div className="flex items-center gap-4">
                <button onClick={() => setEditingUser(null)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"><XCircle className="h-6 w-6 text-[#8c7f72]" /></button>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Perfil de {editingUser.firstName || editingUser.email}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                  <Card className="rounded-[3rem] border-2 border-[var(--brand-primary)] p-10 text-center shadow-2xl bg-[#13151f]">
                    <div className="relative w-32 h-32 mx-auto mb-8 group">
                      <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-xl relative">
                        {editingUser.image ? <Image src={editingUser.image} alt="Perfil" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-gray-800 text-3xl font-black">{editingUser.email[0].toUpperCase()}</div>}
                      </div>
                      <input type="file" id="user-img" className="hidden" accept="image/*" onChange={handleUserImageUpload} />
                      <Label htmlFor="user-img" className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-[2.5rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-[10px] font-black uppercase tracking-widest">Cambiar</Label>
                    </div>
                    <button onClick={() => toggleUserRole(editingUser.id, editingUser.role)} disabled={editingUser.id === session?.user?.id} className={cn("w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all", editingUser.role === 'ADMIN' ? "bg-purple-600 text-white shadow-lg" : "bg-white/5 text-[#8c7f72] border border-white/5")}>
                      {editingUser.role}
                    </button>
                  </Card>

                  <Card className="rounded-[2.5rem] border-white/5 bg-[#13151f]/40 p-8 space-y-5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Resetear Clave</Label>
                    <Input type="password" value={newPassword} onChange={e => setNewPass(e.target.value)} className="bg-white/5 border-white/5 rounded-xl h-12 text-sm" placeholder="Nueva contraseña" />
                    <Button onClick={() => { updateUserInDB(editingUser.id, { password: newPassword }); setNewPass(''); }} className="w-full bg-white text-black font-black text-[10px] rounded-xl py-5 uppercase tracking-[0.2em] shadow-xl">Actualizar</Button>
                    <Button onClick={() => deleteUser(editingUser.id)} disabled={editingUser.id === session?.user?.id} variant="ghost" className="w-full text-red-500 font-black text-[9px] uppercase tracking-widest hover:bg-red-500/10">Eliminar Cuenta</Button>
                  </Card>
                </div>

                <div className="md:col-span-2">
                  <Card className="rounded-[3rem] border-white/5 bg-[#13151f] h-full overflow-hidden shadow-2xl">
                    <CardHeader className="bg-white/[0.02] p-8 border-b border-white/5">
                      <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-green-500" /> Permisos de Acceso</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              "flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all duration-300 text-left",
                              isActive 
                                ? "bg-green-500/10 border-green-500/30 text-green-400 shadow-inner" 
                                : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10"
                            )}
                          >
                            <span className="font-black text-[10px] uppercase tracking-widest">{PERMISSION_LABELS[key]}</span>
                            {isActive ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 opacity-20 shrink-0" />}
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
            <Card className="rounded-[3rem] border-white/5 bg-[#13151f] overflow-hidden shadow-2xl animate-in fade-in duration-500">
              <CardHeader className="bg-white/[0.02] p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic tracking-tighter">Identidad Ministerial</CardTitle></CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3"><Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Nombre del Ministerio</Label><Input value={form.churchName} onChange={e => setForm({...form, churchName: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase text-sm px-6" /></div>
                  <div className="space-y-3"><Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Subtítulo / Lema</Label><Input value={form.churchSubtitle} onChange={e => setForm({...form, churchSubtitle: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase text-sm px-6" /></div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-10 p-10 border-2 border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                  <div className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl shrink-0">
                    <Image src={form.logoUrl} alt="Logo" fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 w-full space-y-6 text-center md:text-left">
                    <div>
                      <p className="text-xl font-black uppercase italic text-white mb-2">Escudo Oficial</p>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Formatos recomendados: PNG, JPG o WEBP</p>
                    </div>
                    <input type="file" id="logo-up" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    <Label htmlFor="logo-up" className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl cursor-pointer font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-[var(--brand-primary)] hover:text-white transition-all">{uploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />} Subir Archivo</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'visual' && (
            <Card className="rounded-[3rem] border-white/5 bg-[#13151f] shadow-2xl animate-in fade-in duration-500">
              <CardHeader className="bg-white/[0.02] p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic tracking-tighter">Apariencia y Estilo</CardTitle></CardHeader>
              <CardContent className="p-10 space-y-12">
                <div className="space-y-8">
                  <Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Color de Identidad</Label>
                  <div className="flex flex-wrap items-center gap-10">
                    <div className="relative">
                      <input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})} className="w-24 h-24 rounded-[2rem] cursor-pointer border-4 border-white/10 bg-transparent p-0 overflow-hidden" />
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border border-white/10 shadow-lg pointer-events-none"><Palette size={14} className="text-gray-500" /></div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="font-black text-white uppercase italic text-lg">{form.primaryColor.toUpperCase()}</p>
                      <Button variant="outline" onClick={() => setForm({...form, primaryColor: DEFAULT_ORANGE})} className="rounded-xl border-white/10 text-gray-500 font-black text-[9px] uppercase tracking-widest h-10 px-6 hover:bg-white/5 hover:text-white">Usar Naranja Original</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-10 border-t border-white/5">
                  <Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Nombre Herramienta de Presupuesto</Label>
                  <Input value={form.calculatorName} onChange={e => setForm({...form, calculatorName: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase text-sm px-6 italic" placeholder="EJ: CALCULADORA BENDECIDA" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-10 border-t border-white/5">
                  {['system', 'light', 'dark'].map(m => (
                    <button key={m} onClick={() => { setForm({...form, themeMode: m}); setTheme(m); }} className={cn("py-6 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] border-2 transition-all", form.themeMode === m ? "bg-white text-black border-white shadow-2xl" : "text-gray-500 border-white/5 hover:border-white/10")}>{m}</button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'reports' && (
            <Card className="rounded-[3rem] border-white/5 bg-[#13151f] shadow-2xl animate-in fade-in duration-500">
              <CardHeader className="bg-white/[0.02] p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic tracking-tighter">Documentación y Reportes</CardTitle></CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-3"><Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Nombre Responsable Firma</Label><Input value={form.reportSignatureName} onChange={e => setForm({...form, reportSignatureName: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase text-sm px-6" /></div>
                <div className="space-y-3"><Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Pie de Página (Mensaje)</Label><textarea value={form.reportFooterText} onChange={e => setForm({...form, reportFooterText: e.target.value})} className="w-full h-32 p-6 rounded-[2rem] bg-white/5 border-2 border-transparent focus:border-[var(--brand-primary)] outline-none text-sm font-bold text-white transition-all" /></div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'finance' && (
            <Card className="rounded-[3rem] border-white/5 bg-[#13151f] shadow-2xl animate-in fade-in duration-500">
              <CardHeader className="bg-white/[0.02] p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic tracking-tighter">Configuración Financiera</CardTitle></CardHeader>
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3"><Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Nombre Fondo General</Label><Input value={form.generalFundName} onChange={e => setForm({...form, generalFundName: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase text-sm px-6" /></div>
                  <div className="space-y-3"><Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Símbolo Divisa</Label><Input value={form.currencySymbol} onChange={e => setForm({...form, currencySymbol: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 font-black uppercase text-sm px-6" /></div>
                  <div className="space-y-3"><Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Meta de Ingresos Mensual</Label><Input type="number" value={form.monthlyGoal} onChange={e => setForm({...form, monthlyGoal: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 font-black text-sm px-6" /></div>
                  <div className="space-y-3"><Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Umbral de Alerta Saldo Bajo</Label><Input type="number" value={form.lowBalanceAlert} onChange={e => setForm({...form, lowBalanceAlert: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 font-black text-sm px-6" /></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="rounded-[3rem] border-white/5 bg-[#13151f] shadow-2xl animate-in fade-in duration-500">
              <CardHeader className="bg-white/[0.02] p-8 border-b border-white/5"><CardTitle className="text-xl font-black uppercase italic tracking-tighter">Alertas y Notificaciones</CardTitle></CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400"><Bell size={24} /></div>
                    <div><p className="font-black text-white uppercase text-sm tracking-tight">Notificaciones Push</p><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recibe alertas en tu navegador</p></div>
                  </div>
                  <Button onClick={() => Notification.requestPermission()} className="w-full md:w-auto bg-blue-600 text-white font-black text-[10px] uppercase px-8 py-6 rounded-2xl shadow-xl hover:bg-blue-700 transition-all tracking-[0.2em]">Solicitar Acceso</Button>
                </div>

                <div className="space-y-4">
                  <Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest ml-2">Webhook de Integración (Telegram/Slack)</Label>
                  <Input value={form.webhookUrl} onChange={e => setForm({...form, webhookUrl: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-14 font-black text-xs px-6" placeholder="https://api.telegram.org/..." />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 ml-2">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    <Label className="font-black text-[10px] uppercase text-gray-500 tracking-widest">Plantilla Mensaje WhatsApp</Label>
                  </div>
                  <textarea value={form.whatsappMessageTemplate} onChange={e => setForm({...form, whatsappMessageTemplate: e.target.value})} className="w-full h-40 p-6 rounded-[2.5rem] bg-white/5 border-2 border-transparent focus:border-[var(--brand-primary)] outline-none text-xs font-bold text-white transition-all leading-relaxed" placeholder="Hola {nombre}..." />
                  <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest ml-4">Tags disponibles: {'{nombre}'}, {'{mes}'}, {'{monto}'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="rounded-[3rem] border-white/5 bg-[#13151f] shadow-2xl overflow-hidden animate-in fade-in duration-500">
              <CardHeader className="bg-white/[0.02] p-8 border-b border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4 text-center md:text-left">
                    <div className="p-4 rounded-2xl bg-red-500/10 text-red-500"><Shield size={24} /></div>
                    <div><CardTitle className="text-xl font-black uppercase italic tracking-tighter">Auditoría de Seguridad</CardTitle><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Historial de acciones críticas</p></div>
                  </div>
                  <Button onClick={async () => {
                    const res = await fetch('/api/admin/backup');
                    const data = await res.json();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `ChurchFlow_Backup_${format(new Date(), 'ddMMyy')}.json`; a.click();
                  }} className="w-full md:w-auto bg-white text-black font-black text-[10px] uppercase px-8 py-6 rounded-2xl shadow-xl hover:bg-red-500 hover:text-white transition-all tracking-[0.2em]">Descargar Respaldo</Button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{format(new Date(log.createdAt), 'dd/MM/yy HH:mm')}</td>
                        <td className="px-8 py-5 text-xs font-black text-white">{log.userEmail}</td>
                        <td className="px-8 py-5"><span className={cn("text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest", log.action === 'DELETE' ? "bg-red-500/10 text-red-500" : log.action === 'UPDATE' ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-500")}>{log.action}</span></td>
                        <td className="px-8 py-5 text-xs italic opacity-60 text-gray-400 font-medium truncate max-w-[300px]">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Botón Guardar Flotante para Móvil */}
      <div className="lg:hidden fixed bottom-8 right-8 z-50">
        <Button onClick={handleSave} disabled={saving} className="bg-[var(--brand-primary)] text-white font-black w-16 h-16 rounded-3xl shadow-[0_10px_40px_rgba(232,93,38,0.4)] active:scale-90 transition-all flex items-center justify-center p-0">
          {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
}
