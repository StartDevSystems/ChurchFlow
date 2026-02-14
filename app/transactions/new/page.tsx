'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';

interface Member {
  id: string;
  name: string;
  role: string;
}

interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
}

export default function NewTransactionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    memberId: '',
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [youngMembers, setYoungMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedYoungMembers, setSelectedYoungMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived state to check if the selected category is 'Cuota'
  const selectedCategoryName = useMemo(() => {
    return categories.find(c => c.id === formData.categoryId)?.name || '';
  }, [formData.categoryId, categories]);
  const isDuesCategory = selectedCategoryName.toLowerCase() === 'cuota';
  
  // Filter categories based on the selected transaction type
  const availableCategories = useMemo(() => {
    return categories.filter(c => c.type === formData.type);
  }, [formData.type, categories]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [membersRes, categoriesRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/categories'),
        ]);

        if (membersRes.ok) {
          const membersData: Member[] = await membersRes.json();
          setMembers(membersData);
          setYoungMembers(membersData.filter(member => member.role === 'Joven'));
        }
        if (categoriesRes.ok) {
          const categoriesData: Category[] = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Failed to fetch initial data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
     // Reset category if type changes
    if (name === 'type') {
      setFormData((prev) => ({ ...prev, categoryId: '' }));
    }
  };
  
  const handleYoungMemberSelection = (memberId: string, isChecked: boolean) => {
    setSelectedYoungMembers((prev) =>
      isChecked ? [...prev, memberId] : prev.filter((id) => id !== memberId)
    );
  };

  const handleSelectAllYoungMembers = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedYoungMembers(youngMembers.map(member => member.id));
    } else {
      setSelectedYoungMembers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.categoryId) {
        alert('Por favor, selecciona una categoría.');
        setLoading(false);
        return;
    }

    try {
      if (isDuesCategory) {
        if (selectedYoungMembers.length === 0) {
          alert('Por favor, selecciona al menos un joven para la cuota.');
          setLoading(false);
          return;
        }

        const transactionsToCreate = selectedYoungMembers.map(memberId => ({
          type: formData.type,
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date),
          description: formData.description,
          memberId: memberId,
        }));

        // Using Promise.all to send all requests in parallel
        await Promise.all(
          transactionsToCreate.map(transaction =>
            fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(transaction),
            }).then(res => {
                if (!res.ok) throw new Error('Failed to create one or more transactions.');
            })
          )
        );
        router.push('/transactions');

      } else {
        // Single transaction creation logic
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount),
            date: new Date(formData.date),
            memberId: formData.memberId === 'none' ? null : formData.memberId || null,
          }),
        });

        if (response.ok) {
          router.push('/transactions');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create transaction.');
        }
      }
    } catch (error: any) {
      console.error('An error occurred:', error);
      alert(`Ocurrió un error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && (members.length === 0 || categories.length === 0)) {
      return <p>Cargando datos iniciales...</p>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">Crear Nueva Transacción</h1>
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Detalles de la Transacción</CardTitle>
            <CardDescription>Completa los datos para registrar una nueva transacción.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select name="type" onValueChange={(value) => handleSelectChange('type', value)} defaultValue={formData.type}>
                <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría</Label>
               <Select name="categoryId" onValueChange={(value) => handleSelectChange('categoryId', value)} value={formData.categoryId}>
                <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>
                  {availableCategories.length === 0 && <p className='p-4 text-sm text-muted-foreground'>No hay categorías de {formData.type === 'income' ? 'ingresos' : 'gastos'}.</p>}
                  {availableCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe la transacción" required />
            </div>

            {isDuesCategory ? (
              <div className="col-span-full space-y-2">
                <Label>Jóvenes que aportaron a la Cuota</Label>
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="selectAllYoungMembers"
                    checked={selectedYoungMembers.length > 0 && selectedYoungMembers.length === youngMembers.length}
                    onCheckedChange={(checked) => handleSelectAllYoungMembers(!!checked)}
                  />
                  <Label htmlFor="selectAllYoungMembers" className="text-sm font-medium">Seleccionar Todos los Jóvenes</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                  {youngMembers.length > 0 ? (
                    youngMembers.map(member => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox id={`member-${member.id}`} checked={selectedYoungMembers.includes(member.id)} onCheckedChange={(checked) => handleYoungMemberSelection(member.id, !!checked)} />
                        <Label htmlFor={`member-${member.id}`} className="text-sm font-medium">{member.name}</Label>
                      </div>
                    ))
                  ) : <p className="col-span-full text-sm text-muted-foreground">No hay jóvenes disponibles.</p>}
                </div>
              </div>
            ) : (
              <div className="col-span-full space-y-2">
                <Label htmlFor="memberId">Miembro (Opcional)</Label>
                <Select name="memberId" onValueChange={(value) => handleSelectChange('memberId', value)} value={formData.memberId || 'none'}>
                  <SelectTrigger><SelectValue placeholder="Asociar a un miembro" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Transacción'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
