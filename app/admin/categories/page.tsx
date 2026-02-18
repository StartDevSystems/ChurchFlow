'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast'; // Import useToast

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast(); // Initialize useToast

  // State for the new category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  
  // State for editing
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error al cargar categorías",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, setCategories, toast, setError]); // Dependencies for useCallback

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]); // Now fetchCategories is a stable dependency

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) {
      toast({
        title: "Error al añadir categoría",
        description: "El nombre de la categoría no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, type: newCategoryType }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create category');
      }
      toast({
        title: "Categoría añadida",
        description: `'${newCategoryName}' de ${newCategoryType === 'income' ? 'ingreso' : 'gasto'} creada con éxito.`,
      });
      setNewCategoryName('');
      await fetchCategories(); // Refresh list
    } catch (err: any) {
      toast({
        title: "Error al añadir categoría",
        description: err.message,
        variant: "destructive",
      });
    }
  };
  
  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name) {
      toast({
        title: "Error al editar categoría",
        description: "El nombre de la categoría no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategory.name }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update category');
      }
      toast({
        title: "Categoría editada",
        description: `'${editingCategory.name}' actualizada con éxito.`,
      });
      setIsEditOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (err: any) {
      toast({
        title: "Error al editar categoría",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete category');
      }
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada con éxito.",
      });
      await fetchCategories();
    } catch (err: any) {
      toast({
        title: "Error al eliminar categoría",
        description: err.message,
        variant: "destructive",
      });
    }
  };
  
  
  const openEditDialog = (category: Category) => {
    setEditingCategory({ ...category });
    setIsEditOpen(true);
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gestionar Categorías</h1>
      
      {/* Add Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>Añadir Nueva Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Ofrendas, Mantenimiento, etc."
              />
            </div>
            <div className="w-full md:w-auto">
              <Label htmlFor="category-type">Tipo</Label>
              <Select onValueChange={(value: any) => setNewCategoryType(value)} defaultValue={newCategoryType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" /> Añadir
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Category Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>Categorías de Ingresos</CardTitle></CardHeader>
          <CardContent>
            {incomeCategories.length > 0 ? (
              <ul className="space-y-2">
                {incomeCategories.map(cat => (
                  <li key={cat.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <span className="font-medium">{cat.name}</span>
                    <div className="space-x-2">
                       <Button variant="ghost" size="icon" onClick={() => openEditDialog(cat)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se borrará la categoría &quot;{cat.name}&quot;.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>Borrar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No hay categorías de ingresos.</p>}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Categorías de Gastos</CardTitle></CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <ul className="space-y-2">
                {expenseCategories.map(cat => (
                  <li key={cat.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <span className="font-medium">{cat.name}</span>
                    <div className="space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(cat)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se borrará la categoría &quot;{cat.name}&quot;.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>Borrar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No hay categorías de gastos.</p>}
          </CardContent>
        </Card>
      </div>

       {/* Edit Dialog */}
        <AlertDialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Editar Categoría</AlertDialogTitle>
                    <AlertDialogDescription>Cambia el nombre de la categoría.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="edit-category-name">Nuevo nombre</Label>
                    <Input 
                        id="edit-category-name" 
                        value={editingCategory?.name || ''}
                        onChange={(e) => setEditingCategory(cat => cat ? {...cat, name: e.target.value} : null)}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setEditingCategory(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEditCategory}>Guardar Cambios</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
