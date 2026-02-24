'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
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
import { Edit, PlusCircle, Trash2, Tag, ArrowUpCircle, ArrowDownCircle, Settings2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface Category { id: string; name: string; type: 'income' | 'expense'; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, type: newType }),
    });
    if (res.ok) {
      toast({ title: "Categoría Creada ✓" });
      setNewName('');
      fetchCategories();
    }
  };

  const handleEdit = async () => {
    if (!editingCategory?.name) return;
    const res = await fetch(`/api/categories/${editingCategory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingCategory.name }),
    });
    if (res.ok) {
      toast({ title: "Cambios Guardados ✓" });
      setIsEditOpen(false);
      fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ title: "Categoría Eliminada" });
      fetchCategories();
    }
  };

  const incomeCats = categories.filter(c => c.type === 'income');
  const expenseCats = categories.filter(c => c.type === 'expense');

  if (loading && categories.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin h-10 w-10 text-[var(--brand-primary)]" /></div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-0">
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
          Gestión de <span className="text-[var(--brand-primary)]">Categorías</span>
        </h1>
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#8c7f72] mt-4">Organiza el origen y destino de tus fondos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Formulario Creación */}
        <div className="lg:col-span-4">
          <Card className="rounded-[3rem] bg-[#13151f] border-2 border-white/5 p-8 shadow-2xl sticky top-8">
            <CardHeader className="px-0 pb-6 mb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <PlusCircle className="text-[var(--brand-primary)]" />
                <CardTitle className="text-xl font-black uppercase italic">Nueva Categoría</CardTitle>
              </div>
            </CardHeader>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-gray-500 ml-2">Nombre de Etiqueta</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Ofrendas..." className="bg-white/5 border-2 border-white/5 p-6 rounded-2xl font-black uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-gray-500 ml-2">Flujo Financiero</Label>
                <Select onValueChange={(v: any) => setNewType(v)} defaultValue={newType}>
                  <SelectTrigger className="bg-white/5 border-2 border-white/5 p-6 rounded-2xl font-black uppercase h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#13151f] border-white/10 text-white font-black uppercase text-xs">
                    <SelectItem value="income">Ingreso (+)</SelectItem>
                    <SelectItem value="expense">Gasto (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button type="submit" className="w-full bg-[var(--brand-primary)] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-500/20 hover:brightness-110 transition-all mt-4">Registrar Categoría</button>
            </form>
          </Card>
        </div>

        {/* Listado de Categorías */}
        <div className="lg:col-span-8 space-y-10">
          {[
            { title: 'Fuentes de Ingreso', data: incomeCats, icon: ArrowUpCircle, color: 'text-green-500' },
            { title: 'Destinos de Gasto', data: expenseCats, icon: ArrowDownCircle, color: 'text-red-500' }
          ].map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-6 px-4">
                <section.icon className={cn("h-6 w-6", section.color)} />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{section.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.data.map((cat) => (
                  <Card key={cat.id} className="rounded-[2rem] bg-[#13151f] border-2 border-white/5 p-5 flex items-center justify-between group hover:border-white/10 transition-all shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/5", section.color)}>
                        <Tag size={18} />
                      </div>
                      <p className="font-black uppercase text-sm tracking-tight text-white">{cat.name}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingCategory(cat); setIsEditOpen(true); }} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Edit size={14} /></button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><button className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#13151f] border-2 border-white/10 rounded-[2.5rem] text-white">
                          <AlertDialogHeader><AlertDialogTitle className="font-black uppercase italic">¿Eliminar?</AlertDialogTitle><AlertDialogDescription className="text-gray-400 text-xs font-bold uppercase">Esto podría afectar los reportes históricos.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel className="rounded-xl font-black uppercase text-[10px]">No</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-red-500 rounded-xl font-black uppercase text-[10px]">Sí, Borrar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Edición */}
      <AlertDialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <AlertDialogContent className="bg-[#13151f] border-2 border-white/10 rounded-[3rem] text-white p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-black uppercase italic tracking-tighter mb-4">Editar Categoría</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 my-6">
            <Label className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">Nuevo Nombre</Label>
            <Input value={editingCategory?.name || ''} onChange={(e) => setEditingCategory(prev => prev ? {...prev, name: e.target.value} : null)} className="bg-white/5 border-2 border-white/5 p-6 rounded-2xl font-black uppercase" />
          </div>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel onClick={() => setEditingCategory(null)} className="rounded-xl font-black uppercase text-xs py-6">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEdit} className="bg-[var(--brand-primary)] rounded-xl font-black uppercase text-xs py-6">Guardar Cambios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
