"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Users, ArrowRightLeft, FileText, DollarSign, LogOut, BarChart3, Settings } from 'lucide-react';
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
]

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-gray-900 text-gray-200 h-screen p-4 flex flex-col">
      <div className="mb-8 text-center">
        <Image
          src="/logo de los jovenes.jpeg"
          alt="Logo"
          width={80}
          height={80}
          className="mx-auto rounded-full mb-4"
        />
        <h1 className="text-2xl font-bold text-white">Finanzas Jóvenes</h1>
        <p className="text-sm text-gray-400">Iglesia Central</p>
      </div>
      <nav className="flex-grow flex flex-col space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center p-3 rounded-lg transition-colors",
              pathname === item.href
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-800 hover:text-white"
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Link>
        ))}
        
        {/* Admin Section */}
        <div className="pt-4 mt-4 border-t border-gray-700">
            <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</h2>
            <div className="mt-2 space-y-2">
                 {adminNavItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                        "flex items-center p-3 rounded-lg transition-colors",
                        pathname.startsWith(item.href)
                            ? "bg-gray-700 text-white"
                            : "hover:bg-gray-800 hover:text-white"
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
      </nav>

      {session && (
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-500 hover:bg-gray-800"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      )}
    </aside>
  );
}
