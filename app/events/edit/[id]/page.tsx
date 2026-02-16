'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { format } from 'date-fns';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/AlertDialog";

interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) throw new Error('Failed to fetch event');
        const data: Event = await response.json();
        setName(data.name);
        setDescription(data.description || '');
        setStartDate(new Date(data.startDate));
        setEndDate(data.endDate ? new Date(data.endDate) : undefined);
      } catch (err: any) {
        toast({
          title: "Error al cargar evento",
          description: err.message,
          variant: "destructive",
        });
        router.push('/events'); // Redirect if event not found or error
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!name || !startDate) {
      toast({
        title: "Error al actualizar evento",
        description: "El nombre y la fecha de inicio son obligatorios.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

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

      toast({
        title: "Evento actualizado",
        description: `El evento '${name}' ha sido actualizado con éxito.`,
      });
      router.push('/events');
    } catch (err: any) {
      toast({
        title: "Error al actualizar evento",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete event');
      }

      toast({
        title: "Evento eliminado",
        description: `El evento '${name}' ha sido eliminado con éxito.`,
      });
      router.push('/events');
    } catch (err: any) {
      toast({
        title: "Error al eliminar evento",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <p>Cargando evento...</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Editar Evento</h1>

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
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="endDate">Fecha de Fin (Opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={es}
                    />
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
                                Esta acción no se puede deshacer. Se eliminará el evento &quot;{name}&quot; y **se desvincularán todas las transacciones asociadas a él**.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                                Eliminar
                            </AlertDialogAction>
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
