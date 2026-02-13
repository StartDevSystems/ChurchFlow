'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { format } from 'date-fns';

interface Member {
  id: string;
  name: string;
}

interface TransactionData {
  type: 'income' | 'expense';
  category: string;
  amount: string;
  date: string;
  description: string;
  memberId: string | null;
}

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formData, setFormData] = useState<TransactionData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchInitialData() {
      try {
        // Fetch transaction details
        const transactionResponse = await fetch(`/api/transactions/${id}`);
        if (transactionResponse.ok) {
          const data = await transactionResponse.json();
          setFormData({
            ...data,
            amount: data.amount.toString(),
            date: format(new Date(data.date), 'yyyy-MM-dd'),
          });
        } else {
          console.error('Failed to fetch transaction');
          alert('No se pudo cargar la transacción.');
          router.push('/transactions');
          return;
        }

        // Fetch members
        const membersResponse = await fetch('/api/members');
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setFetching(false);
      }
    }

    fetchInitialData();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
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
          memberId: formData.memberId === 'none' ? null : formData.memberId,
        }),
      });

      if (response.ok) {
        router.push('/transactions');
      } else {
        alert('Failed to update transaction.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (fetching || !formData) {
    return <div>Cargando información de la transacción...</div>;
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
              <Label htmlFor="category">Categoría</Label>
              <Input id="category" name="category" value={formData.category} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleChange} required />
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
              <Label htmlFor="memberId">Miembro (Opcional)</Label>
              <Select name="memberId" onValueChange={(value) => handleSelectChange('memberId', value)} value={formData.memberId ?? 'none'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
