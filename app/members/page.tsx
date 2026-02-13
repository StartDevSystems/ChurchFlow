"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Member {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'all' | 'Joven' | 'Directiva'>('all'); // New state for filtering

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterRole === 'all' ? '/api/members' : `/api/members?role=${filterRole}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterRole]); // Dependency on filterRole

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleDeleteMember = async (id: string) => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembers((prevMembers) => prevMembers.filter((member) => member.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete member');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      alert('An error occurred while deleting the member.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Miembros</h1>
        <Link href="/members/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Miembro
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Miembros</CardTitle>
          {/* Filter Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button variant={filterRole === 'all' ? 'default' : 'secondary'} onClick={() => setFilterRole('all')}>Todos</Button>
            <Button variant={filterRole === 'Joven' ? 'default' : 'secondary'} onClick={() => setFilterRole('Joven')}>Jóvenes</Button>
            <Button variant={filterRole === 'Directiva' ? 'default' : 'secondary'} onClick={() => setFilterRole('Directiva')}>Directiva</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando miembros...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          member.role === 'Directiva' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {member.role}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(member.createdAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/members/edit/${member.id}`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente al miembro.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMember(member.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No se encontraron miembros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
