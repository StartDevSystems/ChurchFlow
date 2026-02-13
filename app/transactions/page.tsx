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

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TransactionType>('all');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/transactions' : `/api/transactions?type=${filter}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert('Failed to delete transaction.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      alert('An error occurred while deleting the transaction.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Transacciones</h1>
        <Link href="/transactions/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Transacción
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Transacciones</CardTitle>
          <div className="flex space-x-2 pt-4">
            <Button variant={filter === 'all' ? 'default' : 'secondary'} onClick={() => setFilter('all')}>Todas</Button>
            <Button variant={filter === 'income' ? 'default' : 'secondary'} onClick={() => setFilter('income')}>Ingresos</Button>
            <Button variant={filter === 'expense' ? 'default' : 'secondary'} onClick={() => setFilter('expense')}>Gastos</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando transacciones...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </TableCell>
                      <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/transactions/edit/${transaction.id}`}>
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
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la transacción.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTransaction(transaction.id)}
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
                      No se encontraron transacciones.
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
