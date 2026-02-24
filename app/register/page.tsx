"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';
import { UserPlus, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        router.push('/login');
      } else {
        const data = await response.json();
        setError(data.error || 'Fallo al registrar.');
      }
    } catch (err) {
      setError('Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0c14] px-4 relative overflow-hidden">
      {/* Decoración Neón */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-[var(--brand-primary)]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md rounded-[3rem] bg-[#13151f] border-2 border-white/5 shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--brand-primary)] to-orange-600" />
        
        <CardHeader className="text-center pt-12 pb-8">
          <div className="w-16 h-16 bg-[var(--brand-primary)]/10 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-[var(--brand-primary)]/20 shadow-inner">
            <UserPlus className="h-8 w-8 text-[var(--brand-primary)]" strokeWidth={2.5} />
          </div>
          <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-white">Únete al <span className="text-[var(--brand-primary)]">Equipo</span></CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mt-2">Crea tu cuenta de gestión ministerial</CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-12">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-2">Nombre</Label>
                <Input 
                  value={form.firstName} 
                  onChange={e => setForm({...form, firstName: e.target.value})} 
                  className="bg-white/5 border-2 border-white/5 h-12 rounded-xl text-white font-black uppercase text-xs focus:border-[var(--brand-primary)] px-4" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-2">Apellido</Label>
                <Input 
                  value={form.lastName} 
                  onChange={e => setForm({...form, lastName: e.target.value})} 
                  className="bg-white/5 border-2 border-white/5 h-12 rounded-xl text-white font-black uppercase text-xs focus:border-[var(--brand-primary)] px-4" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-2">Email Oficial</Label>
              <Input 
                type="email" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                className="bg-white/5 border-2 border-white/5 h-12 rounded-xl text-white font-black text-xs focus:border-[var(--brand-primary)] px-4" 
                placeholder="m@iglesia.com" 
                required 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-2">Contraseña</Label>
              <Input 
                type="password" 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
                className="bg-white/5 border-2 border-white/5 h-12 rounded-xl text-white font-black text-xs focus:border-[var(--brand-primary)] px-4" 
                required 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-2">Confirmar</Label>
              <Input 
                type="password" 
                value={form.confirmPassword} 
                onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                className="bg-white/5 border-2 border-white/5 h-12 rounded-xl text-white font-black text-xs focus:border-[var(--brand-primary)] px-4" 
                required 
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest italic">{error}</p>
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-[var(--brand-primary)] hover:text-white h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Crear Mi Cuenta'}
            </button>

            <div className="text-center pt-4">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                ¿Ya eres parte?{' '}
                <Link href="/login" className="text-[var(--brand-primary)] hover:underline ml-1">
                  Inicia Sesión
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
