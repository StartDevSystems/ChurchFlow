'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface Member {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface Event {
  id: string;
  name: string;
}

interface TransactionData {
  type: 'income' | 'expense';
  categoryId: string;
  amount: string;
  date: string;
  description: string;
  memberId: string | null;
  eventId: string | null;
}

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<TransactionData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const availableCategories = useMemo(() => {
    if (!formData) return [];
    return categories.filter(c => c.type === formData.type);
  }, [formData?.type, categories]);

  useEffect(() => {
    if (!id) return;

    async function fetchInitialData() {
      try {
        setFetching(true);
        const [transRes, membersRes, categoriesRes, eventsRes] = await Promise.all([
          fetch(`/api/transactions/${id}`),
          fetch('/api/members'),
          fetch('/api/categories'),
          fetch('/api/events')
        ]);

        if (!transRes.ok) throw new Error('No se pudo cargar la transacción.');
        
        const data = await transRes.json();
        setFormData({
          type: data.type,
          categoryId: data.categoryId,
          amount: data.amount.toString(),
          date: format(new Date(data.date), 'yyyy-MM-dd'),
          description: data.description,
          memberId: data.memberId,
          eventId: data.eventId,
        });

        if (membersRes.ok) setMembers(await membersRes.json());
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
        if (eventsRes.ok) setEvents(await eventsRes.json());

      } catch (error: any) {
        console.error('An error occurred:', error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        router.push('/transactions');
      } finally {
        setFetching(false);
      }
    }

    fetchInitialData();
  }, [id, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      if (!prev) return null;
      const updated = { ...prev, [name]: value === 'none' ? null : value };
      if (name === 'type') {
        updated.categoryId = ''; // Reset category if type changes
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        toast({ title: "Éxito", description: "Transacción actualizada correctamente." });
        router.push('/transactions');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar la transacción.');
      }
    } catch (error: any) {
      console.error('An error occurred:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  if (fetching || !formData) {
    return <div className="p-8 text-center">Cargando información de la transacción...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">Editar Transacción</h1>
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Actualizar Detalles</CardTitle>
            <CardDescription>Modifica los datos de la transacción.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select name="type" onValueChange={(value) => handleSelectChange('type', value)} value={formData.type}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría</Label>
              <Select name="categoryId" onValueChange={(value) => handleSelectChange('categoryId', value)} value={formData.categoryId}>
                <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="eventId">Evento (Opcional)</Label>
              <Select name="eventId" onValueChange={(value) => handleSelectChange('eventId', value)} value={formData.eventId ?? 'none'}>
                <SelectTrigger><SelectValue placeholder="Asociar a un evento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="memberId">Miembro (Opcional)</Label>
              <Select name="memberId" onValueChange={(value) => handleSelectChange('memberId', value)} value={formData.memberId ?? 'none'}>
                <SelectTrigger><SelectValue placeholder="Asociar a un miembro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Transacción'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
