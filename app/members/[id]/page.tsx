'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Edit, ArrowLeftCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface MemberDetail {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
  transactions: Transaction[];
}

const CUOTA_CATEGORY = 'Cuota'; // Define the cuota category

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchMemberDetails() {
      try {
        const response = await fetch(`/api/members/${id}`);
        if (response.ok) {
          const data = await response.json();
          setMember(data);
        } else {
          console.error('Failed to fetch member details');
          alert('No se pudo cargar la información del miembro.');
          router.push('/members');
        }
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMemberDetails();
  }, [id, router]);

  const totalCuotaContributed = member
    ? member.transactions
        .filter((t) => t.type === 'income' && t.category === CUOTA_CATEGORY)
        .reduce((sum, t) => sum + t.amount, 0)
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <div>Cargando detalles del miembro...</div>;
  }

  if (!member) {
    return <div>No se encontró el miembro.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/members')}>
          <ArrowLeftCircle className="mr-2 h-4 w-4" />
          Volver a Miembros
        </Button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Detalles de {member.name}</h1>
        <Link href={`/members/edit/${member.id}`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar Miembro
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>Detalles básicos del miembro.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Nombre:</p>
            <p>{member.name}</p>
          </div>
          <div>
            <p className="font-medium">Teléfono:</p>
            <p>{member.phone}</p>
          </div>
          <div>
            <p className="font-medium">Rol:</p>
            <p>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                member.role === 'Directiva'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {member.role}
              </span>
            </p>
          </div>
          <div>
            <p className="font-medium">Miembro Desde:</p>
            <p>{format(new Date(member.createdAt), 'dd/MM/yyyy')}</p>
          </div>
        </CardContent>
      </Card>

      {member.role === 'Joven' && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Cuota</CardTitle>
            <CardDescription>Total aportado para la cuota.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCuotaContributed)}</p>
            <p className="text-sm text-muted-foreground">de {formatCurrency(160)} meta</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Todas las transacciones asociadas a este miembro.</CardDescription>
        </CardHeader>
        <CardContent>
          {member.transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {member.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        transaction.type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No hay transacciones registradas para este miembro.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
