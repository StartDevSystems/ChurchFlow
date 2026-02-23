"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';

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
    <div className="flex items-center justify-center min-h-screen bg-[#f7f4ef] dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-[#e8e2d9] dark:border-gray-800 overflow-hidden">
        <CardHeader className="text-center pt-10 pb-6 bg-[#f7f4ef] dark:bg-gray-900/50">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Únete al <span className="text-[#e85d26]">Equipo</span></CardTitle>
          <CardDescription className="font-bold text-[10px] uppercase tracking-widest">Crea tu cuenta de gestión</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1">Nombre</Label>
                <Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1">Apellido</Label>
                <Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="rounded-xl" required />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl" placeholder="m@iglesia.com" required />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1">Contraseña</Label>
              <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="rounded-xl" required />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1">Confirmar</Label>
              <Input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="rounded-xl" required />
            </div>
            {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>}
            <Button type="submit" className="w-full bg-[#1a1714] dark:bg-white text-white dark:text-black font-black py-6 rounded-2xl mt-4 shadow-xl active:scale-95 transition-all" disabled={loading}>
              {loading ? 'REGISTRANDO...' : 'CREAR MI CUENTA'}
            </Button>
            <p className="text-center text-[10px] font-bold text-[#8c7f72] uppercase mt-4">
              ¿Ya tienes cuenta? <Link href="/login" className="text-[#e85d26] hover:underline ml-1">Inicia Sesión</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
