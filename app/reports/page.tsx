"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar as CalendarIcon, FileText, Download, Filter, Search, Loader2, ArrowUpCircle, ArrowDownCircle, PieChart } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/report?from=${range.from}&to=${range.to}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Conciliando cuentas...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-0">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between md:items-end gap-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
            Centro de <span className="text-[var(--brand-primary)]">Reportes</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#8c7f72] mt-4">Auditoría y control de flujo de caja</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-[#13151f] p-4 rounded-[2.5rem] border-2 border-white/5 shadow-2xl">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-gray-500 uppercase ml-2">Desde</span>
            <input type="date" value={range.from} onChange={e => setRange({...range, from: e.target.value})} className="bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand-primary)] color-scheme-dark" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-gray-500 uppercase ml-2">Hasta</span>
            <input type="date" value={range.to} onChange={e => setRange({...range, to: e.target.value})} className="bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand-primary)] color-scheme-dark" />
          </div>
          <Button onClick={() => window.print()} className="bg-[var(--brand-primary)] text-white px-8 py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 transition-all">
            <Download size={16} className="mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="rounded-[3rem] bg-green-500 text-white p-8 relative overflow-hidden group shadow-2xl">
              <ArrowUpCircle className="absolute top-[-20px] right-[-20px] h-40 w-40 opacity-10 rotate-12" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Ingresos del Periodo</p>
              <h3 className="text-5xl font-black italic tracking-tighter">{formatCurrency(data.summary.totalIncome)}</h3>
            </Card>

            <Card className="rounded-[3rem] bg-red-500 text-white p-8 relative overflow-hidden group shadow-2xl">
              <ArrowDownCircle className="absolute top-[-20px] right-[-20px] h-40 w-40 opacity-10 rotate-12" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Gastos del Periodo</p>
              <h3 className="text-5xl font-black italic tracking-tighter">{formatCurrency(data.summary.totalExpense)}</h3>
            </Card>

            <Card className="rounded-[3rem] bg-[#1a1714] text-white p-8 border-4 border-[var(--brand-primary)] shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] mb-2">Balance Neto</p>
              <h3 className={cn("text-5xl font-black italic tracking-tighter", data.summary.netBalance >= 0 ? "text-green-400" : "text-red-400")}>
                {formatCurrency(data.summary.netBalance)}
              </h3>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Categorías */}
            <Card className="lg:col-span-5 rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-xl">
              <CardHeader className="px-0 pb-8 border-b border-white/5 mb-6">
                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                  <PieChart className="text-[var(--brand-primary)]" /> Resumen por Categorías
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {data.categories.map((cat: any) => (
                  <div key={cat.name} className="group">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <p className="text-[10px] font-black uppercase text-gray-400">{cat.name}</p>
                      <p className={cn("text-xs font-black", cat.type === 'income' ? "text-green-500" : "text-red-500")}>
                        {formatCurrency(cat.total)}
                      </p>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", cat.type === 'income' ? "bg-green-500" : "bg-red-500")} style={{ width: `${Math.min(100, (cat.total / (cat.type === 'income' ? data.summary.totalIncome : data.summary.totalExpense)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Listado de Operaciones */}
            <Card className="lg:col-span-7 rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-xl">
              <CardHeader className="px-0 pb-8 border-b border-white/5 mb-6">
                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                  <FileText className="text-blue-500" /> Detalle de Movimientos
                </CardTitle>
              </CardHeader>
              <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                {data.transactions.map((t: any) => (
                  <div key={t.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/[0.05] transition-all">
                    <div>
                      <p className="text-[8px] font-black text-gray-500 uppercase">{format(new Date(t.date), 'dd MMM yyyy', { locale: es })}</p>
                      <p className="text-xs font-black text-white uppercase truncate max-w-[250px]">{t.description}</p>
                    </div>
                    <p className={cn("font-black italic text-sm", t.type === 'income' ? "text-green-500" : "text-red-500")}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
