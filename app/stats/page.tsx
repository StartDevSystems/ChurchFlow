'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { formatCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

// Updated interfaces to match the new API response
interface MonthlyBreakdown {
  month: string;
  income: number;
  expense: number;
}

interface MemberStats {
  memberId: string;
  memberName: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#f8fafc' : '#020617';
  const tooltipBg = theme === 'dark' ? 'hsl(240 10% 3.9%)' : '#ffffff';

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data: MemberStats[] = await response.json();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Cargando estadísticas...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Perfil Financiero por Miembro</h1>
          <p className="text-muted-foreground">Un resumen de todos los ingresos y gastos asociados a cada miembro.</p>
        </div>
      </div>

      {stats.length === 0 && !loading ? (
         <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>No se encontraron transacciones asociadas a miembros para mostrar estadísticas.</p>
            </CardContent>
         </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stats.map((member) => (
            <Card key={member.memberId} className="flex flex-col">
              <CardHeader>
                <CardTitle>{member.memberName}</CardTitle>
                <CardDescription>Balance Neto</CardDescription>
                <p className={`text-3xl font-bold ${member.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(member.netBalance)}
                </p>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="text-sm flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center"><ArrowUp className="h-4 w-4 mr-1 text-green-500"/> Total Aportes</span>
                    <span className="font-semibold text-green-600">{formatCurrency(member.totalIncome)}</span>
                </div>
                 <div className="text-sm flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center"><ArrowDown className="h-4 w-4 mr-1 text-red-500"/> Total Gastos</span>
                    <span className="font-semibold text-red-600">{formatCurrency(member.totalExpense)}</span>
                </div>
              </CardContent>
              <CardFooter>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">Ver Desglose Mensual</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Perfil Financiero de {member.memberName}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Desglose de ingresos y gastos mensuales asociados al miembro.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4 h-80">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={member.monthlyBreakdown} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="month" stroke={textColor} fontSize={12} />
                            <YAxis stroke={textColor} fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip
                              formatter={(value: any, name: string) => [formatCurrency(Number(value || 0)), name === 'income' ? 'Ingresos' : 'Gastos']}
                              contentStyle={{ backgroundColor: tooltipBg, borderColor: 'hsl(var(--border))' }}
                              labelStyle={{ color: textColor }}
                              cursor={{ fill: 'hsl(var(--accent))', opacity: 0.5 }}
                            />
                            <Legend formatter={(value) => <span className="capitalize" style={{color: textColor}}>{value === 'income' ? 'Ingresos' : 'Gastos'}</span>}/>
                            <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cerrar</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}