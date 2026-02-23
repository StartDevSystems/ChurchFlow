'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Textarea } from '@/components/ui/Textarea';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { format } from 'date-fns';
import { CalendarIcon, Trash2, ArrowUp, ArrowDown, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/AlertDialog";

// --- TYPE DEFINITIONS ---
interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: { name: string };
  amount: number;
  date: string;
  description: string;
  member?: { id: string; name: string } | null;
}

interface MemberContribution {
  memberId: string;
  memberName: string;
  totalContributed: number;
  txCount: number;
}

// --- HELPERS ---
const fmt = (amount: number) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0,
  }).format(amount);

// --- MAIN COMPONENT ---
export default function EditEventPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState({ income: 0, expense: 0, net: 0 });
  const [memberContributions, setMemberContributions] = useState<MemberContribution[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventRes, transRes] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch(`/api/transactions?eventId=${id}`),
        ]);

        if (!eventRes.ok) throw new Error('Failed to fetch event');
        const data: Event = await eventRes.json();
        setName(data.name);
        setDescription(data.description || '');
        setStartDate(new Date(data.startDate));
        setEndDate(data.endDate ? new Date(data.endDate) : undefined);

        if (!transRes.ok) throw new Error('Failed to fetch transactions');
        const transData: Transaction[] = await transRes.json();
        setTransactions(transData);

        // Calcular balance
        const totalIncome = transData.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const totalExpense = transData.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        setBalance({ income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense });

        // Calcular aportes por miembro (solo ingresos con miembro asociado)
        const incomeWithMember = transData.filter(t => t.type === 'income' && t.member);
        const contributionMap = new Map<string, MemberContribution>();
        incomeWithMember.forEach(t => {
          const key = t.member!.id;
          if (!contributionMap.has(key)) {
            contributionMap.set(key, {
              memberId: t.member!.id,
              memberName: t.member!.name,
              totalContributed: 0,
              txCount: 0,
            });
          }
          const entry = contributionMap.get(key)!;
          entry.totalContributed += t.amount;
          entry.txCount += 1;
        });
        const sorted = Array.from(contributionMap.values()).sort(
          (a, b) => b.totalContributed - a.totalContributed
        );
        setMemberContributions(sorted);

      } catch (err: any) {
        toast({ title: "Error al cargar evento", description: err.message, variant: "destructive" });
        router.push('/events');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router, toast]);

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate) {
      toast({ title: "Error", description: "El nombre y la fecha de inicio son obligatorios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          startDate: startDate?.toISOString(),
          endDate: endDate ? endDate.toISOString() : null,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update event');
      }
      toast({ title: "Evento actualizado", description: `El evento '${name}' ha sido actualizado con éxito.` });
      router.push('/events');
    } catch (err: any) {
      toast({ title: "Error al actualizar evento", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete event');
      }
      toast({ title: "Evento eliminado", description: `El evento '${name}' ha sido eliminado.` });
      router.push('/events');
    } catch (err: any) {
      toast({ title: "Error al eliminar evento", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const totalByMembers = memberContributions.reduce((acc, m) => acc + m.totalContributed, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Editar Evento</h1>

      {/* ── Balance Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ingresos</CardTitle>
            <ArrowUp className="text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(balance.income)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Gastos</CardTitle>
            <ArrowDown className="text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(balance.expense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Balance Neto</CardTitle>
            <DollarSign className="text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(balance.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Aportes por Miembro ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#e85d26]" />
                Aportes del Equipo
              </CardTitle>
              <CardDescription className="mt-1">
                Ingresos asociados a un miembro en este evento
              </CardDescription>
            </div>
            {memberContributions.length > 0 && (
              <div className="text-right">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">Total aportado</p>
                <p className="text-xl font-black text-[#e85d26]">{fmt(totalByMembers)}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {memberContributions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No hay ingresos asociados a miembros en este evento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Miembro</TableHead>
                  <TableHead className="text-center">Transacciones</TableHead>
                  <TableHead className="text-right">Total Aportado</TableHead>
                  <TableHead className="text-right">% del Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberContributions.map((m, i) => {
                  const percentage = totalByMembers > 0
                    ? ((m.totalContributed / totalByMembers) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <TableRow key={m.memberId}>
                      <TableCell className="text-gray-400 font-mono text-sm">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-[#e85d26]">
                            {m.memberName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{m.memberName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                          {m.txCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {fmt(m.totalContributed)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#e85d26]"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Transactions Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones del Evento</CardTitle>
          <CardDescription>Movimientos financieros asociados a este evento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Miembro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>{t.category.name}</TableCell>
                    <TableCell>
                      {t.member
                        ? <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.member.name}</span>
                        : <span className="text-xs text-gray-400">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </TableCell>
                    <TableCell className={t.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {fmt(t.amount)}
                    </TableCell>
                    <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No hay transacciones para este evento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Edit Form ── */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Nombre del Evento</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Campamento de Verano, Venta de Pasteles"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Una breve descripción del evento."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="endDate">Fecha de Fin (Opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={saving}>
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar Evento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar este evento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará el evento &quot;{name}&quot; y se desvincularán todas las transacciones asociadas a él.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type="button" variant="outline" onClick={() => router.push('/events')} className="ml-2">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}