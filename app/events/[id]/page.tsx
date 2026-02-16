'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { ArrowDown, ArrowUp, DollarSign, CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/AlertDialog";

// --- TYPE DEFINITIONS ---
interface Event {
  id: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: { name: string };
  amount: number;
  date: string;
  description: string;
}

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// --- MAIN COMPONENT ---
export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  // --- STATE MANAGEMENT ---
  // Financial State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState({ income: 0, expense: 0, net: 0 });

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [eventRes, transRes] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch(`/api/transactions?eventId=${id}`)
        ]);

        if (!eventRes.ok) throw new Error('Failed to fetch event details.');
        const eventData: Event = await eventRes.json();
        
        // Populate form fields
        setName(eventData.name);
        setDescription(eventData.description || '');
        setStartDate(new Date(eventData.startDate));
        setEndDate(eventData.endDate ? new Date(eventData.endDate) : undefined);

        if (!transRes.ok) throw new Error('Failed to fetch event transactions.');
        const transData: Transaction[] = await transRes.json();
        console.log('--- DEBUG: Fetched Transactions ---', transData);
        setTransactions(transData);

        // Calculate balance
        const totalIncome = transData.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const totalExpense = transData.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        console.log('--- DEBUG: Calculated Totals ---', { totalIncome, totalExpense });
        setBalance({ income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense });

      } catch (error: any) {
        console.error('--- DEBUG: Error in fetchData ---', error);
        toast({ title: "Error", description: "No se pudieron cargar los datos del evento.", variant: "destructive" });
        router.push('/events');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, router, toast]);

  // --- EVENT HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, startDate, endDate }),
      });
      if (!response.ok) throw new Error('Failed to update event');
      toast({ title: "Éxito", description: "Evento actualizado correctamente." });
      router.refresh(); // Refresh data on the page
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
      toast({ title: "Éxito", description: "Evento eliminado." });
      router.push('/events');
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return <p>Cargando detalles del evento...</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Detalles del Evento</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Ingresos</CardTitle><ArrowUp className="text-green-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(balance.income)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Gastos</CardTitle><ArrowDown className="text-red-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(balance.expense)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Balance Neto</CardTitle><DollarSign className="text-gray-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(balance.net)}</div></CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader><CardTitle>Editar Evento</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Nombre del Evento</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fecha de Inicio</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP", { locale: es }) : <span>Selecciona fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={es} /></PopoverContent></Popover>
              </div>
              <div>
                <Label>Fecha de Fin</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !endDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP", { locale: es }) : <span>Selecciona fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} /></PopoverContent></Popover>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Button>
              <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Eliminar</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer y eliminará el evento.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones del Evento</CardTitle>
          <CardDescription>Movimientos financieros asociados a este evento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Categoría</TableHead><TableHead>Tipo</TableHead><TableHead>Monto</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>{t.category.name}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.type === 'income' ? 'Ingreso' : 'Gasto'}</span></TableCell>
                    <TableCell className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>{formatCurrency(t.amount)}</TableCell>
                    <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center">No hay transacciones para este evento.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
