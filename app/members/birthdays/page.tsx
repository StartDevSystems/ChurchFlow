"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Cake, CalendarDays, Loader2, ArrowLeft, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MonthGroup {
  index: number;
  name: string;
  members: { id: string; name: string; day: number; role: string }[];
}

export default function BirthdaysAgendaPage() {
  const [data, setData] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch('/api/members/all-birthdays');
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-500/50">Cargando Agenda...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="mb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase text-gray-500 hover:text-[var(--brand-primary)] transition-colors mb-6">
          <ArrowLeft size={14} /> Volver al Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="bg-pink-500 text-white p-4 rounded-[2rem] shadow-2xl shadow-pink-500/20">
            <CalendarDays size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1a1714] dark:text-white uppercase tracking-tighter italic">
              Agenda de <span className="text-pink-500">Cumpleaños</span>
            </h1>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#8c7f72] mt-1">Calendario anual de celebraciones</p>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <Card className="rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800 p-20 text-center">
          <PartyPopper size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-black text-gray-400 uppercase italic">No hay cumpleaños registrados aún</p>
          <Link href="/members" className="mt-4 inline-block text-xs font-black text-pink-500 underline uppercase">Registrar fechas en miembros</Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((month) => (
            <div key={month.index} className="space-y-4">
              <h2 className="text-xl font-black uppercase italic text-[#1a1714] dark:text-white flex items-center gap-2 px-2">
                <span className="text-pink-500">/</span> {month.name}
              </h2>
              <div className="grid gap-3">
                {month.members.map((m) => (
                  <Card key={m.id} className="rounded-[2.2rem] border-2 border-[#e8e2d9] dark:border-gray-800 hover:border-pink-500 transition-all group overflow-hidden relative shadow-sm hover:shadow-lg">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-[#f7f4ef] dark:bg-gray-900 flex flex-col items-center justify-center font-black text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-inner border border-transparent group-hover:border-pink-400">
                          <span className="text-[18px] leading-none">{m.day}</span>
                        </div>
                        <div>
                          <p className="font-black uppercase text-lg italic tracking-tighter leading-none mb-1">{m.name}</p>
                          <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-[9px] font-black uppercase tracking-widest">{m.role}</span>
                        </div>
                      </div>
                      <Cake size={20} className="text-pink-500 opacity-0 group-hover:opacity-100 transition-all mr-3 animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
