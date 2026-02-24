"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Edit3, Phone, Mail, Calendar, Target, 
  TrendingUp, Award, Clock, Save, Camera, Loader2, User as UserIcon, CheckCircle2, Cake
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function MemberProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', phone: '', email: '', role: '', birthDate: '', monthlyDue: '', position: '', status: '' 
  });
  const [image, setImage] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    try {
      const res = await fetch(`/api/members/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          role: data.role || 'Joven',
          position: data.position || 'MIEMBRO',
          status: data.status || 'ACTIVO',
          birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
          monthlyDue: data.monthlyDue?.toString() || '0'
        });
        setImage(data.image || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMember(); }, [fetchMember]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, image })
      });
      if (res.ok) {
        toast({ title: "Perfil Actualizado ✓", variant: "success" });
        setIsEditing(false);
        fetchMember();
      }
    } catch (error) {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0c14]">
      <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
    </div>
  );

  return (
    <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 min-h-screen bg-[#0a0c14] text-white pb-20 overflow-x-hidden font-sans">
      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.5; }
      `}</style>

      {/* Header ESPN - Compacto pero Impactante */}
      <div className="relative w-full pt-10 pb-12 px-6 bg-gradient-to-b from-[var(--brand-primary)]/10 to-[#0a0c14] border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <button onClick={() => router.push('/members')} className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-all">
            <ArrowLeft size={14} /> Volver
          </button>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-10 md:gap-14">
            {/* Foto Profile */}
            <div className="relative shrink-0">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] border-4 border-[var(--brand-primary)] overflow-hidden bg-[#13151f] relative shadow-2xl transition-transform hover:scale-[1.02]">
                {image ? <Image src={image} alt={formData.name} fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-gray-800/50"><UserIcon size={80} className="text-gray-700" /></div>}
                {isEditing && (
                  <label className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                    <Camera size={32} className="text-[var(--brand-primary)]" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              <div className={cn("absolute -bottom-2 -right-2 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border-4 border-[#0a0c14] shadow-xl", formData.role === 'Directiva' ? "bg-purple-600" : "bg-[var(--brand-primary)]")}>
                {formData.position || 'MIEMBRO'}
              </div>
            </div>

            {/* Info Principal */}
            <div className="text-center lg:text-left flex-1 w-full min-w-0">
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-5">
                <span className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-6 py-3 rounded-2xl border transition-all shadow-inner", formData.status === 'ACTIVO' ? "text-green-500 border-green-500/20" : formData.status === 'INACTIVO' ? "text-red-500 border-red-500/20" : "text-yellow-500 border-yellow-500/20")}>
                  <div className={cn("w-2 h-2 rounded-full", formData.status === 'ACTIVO' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : formData.status === 'INACTIVO' ? "bg-red-500" : "bg-yellow-500")} />
                  {formData.status}
                </span>
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-6 py-3 rounded-2xl border border-white/10 opacity-70"><Phone size={14} className="text-[var(--brand-primary)]" /> {formData.phone}</span>
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-6 py-3 rounded-2xl border border-white/10 opacity-70"><Mail size={14} className="text-[var(--brand-primary)]" /> {formData.email || 'SIN CORREO'}</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] mb-5 break-words whitespace-normal max-w-full">{formData.name}</h1>
              <p className="text-xl md:text-2xl font-black uppercase text-[var(--brand-primary)] italic tracking-widest opacity-90">{formData.position}</p>
            </div>

            {/* Boton Accion */}
            <div className="shrink-0 w-full lg:w-auto mt-6 lg:mt-0">
              <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={cn("w-full px-12 py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl", isEditing ? "bg-green-500 text-white shadow-green-500/20" : "bg-white text-black hover:bg-[var(--brand-primary)] hover:text-white")}>
                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : isEditing ? <CheckCircle2 size={22} /> : <Edit3 size={22} />}
                {isEditing ? 'GUARDAR CAMBIOS' : 'EDITAR PERFIL'}
              </button>
              {isEditing && <button onClick={() => setIsEditing(false)} className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white text-center transition-colors">Cancelar</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 relative z-20">
        {/* Stats Grid - MAS GRANDE */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {[
            { label: 'Aportación', val: formatCurrency(member.stats?.totalContributed || 0), Icon: TrendingUp, color: 'text-orange-500' },
            { label: 'Fidelidad', val: `${member.stats?.loyaltyScore || 0}%`, Icon: Target, color: 'text-blue-500' },
            { label: 'Cargo', val: formData.position || 'MIEMBRO', Icon: Award, color: 'text-yellow-500' },
            { label: 'Asistencias', val: member.stats?.attendanceCount || 0, Icon: Clock, color: 'text-purple-500' }
          ].map((s, i) => (
            <Card key={i} className="rounded-[2.5rem] bg-[#13151f] border-2 border-white/5 p-8 flex flex-col items-center justify-center text-center shadow-2xl transition-all hover:border-[var(--brand-primary)]/30 group">
              <s.Icon className={cn("mb-4 h-8 w-8 transition-transform group-hover:scale-110", s.color)} />
              <p className="text-[9px] font-black uppercase text-gray-500 mb-2 tracking-[0.2em]">{s.label}</p>
              <h4 className="text-2xl md:text-3xl font-black italic text-white truncate w-full tracking-tighter">{s.val}</h4>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Formulario - MAS GRANDE */}
          <div className="lg:col-span-8 space-y-10">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4"><Calendar className="text-[var(--brand-primary)] h-8 w-8" /> Datos del Miembro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#13151f]/40 p-10 md:p-12 rounded-[3.5rem] border-2 border-white/5 shadow-inner">
              {[
                { label: 'Nombre Completo', key: 'name', type: 'text' },
                { label: 'Correo Electrónico', key: 'email', type: 'email' },
                { label: 'Teléfono Celular', key: 'phone', type: 'tel' },
                { label: 'Fecha Nacimiento', key: 'birthDate', type: 'date' },
                { label: 'Cargo Ministerial', key: 'position', type: 'text' },
                { label: 'Cuota Sugerida', key: 'monthlyDue', type: 'number' },
                { label: 'Rol Sistema', key: 'role', type: 'select' },
                { label: 'Actividad', key: 'status', type: 'status-select' }
              ].map((field) => (
                <div key={field.key} className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-3 tracking-widest">{field.label}</label>
                  {field.type === 'select' ? (
                    <select disabled={!isEditing} value={(formData as any)[field.key]} onChange={e => setFormData({...formData, [field.key]: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-5 rounded-2xl text-white font-black uppercase outline-none focus:border-[var(--brand-primary)] disabled:opacity-50 appearance-none text-sm transition-all shadow-lg"><option value="Joven">Joven</option><option value="Directiva">Directiva</option></select>
                  ) : field.type === 'status-select' ? (
                    <select disabled={!isEditing} value={(formData as any)[field.key]} onChange={e => setFormData({...formData, [field.key]: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 p-5 rounded-2xl text-white font-black uppercase outline-none focus:border-[var(--brand-primary)] disabled:opacity-50 appearance-none text-sm transition-all shadow-lg"><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option><option value="OBSERVACION">OBSERVACIÓN</option></select>
                  ) : (
                    <input type={field.type} disabled={!isEditing} className="w-full bg-white/5 border-2 border-white/10 p-5 rounded-2xl text-white font-black uppercase outline-none focus:border-[var(--brand-primary)] disabled:opacity-50 color-scheme-dark text-sm transition-all shadow-lg" value={(formData as any)[field.key]} onChange={e => setFormData({...formData, [field.key]: e.target.value})} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Historial - MAS GRANDE */}
          <div className="lg:col-span-4 space-y-8">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4"><TrendingUp className="text-green-500 h-7 w-7" /> Historial</h3>
            <div className="space-y-4">
              {member.transactions?.slice(0, 10).map((t: any) => (
                <div key={t.id} className="p-6 bg-[#13151f] rounded-[2rem] border-2 border-white/5 flex justify-between items-center group hover:border-[var(--brand-primary)] transition-all shadow-2xl">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">{format(new Date(t.date), 'dd MMM yyyy', { locale: es })}</p>
                    <p className="text-sm font-black text-white uppercase truncate mt-1.5">{t.description}</p>
                  </div>
                  <p className={cn("font-black italic text-base shrink-0", t.type === 'income' ? "text-green-500" : "text-red-500")}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
