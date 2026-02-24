'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [birthDate, setBirthDate] = useState(''); 
  const [monthlyDue, setMonthlyDue] = useState('0'); // Nuevo estado
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchMember() {
      try {
        const response = await fetch(`/api/members/${id}`);
        if (response.ok) {
          const data = await response.json();
          setName(data.name);
          setPhone(data.phone);
          setRole(data.role);
          setMonthlyDue(data.monthlyDue?.toString() || '0');
          if (data.birthDate) setBirthDate(data.birthDate.split('T')[0]);
        } else {
          console.error('Failed to fetch member');
          alert('No se pudo cargar la información del miembro.');
          router.push('/members');
        }
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setFetching(false);
      }
    }

    fetchMember();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          phone, 
          role, 
          birthDate: birthDate ? new Date(birthDate) : null,
          monthlyDue: parseFloat(monthlyDue) || 0
        }),
      });

      if (response.ok) {
        router.push('/members');
      } else {
        console.error('Failed to update member');
        alert('No se pudo actualizar el miembro.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div>Cargando información del miembro...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">Editar Miembro</h1>
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Actualizar Información</CardTitle>
            <CardDescription>Modifica los datos del miembro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              {role && (
                <Select name="role" onValueChange={setRole} defaultValue={role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Joven">Joven</SelectItem>
                    <SelectItem value="Directiva">Directiva</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyDue">Cuota Mensual (RD$)</Label>
              <Input
                id="monthlyDue"
                type="number"
                value={monthlyDue}
                onChange={(e) => setMonthlyDue(e.target.value)}
                placeholder="Ej: 200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Miembro'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
