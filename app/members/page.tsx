"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
import { PlusCircle, Edit, Trash2, Search, Cake, Phone, QrCode, X, Download, FileSpreadsheet, Loader2, UserCircle2, MessageCircle, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Member {
  id: string;
  name: string;
  phone: string;
  role: string;
  birthDate?: string | null;
  createdAt: string;
}

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'all' | 'Joven' | 'Directiva'>('all');
  const [search, setSearch] = useState('');
  const [selectedMemberQR, setSelectedMemberQR] = useState<Member | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterRole === 'all' ? '/api/members' : `/api/members?role=${filterRole}`;
      const response = await fetch(url);
      if (response.ok) setMembers(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterRole]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleDeleteMember = async (id: string) => {
    try {
      const response = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (response.ok) setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (error) { console.error(error); }
  };

  const sendWhatsAppReminder = (member: Member) => {
    const message = `¡Dios te bendiga, ${member.name}! \uD83D\uDE4C Te escribo por aquí para saludarte y recordarte tu cuota del ministerio. ¡Contamos contigo! \uD83D\uDE80\uD83D\uDD25\u26EA`;
    const url = `https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const sendBirthdayGreeting = (member: Member) => {
    const message = `¡FELIZ CUMPLEAÑOS, ${member.name.toUpperCase()}! \uD83C\uDF82\uD83C\uDF89 Hoy celebramos tu vida y damos gracias a Dios por tenerte con nosotros en el ministerio. ¡Que el Señor te bendiga grandemente! \uD83C\uDF88\uD83C\uDF81\u26EA`;
    const url = `https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const isBirthdayToday = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const today = new Date();
    const bDate = new Date(dateStr);
    return today.getDate() === bDate.getUTCDate() && today.getMonth() === bDate.getUTCMonth();
  };

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6 pt-10">
        <div>
          <h1 className="text-5xl font-black text-[#1a1714] dark:text-white uppercase tracking-tighter italic leading-none">
            Gestión de <span className="text-[var(--brand-primary)]">Miembros</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8c7f72] mt-2">Base de datos oficial del ministerio</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/members/scan"><button className="px-6 py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl flex items-center gap-2"><QrCode size={16} /> Escanear</button></Link>
          <Link href="/members/new"><button className="px-8 py-4 bg-[var(--brand-primary)] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-2xl flex items-center gap-2"><PlusCircle size={16} /> Nuevo</button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border-2 border-[#1a1714] dark:border-white shadow-[4px_4px_0px_0px_#1a1714]">
            <Label className="text-[10px] font-black uppercase tracking-widest text-[#8c7f72] mb-4 block">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="NOMBRE..." className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl py-3 pl-10 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand-primary)]" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-[2rem] border-2 border-[#1a1714] flex flex-col gap-1 shadow-sm">
            {['all', 'Joven', 'Directiva'].map(role => (
              <button key={role} onClick={() => setFilterRole(role as any)} className={cn("w-full text-left px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all", filterRole === role ? "bg-[var(--brand-primary)] text-white shadow-lg" : "text-gray-500 hover:bg-gray-50")}>{role === 'all' ? 'Todos' : role}</button>
            ))}
          </div>
        </aside>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            [1,2,3,4].map(i => <div key={i} className="h-40 rounded-[2.5rem] bg-gray-100 dark:bg-gray-800 animate-pulse" />)
          ) : filtered.map((member) => (
            <Card key={member.id} className="rounded-[2.5rem] border-2 border-[#e8e2d9] dark:border-gray-800 hover:border-[#1a1714] dark:hover:border-white transition-all group relative overflow-hidden h-full shadow-sm hover:shadow-xl hover:-translate-y-1">
              <div className={cn("absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase text-white z-20", member.role === 'Directiva' ? "bg-purple-600" : "bg-blue-600")}>{member.role}</div>
              <CardHeader className="pb-2">
                <Link href={`/members/${member.id}`}>
                  <CardTitle className="text-xl font-black uppercase italic tracking-tight hover:text-[var(--brand-primary)] transition-colors cursor-pointer leading-tight mb-1">{member.name}</CardTitle>
                </Link>
                <div className="flex items-center gap-2 text-[#8c7f72]"><Phone size={12} /><CardDescription className="text-[10px] font-bold">{member.phone}</CardDescription></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-pink-500"><Cake size={14} /><span className="text-[10px] font-black uppercase">{member.birthDate ? format(new Date(member.birthDate), 'd MMMM', { locale: es }) : 'No registrado'}</span></div>
                  <div className="flex gap-2">
                    {isBirthdayToday(member.birthDate) && (
                      <button onClick={(e) => { e.stopPropagation(); sendBirthdayGreeting(member); }} className="p-2 rounded-xl bg-pink-500 text-white animate-bounce shadow-lg shadow-pink-500/20" title="¡Enviar Felicitación!"><Gift size={14} /></button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); sendWhatsAppReminder(member); }} className="p-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all shadow-lg shadow-green-500/20" title="Enviar Recordatorio"><MessageCircle size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedMemberQR(member); }} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"><QrCode size={14} /></button>
                    <Link href={`/members/edit/${member.id}`}><button className="p-2 rounded-xl bg-gray-100 dark:bg-gray-900 hover:bg-[var(--brand-primary)] hover:text-white transition-all shadow-sm"><Edit size={14} /></button></Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><button className="p-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button></AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2rem] border-2 border-[#1a1714]"><AlertDialogHeader><AlertDialogTitle className="font-black uppercase italic">¿Eliminar?</AlertDialogTitle><AlertDialogDescription className="text-xs font-bold uppercase text-gray-500">Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl font-black uppercase text-[10px]">No</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMember(member.id)} className="bg-red-500 hover:bg-red-600 rounded-xl font-black uppercase text-[10px]">Si, Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedMemberQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedMemberQR(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-24 bg-[var(--brand-primary)]" />
              <button onClick={() => setSelectedMemberQR(null)} className="absolute top-4 right-4 text-white hover:scale-110 transition-transform"><X size={24} /></button>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-4 shadow-xl flex items-center justify-center border-4 border-[var(--brand-primary)] shadow-orange-500/20"><UserCircle2 size={40} className="text-[var(--brand-primary)]" /></div>
                <h3 className="text-2xl font-black uppercase italic text-[#1a1714] mb-1 leading-none">{selectedMemberQR.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--brand-primary)] mb-8">Miembro Oficial</p>
                <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-gray-200 inline-block mb-8 shadow-inner"><QRCodeSVG value={selectedMemberQR.id} size={180} level="H" includeMargin /></div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Escanea este código único para <br/> registrar asistencia en el ministerio</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
