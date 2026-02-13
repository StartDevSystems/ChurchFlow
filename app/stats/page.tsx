'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { formatCurrency } from '@/lib/utils'; // Assuming you have this utility function

interface MonthlyContribution {
  month: string;
  total: number;
}

interface MemberStats {
  memberId: string;
  memberName: string;
  totalContribution: number;
  monthlyContributions: MonthlyContribution[];
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
        // Here you might want to set an error state and display a message
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Estadísticas de Aportes</h1>
          <p className="text-muted-foreground">Un resumen de las contribuciones de "Cuota" por miembro.</p>
        </div>
      </div>

      {stats.length === 0 && !loading ? (
         <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>No se encontraron datos de "Cuota" para mostrar estadísticas.</p>
            </CardContent>
         </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stats.map((member) => (
            <Card key={member.memberId}>
              <CardHeader>
                <CardTitle>{member.memberName}</CardTitle>
                <CardDescription>Total Aportado</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(member.totalContribution)}</p>
              </CardContent>
              <CardFooter>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">Ver Detalles</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Estadísticas de {member.memberName}</AlertDialogTitle>
                      <AlertDialogDescription>
                        Desglose de aportes mensuales de la categoría "Cuota".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4 h-80">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={member.monthlyContributions} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="month" stroke={textColor} fontSize={12} />
                            <YAxis stroke={textColor} fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip
                              formatter={(value: number) => [formatCurrency(value), "Aporte"]}
                              contentStyle={{ backgroundColor: tooltipBg, borderColor: 'hsl(var(--border))' }}
                              labelStyle={{ color: textColor }}
                              cursor={{ fill: 'hsl(var(--accent))', opacity: 0.5 }}
                            />
                            <Bar dataKey="total" name="Aporte Mensual" fill="#22c55e" radius={[4, 4, 0, 0]} />
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