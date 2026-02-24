"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, Lock, Shield, User as UserIcon, Save, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ firstName: '', lastName: '' });
  const [passForm, setPassForm] = useState({ new: '', confirm: '' });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        firstName: (session.user as any).firstName || '',
        lastName: (session.user as any).lastName || ''
      });
      setLocalImage((session.user as any).image || null);
    }
  }, [session]);

  if (!session) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast({ title: 'Imagen muy grande', description: 'El tamaño máximo es 1.5MB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalImage(reader.result as string);
      toast({ title: 'Foto cargada', description: 'No olvides guardar los cambios.' });
    };
    reader.readAsDataURL(file);
  };

  const handleDataUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingData(true);
    
    // Enviamos nombre, apellido Y la imagen (si se cambió)
    const payload = {
      ...formData,
      image: localImage
    };

    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await update({ ...session, user: { ...session.user, ...payload } });
      toast({ title: 'Perfil actualizado ✓', variant: 'success' });
      // Recargar para sincronizar sidebar
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios', variant: 'destructive' });
    }
    setSavingData(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passForm.new })
    });
    if (res.ok) {
      toast({ title: 'Contraseña cambiada ✓' });
      setPassForm({ new: '', confirm: '' });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 md:px-0">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-[#1a1714] dark:text-white uppercase tracking-tighter italic">
          Mi <span className="text-[var(--brand-primary)]">Perfil</span>
        </h1>
        <p className="text-xs md:text-sm text-[#8c7f72] font-bold uppercase tracking-[0.2em] mt-1">Tu identidad en el sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[3rem] border-2 border-[var(--brand-primary)] p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[var(--brand-primary)] to-transparent opacity-10" />
            <div className="relative w-32 h-32 mx-auto mb-6 group">
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                {localImage ? (
                  <Image 
                    src={localImage} 
                    alt="Mi Perfil" 
                    fill 
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-[#d1ccc4]" />
                )}
              </div>
              <input type="file" id="profile-img" className="hidden" accept="image/*" onChange={handleImageUpload} />
              <Label htmlFor="profile-img" className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-[10px] font-black uppercase">
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Cambiar Foto'}
              </Label>
            </div>
            <h3 className="font-black text-xl text-[#1a1714] dark:text-white mb-1">
              {formData.firstName || 'Usuario'} {formData.lastName || ''}
            </h3>
            <p className="text-xs font-bold text-[#8c7f72] mb-4">{session.user.email}</p>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--brand-primary)] text-white shadow-lg shadow-orange-500/20">
              <Shield className="h-3 w-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">{session.user.role}</span>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Datos Personales */}
          <Card className="rounded-[2.5rem] border-[#e8e2d9] dark:border-gray-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Datos Personales</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleDataUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#8c7f72]">Primer Nombre</Label>
                    <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="rounded-xl h-12 focus:border-[var(--brand-primary)]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#8c7f72]">Apellidos</Label>
                    <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="rounded-xl h-12 focus:border-[var(--brand-primary)]" />
                  </div>
                </div>
                <Button type="submit" disabled={savingData} className="w-full md:w-auto bg-[#1a1714] dark:bg-white text-white dark:text-black font-black px-10 py-6 rounded-2xl shadow-xl transition-all">
                  {savingData ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                  GUARDAR CAMBIOS
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card className="rounded-[2.5rem] border-[#e8e2d9] dark:border-gray-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-[#f7f4ef] dark:bg-gray-800/50 p-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                  <Lock className="h-5 w-5 text-[var(--brand-primary)]" />
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Seguridad</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#8c7f72]">Nueva Contraseña</Label>
                    <Input type="password" value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} className="rounded-xl h-12 focus:border-[var(--brand-primary)]" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#8c7f72]">Confirmar Contraseña</Label>
                    <Input type="password" value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} className="rounded-xl h-12 focus:border-[var(--brand-primary)]" placeholder="••••••••" />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="w-full md:w-auto bg-gray-100 dark:bg-gray-800 text-[#1a1714] dark:text-white font-black px-10 py-6 rounded-2xl shadow-md hover:bg-[var(--brand-primary)] hover:text-white transition-all">
                  ACTUALIZAR CLAVE
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
