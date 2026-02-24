"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, ArrowRightLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setSearch] = useState('');
  const [results, setResults] = useState<{ id: string, name: string, type: string, href: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchData = async () => {
      // Búsqueda simplificada combinando miembros y transacciones
      const [mRes, tRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/transactions')
      ]);
      
      const members = await mRes.json();
      const txs = await tRes.json();

      const mResults = members.filter((m: any) => m.name.toLowerCase().includes(query.toLowerCase()))
        .map((m: any) => ({ id: m.id, name: m.name, type: 'Miembro', href: `/members/${m.id}` }));
      
      const tResults = txs.filter((t: any) => t.description.toLowerCase().includes(query.toLowerCase()))
        .map((t: any) => ({ id: t.id, name: t.description, type: 'Transacción', href: '/transactions' }));

      setResults([...mResults, ...tResults].slice(0, 8));
    };

    const timer = setTimeout(searchData, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-xl bg-[#13151f] border-2 border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center p-4 border-b border-white/5">
          <Search size={20} className="text-[var(--brand-primary)] mr-3" />
          <input 
            autoFocus
            placeholder="Buscar miembros o transacciones... (Ctrl+K)"
            className="flex-1 bg-transparent border-none outline-none text-white font-black uppercase text-sm"
            value={query}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && query.length > 1 && (
            <p className="p-4 text-center text-xs font-bold text-gray-500 uppercase">No se encontraron resultados</p>
          )}
          {results.map((res) => (
            <button
              key={res.id}
              onClick={() => { router.push(res.href); setIsOpen(false); }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-3 text-left">
                {res.type === 'Miembro' ? <User size={16} className="text-blue-400" /> : <ArrowRightLeft size={16} className="text-green-400" />}
                <div>
                  <p className="text-sm font-black text-white group-hover:text-[var(--brand-primary)] transition-colors uppercase">{res.name}</p>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{res.type}</p>
                </div>
              </div>
              <span className="text-[8px] font-black text-gray-600 uppercase border border-white/5 px-2 py-1 rounded-md group-hover:border-[var(--brand-primary)]">Seleccionar</span>
            </button>
          ))}
        </div>
        
        <div className="bg-black/20 p-3 flex justify-between">
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Enter para navegar · Esc para cerrar</p>
          <p className="text-[8px] font-black text-[var(--brand-primary)] uppercase">ChurchFlow Pro Search</p>
        </div>
      </motion.div>
    </div>
  );
}
