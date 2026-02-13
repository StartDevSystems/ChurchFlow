'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Calendar } from '@/components/ui/Calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { CalendarIcon, Download, ArrowDown, ArrowUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface ReportData {
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      alert('Por favor, seleccione un rango de fechas.');
      return;
    }
    setLoading(true);
    setReportData(null);
    try {
      const response = await fetch('/api/transactions/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        console.error('Failed to generate report');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!reportData || !startDate || !endDate) return;

    const doc = new jsPDF();
    const { transactions, totalIncome, totalExpenses, balance } = reportData;

    doc.text('Reporte Financiero', 14, 16);
    doc.setFontSize(10);
    doc.text(`Periodo: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 14, 24);
    
    doc.setFontSize(12);
    doc.text(`Resumen Financiero`, 14, 36);
    doc.setFontSize(10);
    doc.text(`- Ingresos Totales: ${formatCurrency(totalIncome)}`, 14, 44);
    doc.text(`- Gastos Totales: ${formatCurrency(totalExpenses)}`, 14, 50);
    doc.text(`- Balance: ${formatCurrency(balance)}`, 14, 56);

    (doc as any).autoTable({
      startY: 64,
      head: [['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']],
      body: transactions.map(t => [
        format(new Date(t.date), 'dd/MM/yyyy'),
        t.description,
        t.category,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        formatCurrency(t.amount)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save(`reporte_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Reportes Financieros</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Periodo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP', { locale: es }) : <span>Fecha de inicio</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP', { locale: es }) : <span>Fecha de fin</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
          </Popover>

          <Button onClick={handleGenerateReport} disabled={loading || !startDate || !endDate}>
            {loading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>Resultados del Reporte</CardTitle>
              <p className="text-sm text-muted-foreground">
                Periodo del {startDate && format(startDate, 'dd/MM/yyyy')} al {endDate && format(endDate, 'dd/MM/yyyy')}
              </p>
            </div>
            <Button onClick={handleDownloadPdf} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
                  <ArrowUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{formatCurrency(reportData.totalIncome)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
                  <ArrowDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{formatCurrency(reportData.totalExpenses)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{formatCurrency(reportData.balance)}</div></CardContent>
              </Card>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Monto</TableHead></TableRow></TableHeader>
              <TableBody>
                {reportData.transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>{formatCurrency(t.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
