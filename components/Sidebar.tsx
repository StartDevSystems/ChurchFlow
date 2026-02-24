"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { Home, Users, ArrowRightLeft, FileText, DollarSign, LogOut, BarChart3, Settings, Menu, X, Settings2, Bell, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import { Button } from './ui/Button';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/members', label: 'Miembros', icon: Users },
  { href: '/transactions', label: 'Transacciones', icon: ArrowRightLeft },
  { href: '/reports', label: 'Reportes', icon: FileText },
  { href: '/stats', label: 'Estadísticas', icon: BarChart3 },
  { href: '/dues', label: 'Cuotas', icon: DollarSign },
  { href: '/events', label: 'Eventos', icon: Settings },
];

const adminNavItems = [
  { href: '/admin/categories', label: 'Categorías', icon: Settings },
  { href: '/admin/settings', label: 'Ajustes', icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const [churchInfo, setChurchInfo] = useState({
    name: 'Finanzas Jóvenes',
    subtitle: 'Iglesia Central',
    logo: '/logo de los jovenes.jpeg'
  });

  // Cerrar notificaciones al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar todo al navegar
  useEffect(() => {
    setShowNotifs(false);
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkOnlineStatus = () => {
      const isSimulatedOffline = localStorage.getItem('simulate-offline') === 'true';
      setIsOnline(isSimulatedOffline ? false : navigator.onLine);
    };

    checkOnlineStatus();
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    // Escuchar cambios desde otras pestañas (como Ajustes)
    window.addEventListener('storage', checkOnlineStatus);

    async function fetchData() {
      try {
        const sRes = await fetch('/api/settings');
        if (sRes.ok) {
          const data = await sRes.json();
          setChurchInfo({ name: data.churchName, subtitle: data.churchSubtitle, logo: data.logoUrl });
        }
        if (session) {
          const iRes = await fetch('/api/users/profile/image');
          if (iRes.ok) setUserImage((await iRes.json()).image);
          
          const aRes = await fetch('/api/admin/audit');
          if (aRes.ok) setNotifications((await aRes.json()).slice(0, 5));
        }
      } catch (error) {}
    }
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [session]);

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-gray-900 text-white border-gray-700">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-200 p-4 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Link href="/" className="group/logo">
          <div className="mb-8 text-center mt-12 lg:mt-0 relative transition-transform hover:scale-105 active:scale-95 duration-200">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image src={churchInfo.logo} alt="Logo" fill className="rounded-full border-2 border-[var(--brand-primary)] p-0.5 object-cover shadow-lg group-hover/logo:shadow-orange-500/20" />
            </div>
            <h1 className="text-xl font-bold text-white leading-tight group-hover/logo:text-[var(--brand-primary)] transition-colors">{churchInfo.name}</h1>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{churchInfo.subtitle}</p>
          </div>
        </Link>
        
        <div className="mb-6 flex items-center justify-center gap-2 relative" ref={notifRef}>
          <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase border", isOnline ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
            <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-green-500" : "bg-red-500")} /> {isOnline ? 'Online' : 'Offline'}
          </div>
          
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-1.5 hover:bg-white/5 rounded-full transition-all">
            <Bell size={16} className={cn(notifications.length > 0 ? "text-[var(--brand-primary)]" : "text-gray-500")} />
            {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900" />}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-10 left-0 right-0 mt-2 bg-[#13151f] rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] text-left border-2 border-white/5 mx-2 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--brand-primary)] opacity-50" />
                <p className="text-[8px] font-black uppercase text-gray-500 mb-4 tracking-widest flex justify-between">Actividad Reciente <Bell size={10} /></p>
                <div className="space-y-3 max-h-[250px] overflow-y-auto no-scrollbar">
                  {notifications.map((n) => (
                    <div key={n.id} className="border-l-2 border-[var(--brand-primary)]/40 pl-3 py-1 hover:bg-white/5 transition-all rounded-r-lg">
                      <p className="text-[9px] text-white font-black leading-tight mb-1 uppercase italic">{n.details}</p>
                      <p className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter">{n.userEmail.split('@')[0]} \u2022 {format(new Date(n.createdAt), 'HH:mm')}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && <p className="text-[8px] text-gray-600 font-black uppercase text-center py-4 italic">Sin notificaciones nuevas</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <nav className="flex-grow flex flex-col space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className={cn("flex items-center p-3 rounded-xl transition-all group", pathname === item.href ? "bg-[var(--brand-primary)] text-white shadow-lg shadow-orange-500/20" : "hover:bg-white/5 text-gray-400")}>
              <item.icon className={cn("mr-3 h-5 w-5", pathname === item.href ? "text-white" : "text-gray-500 group-hover:text-white")} /> <span className="font-black text-[11px] uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
          
          {session?.user?.role === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t border-white/5">
                <h2 className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3">Administración</h2>
                <div className="space-y-1">
                     {adminNavItems.map((item) => (
                        <Link key={item.label} href={item.href} className={cn("flex items-center p-3 rounded-xl transition-all group", pathname.startsWith(item.href) ? "bg-white/5 text-white" : "hover:bg-white/5 text-gray-400")}>
                            <item.icon className={cn("mr-3 h-5 w-5", pathname.startsWith(item.href) ? "text-[var(--brand-primary)]" : "text-gray-500 group-hover:text-[var(--brand-primary)]")} /> <span className="font-black text-[11px] uppercase tracking-widest">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
          )}
        </nav>

        {session && (
          <div className="mt-auto pt-4 border-t border-white/5 space-y-4">
            <Link href="/profile" className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:border-[var(--brand-primary)]/30 transition-all group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-700 shadow-inner">
                {userImage ? <Image src={userImage} alt="User" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-gray-800 text-[var(--brand-primary)] font-black text-xs">{session.user.email?.[0].toUpperCase()}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white truncate uppercase italic">{(session.user as any).firstName || session.user.email?.split('@')[0]}</p>
                <p className="text-[8px] font-black text-[var(--brand-primary)] uppercase tracking-tighter opacity-80">{session.user.role}</p>
              </div>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-red-400 hover:bg-red-900/10 rounded-xl h-11 transition-all" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="mr-3 h-5 w-5" /> <span className="font-black text-[10px] uppercase tracking-[0.2em]">Cerrar Sesión</span>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
