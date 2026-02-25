'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';
import {
  ArrowUp, PieChart as PieIcon, Users,
  TrendingUp, Loader2, Target, Award,
} from 'lucide-react';

/* ── Types ── */
interface CategoryStat {
  name:  string;
  type:  'income' | 'expense';
  value: number;
}

interface MemberStats {
  memberId:     string;
  memberName:   string;
  totalIncome:  number;
  totalExpense: number;
  netBalance:   number;
}

/* ── Brand colors for charts ── */
const COLORS = [
  '#FF6B1A', '#2a8a5e', '#1a4d8f',
  '#dc3545', '#a78bfa', '#f5a623', '#0e7490',
];

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0c14] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
      <p className="text-white font-black text-xs uppercase tracking-wide">{payload[0].name}</p>
      <p className="text-[var(--brand-primary)] font-black text-sm mt-1">
        {formatCurrency(Number(payload[0].value))}
      </p>
    </div>
  );
}

/* ── Custom legend ── */
function ChartLegend({ payload }: any) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-4">
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function StatsPage() {
  const [memberStats,   setMemberStats]   = useState<MemberStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [loading,       setLoading]       = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/stats/categories'),
      ]);
      if (mRes.ok) setMemberStats(await mRes.json());
      if (cRes.ok) setCategoryStats(await cRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const expensesOnly = categoryStats.filter(c => c.type === 'expense');
  const topExpense   = [...expensesOnly].sort((a, b) => b.value - a.value)[0];
  const sortedMembers = [...memberStats].sort((a, b) => b.totalIncome - a.totalIncome);

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-[#8c7f72]">
      <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
      <p className="text-xs font-black uppercase tracking-[0.3em]">Generando inteligencia financiera...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-0">

      {/* ── Header ── */}
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
          Análisis <span className="text-[var(--brand-primary)]">Estratégico</span>
        </h1>
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#8c7f72] mt-4">
          Inteligencia de datos para el crecimiento ministerial
        </p>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

        {/* Donut chart — Distribución de Gastos
            FIX: explicit min-h on CardContent + wrapper div with fixed px height.
            ResponsiveContainer needs a parent with a determined height, NOT % height.
            Using h-[360px] on the wrapper guarantees Recharts gets width > 0. */}
        <Card className="lg:col-span-8 rounded-[3rem] bg-[#13151f] border-2 border-white/5 shadow-2xl overflow-hidden hover:border-[var(--brand-primary)]/30 transition-all">
          <CardHeader className="p-8 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--brand-primary)]/10 rounded-2xl text-[var(--brand-primary)]">
                <PieIcon size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl font-black uppercase italic">
                  Distribución de Gastos
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  ¿Hacia dónde fluye el capital?
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {expensesOnly.length === 0 ? (
              <div className="h-[360px] flex items-center justify-center">
                <p className="text-white/20 text-xs font-black uppercase tracking-widest">
                  Sin datos de gastos
                </p>
              </div>
            ) : (
              /* KEY FIX: wrapper has explicit pixel height → ResponsiveContainer works */
              <div className="w-full h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesOnly}
                      innerRadius="60%"
                      outerRadius="82%"
                      paddingAngle={6}
                      dataKey="value"
                      nameKey="name"
                      animationBegin={0}
                      animationDuration={1400}
                    >
                      {expensesOnly.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend content={<ChartLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right widgets */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Top expense card */}
          <Card className="flex-1 rounded-[3rem] bg-[var(--brand-primary)] text-white p-8 relative overflow-hidden hover:scale-[1.02] transition-all">
            <TrendingUp className="absolute top-[-20px] right-[-20px] h-48 w-48 opacity-10 rotate-12" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
                Mayor Gasto Histórico
              </p>
              {topExpense ? (
                <>
                  <h3 className="text-4xl font-black italic uppercase leading-[0.9] mb-4">
                    {topExpense.name}
                  </h3>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 inline-block">
                    <p className="text-3xl font-black">{formatCurrency(topExpense.value)}</p>
                  </div>
                </>
              ) : (
                <p className="font-black uppercase italic">Sin datos</p>
              )}
            </div>
          </Card>

          {/* Members count */}
          <Card className="rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <Users size={20} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Participación
              </p>
            </div>
            <h4 className="text-5xl font-black italic text-white leading-none mb-2">
              {memberStats.length}
            </h4>
            <p className="text-[10px] font-black uppercase text-blue-400">
              Jóvenes activos con aportes
            </p>
          </Card>
        </div>
      </div>

      {/* ── Ranking de Aportantes ── */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500">
            <Award size={24} />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">
            Ranking de Impacto
          </h2>
        </div>

        {sortedMembers.length === 0 ? (
          <p className="text-white/20 text-sm font-black uppercase tracking-widest text-center py-16">
            Sin miembros con aportes registrados
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedMembers.map((member, index) => {
              const topIncome = sortedMembers[0]?.totalIncome || 1;
              const pct = Math.round((member.totalIncome / topIncome) * 100);
              return (
                <Card
                  key={member.memberId}
                  className="rounded-[2.5rem] bg-[#13151f] border-2 border-white/5 hover:border-[var(--brand-primary)] transition-all overflow-hidden shadow-xl"
                >
                  {/* Progress bar at top */}
                  <div className="h-1.5 bg-white/5 w-full">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-orange-300 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-gray-600 uppercase">
                        #{index + 1}
                      </span>
                      <div className={cn(
                        'p-1.5 rounded-lg',
                        member.netBalance >= 0
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      )}>
                        <Target size={14} />
                      </div>
                    </div>

                    <h3 className="text-lg font-black uppercase italic truncate mb-1 text-white">
                      {member.memberName}
                    </h3>
                    <p className="text-3xl font-black italic tracking-tighter text-[var(--brand-primary)]">
                      {formatCurrency(member.totalIncome)}
                    </p>

                    {/* Net balance line */}
                    <p className={cn(
                      'text-[10px] font-black uppercase mt-2',
                      member.netBalance >= 0 ? 'text-green-500/70' : 'text-red-500/70'
                    )}>
                      Neto: {formatCurrency(member.netBalance)}
                    </p>

                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                      <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest italic">
                        Inversión Ministerial
                      </p>
                      <ArrowUp size={12} className="text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}