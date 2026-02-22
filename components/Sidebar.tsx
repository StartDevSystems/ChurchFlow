"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Users, ArrowRightLeft, FileText, DollarSign, LogOut, BarChart3, Settings, Menu, X } from 'lucide-react';
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
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Botón Móvil (Hamburguesa) */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={toggleSidebar} className="bg-gray-900 text-white border-gray-700 shadow-md">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Overlay para móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-200 p-4 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-8 text-center mt-12 lg:mt-0">
          <Image
            src="/logo de los jovenes.jpeg"
            alt="Logo"
            width={80}
            height={80}
            className="mx-auto rounded-full mb-4 border-2 border-blue-500 p-0.5"
          />
          <h1 className="text-xl font-bold text-white tracking-tight">Finanzas Jóvenes</h1>
          <p className="text-xs text-gray-400 font-medium">Iglesia Central</p>
        </div>
        
        <nav className="flex-grow flex flex-col space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center p-3 rounded-xl transition-all duration-200 group",
                pathname === item.href
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "hover:bg-gray-800 hover:text-white text-gray-400"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-transform group-hover:scale-110",
                pathname === item.href ? "text-white" : "text-gray-500"
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          
          {/* Admin Section */}
          <div className="pt-4 mt-4 border-t border-gray-800">
              <h2 className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Administración</h2>
              <div className="space-y-1">
                   {adminNavItems.map((item) => (
                      <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                          "flex items-center p-3 rounded-xl transition-all duration-200 group",
                          pathname.startsWith(item.href)
                              ? "bg-gray-800 text-white shadow-inner"
                              : "hover:bg-gray-800 hover:text-white text-gray-400"
                          )}
                      >
                          <item.icon className="mr-3 h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                          <span className="font-medium">{item.label}</span>
                      </Link>
                  ))}
              </div>
          </div>
        </nav>

        {session && (
          <div className="mt-auto pt-4 border-t border-gray-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-500 hover:bg-red-900/10 rounded-xl"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
