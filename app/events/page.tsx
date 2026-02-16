'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/AlertDialog";
import { useToast } from '@/components/ui/use-toast';

interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (err: any) {
      toast({
        title: "Error al cargar eventos",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, setEvents, toast]); // Dependencies for useCallback

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDeleteEvent = async (id: string) => {
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
        description: "El evento ha sido eliminado con éxito.",
      });
      await fetchEvents(); // Refresh list
    } catch (err: any) {
      toast({
        title: "Error al eliminar evento",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Eventos Financieros</h1>
        <Link href="/events/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Evento
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando eventos...</p>
          ) : events.length === 0 ? (
            <p>No hay eventos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha de Inicio</TableHead>
                    <TableHead>Fecha de Fin</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        <Link href={`/events/${event.id}`} className="hover:underline">
                          {event.name}
                        </Link>
                      </TableCell>
                      <TableCell>{event.description || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(event.startDate), 'PPP', { locale: es })}</TableCell>
                      <TableCell>{event.endDate ? format(new Date(event.endDate), 'PPP', { locale: es }) : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/events/edit/${event.id}`}>
                            <Button variant="ghost" size="icon" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" title="Eliminar">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará el evento &quot;{event.name}&quot; y **se desvincularán todas las transacciones asociadas a él**.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
