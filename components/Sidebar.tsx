"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
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
  const [churchInfo, setChurchInfo] = useState({
    name: 'Finanzas Jóvenes',
    subtitle: 'Iglesia Central',
    logo: '/logo de los jovenes.jpeg'
  });

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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
        <Link href="/" onClick={() => setIsOpen(false)} className="group/logo">
          <div className="mb-8 text-center mt-12 lg:mt-0 relative transition-transform hover:scale-105 active:scale-95 duration-200">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image src={churchInfo.logo} alt="Logo" fill className="rounded-full border-2 border-[var(--brand-primary)] p-0.5 object-cover shadow-lg group-hover/logo:shadow-orange-500/20" />
            </div>
            <h1 className="text-xl font-bold text-white leading-tight group-hover/logo:text-[var(--brand-primary)] transition-colors">{churchInfo.name}</h1>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{churchInfo.subtitle}</p>
          </div>
        </Link>
        
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase border", isOnline ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
            <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-green-500" : "bg-red-500")} /> {isOnline ? 'Online' : 'Offline'}
          </div>
          
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-1 hover:bg-gray-800 rounded-full transition-all">
            <Bell size={14} className={cn(notifications.length > 0 ? "text-[var(--brand-primary)]" : "text-gray-500")} />
            {notifications.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900" />}
          </button>
        </div>

        <AnimatePresence>
          {showNotifs && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 right-0 mt-2 bg-gray-800 rounded-2xl p-4 shadow-2xl z-50 text-left border border-white/5 mx-4">
              <p className="text-[8px] font-black uppercase text-gray-500 mb-3 tracking-widest">Actividad Reciente</p>
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="border-l-2 border-[var(--brand-primary)] pl-2">
                    <p className="text-[9px] text-white font-bold leading-tight">{n.details}</p>
                    <p className="text-[7px] text-gray-500 uppercase mt-1">{n.userEmail.split('@')[0]}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <nav className="flex-grow flex flex-col space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)} className={cn("flex items-center p-3 rounded-xl transition-all", pathname === item.href ? "bg-[var(--brand-primary)] text-white shadow-lg" : "hover:bg-gray-800 text-gray-400")}>
              <item.icon className="mr-3 h-5 w-5" /> <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          
          {session?.user?.role === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t border-gray-800">
                <h2 className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Administración</h2>
                <div className="space-y-1">
                     {adminNavItems.map((item) => (
                        <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)} className={cn("flex items-center p-3 rounded-xl transition-all", pathname.startsWith(item.href) ? "bg-gray-800 text-white shadow-inner" : "hover:bg-gray-800 text-gray-400")}>
                            <item.icon className="mr-3 h-5 w-5" /> <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
          )}
        </nav>

        {session && (
          <div className="mt-auto pt-4 border-t border-gray-800 space-y-4">
            <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-800 transition-all group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-700">
                {userImage ? <Image src={userImage} alt="User" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-800 text-[var(--brand-primary)] font-black text-xs">{session.user.email?.[0].toUpperCase()}</div>}
              </div>
              <div className="flex-1 min-w-0"><p className="text-xs font-black text-white truncate uppercase">{(session.user as any).firstName || session.user.email?.split('@')[0]}</p><p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{session.user.role}</p></div>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-500 hover:bg-red-900/10 rounded-xl h-11" onClick={() => signOut({ callbackUrl: '/login' })}><LogOut className="mr-3 h-5 w-5" /> <span className="font-black text-[10px] uppercase tracking-widest">Cerrar Sesión</span></Button>
          </div>
        )}
      </aside>
    </>
  );
}
