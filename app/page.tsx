'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ArrowDown, ArrowUp, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Text } from 'recharts';
import { format, parseISO, set } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from 'next-themes';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface CategorySummary {
  category: string;
  total: number;
}

interface MonthlyData {
  month: string;
  Ingresos: number;
  Gastos: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A0', '#19FFED', '#FF6619'];

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [incomeCategories, setIncomeCategories] = useState<CategorySummary[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategorySummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#f8fafc' : '#020617'; // Use tailwind slate-50 and slate-950 for text
  const tooltipBg = theme === 'dark' ? 'hsl(240 10% 3.9%)' : '#ffffff'; // Use card background

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/transactions');
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const transactions: Transaction[] = await response.json();

        const totalIncome = transactions
          .filter((t) => t.type === 'income')
          .reduce((acc, t) => acc + t.amount, 0);

        const totalExpense = transactions
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => acc + t.amount, 0);
        
        setStats({
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
        });

        // Aggregate by categories
        const incomeMap = new Map<string, number>();
        const expenseMap = new Map<string, number>();

        transactions.forEach(t => {
          if (t.type === 'income') {
            incomeMap.set(t.category, (incomeMap.get(t.category) || 0) + t.amount);
          } else {
            expenseMap.set(t.category, (expenseMap.get(t.category) || 0) + t.amount);
          }
        });

        setIncomeCategories(Array.from(incomeMap, ([category, total]) => ({ category, total })));
        setExpenseCategories(Array.from(expenseMap, ([category, total]) => ({ category, total })));

        // Aggregate for monthly trends
        const monthlyDataMap = new Map<string, { Ingresos: number; Gastos: number }>();
        const monthNameMap: { [key: string]: number } = {
            'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
        };

        transactions.forEach(t => {
          const monthKey = format(parseISO(t.date), 'MMM yyyy', { locale: es });
          if (!monthlyDataMap.has(monthKey)) {
            monthlyDataMap.set(monthKey, { Ingresos: 0, Gastos: 0 });
          }
          const currentMonthData = monthlyDataMap.get(monthKey)!;
          if (t.type === 'income') {
            currentMonthData.Ingresos += t.amount;
          } else {
            currentMonthData.Gastos += t.amount;
          }
        });
        
        const sortedMonthlyData = Array.from(monthlyDataMap, ([month, data]) => ({ month, ...data }))
          .sort((a, b) => {
            const [monthA, yearA] = a.month.split(' ');
            const [monthB, yearB] = b.month.split(' ');
            const dateA = new Date(parseInt(yearA), monthNameMap[monthA.toLowerCase().replace('.','')], 1);
            const dateB = new Date(parseInt(yearB), monthNameMap[monthB.toLowerCase().replace('.','')], 1);
            return dateA.getTime() - dateB.getTime();
          });


        setMonthlyTrends(sortedMonthlyData);


        setRecentTransactions(transactions.slice(0, 5));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7; // Position label inside
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't render label if slice is too small

    return (
      <Text
        x={x}
        y={y}
        fill={textColor}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </Text>
    );
  };


  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard Principal</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpense)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Actual</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.balance)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia Mensual</CardTitle>
          <CardDescription>Ingresos y Gastos de los últimos meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis dataKey="month" stroke={textColor} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} stroke={textColor} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ backgroundColor: tooltipBg, borderColor: 'hsl(var(--border))' }}
                labelStyle={{ color: textColor }}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.5 }}
              />
              <Legend formatter={(value) => <span style={{ color: textColor }}>{value}</span>} />
              <Line type="monotone" dataKey="Ingresos" stroke="#22c55e" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="Gastos" stroke="#ef4444" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Categoría</CardTitle>
            <CardDescription>Desglose de ingresos por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            {incomeCategories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={incomeCategories}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {incomeCategories.map((entry, index) => (
                        <Cell key={`cell-income-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]} 
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: textColor }}
                    />
                    <Legend formatter={(value) => <span style={{ color: textColor }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="space-y-2 mt-4">
                  {incomeCategories.map((item) => (
                    <li key={item.category} className="flex justify-between">
                      <span>{item.category}</span>
                      <span className="font-medium text-green-600">{formatCurrency(item.total)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No hay ingresos categorizados.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
            <CardDescription>Desglose de gastos por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#82ca9d"
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-expense-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]} 
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: textColor }}
                    />
                     <Legend formatter={(value) => <span style={{ color: textColor }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="space-y-2 mt-4">
                  {expenseCategories.map((item) => (
                    <li key={item.category} className="flex justify-between">
                      <span>{item.category}</span>
                      <span className="font-medium text-red-600">{formatCurrency(item.total)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No hay gastos categorizados.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => (
                <div key={t.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{t.description}</p>
                    <p className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                  <p className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p>No hay transacciones recientes.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
