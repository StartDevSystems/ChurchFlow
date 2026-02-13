"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ArrowRightLeft, FileText, DollarSign, LogOut, BarChart3 } from 'lucide-react'; // Import LogOut icon
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react'; // Import signOut and useSession
import { Button } from './ui/Button'; // Assuming Button component exists

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/members', label: 'Miembros', icon: Users },
  { href: '/transactions', label: 'Transacciones', icon: ArrowRightLeft },
  { href: '/reports', label: 'Reportes', icon: FileText },
  { href: '/stats', label: 'Estadísticas', icon: BarChart3 },
  { href: '/dues', label: 'Cuotas', icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession(); // Use session to check if user is logged in

  return (
    <aside className="w-64 bg-gray-900 text-gray-200 h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Finanzas Jóvenes</h1>
        <p className="text-sm text-gray-400">Iglesia Central</p>
      </div>
      <nav className="flex flex-col space-y-2">
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
      </nav>
      {session && ( // Show logout button only if session exists
        <div className="mt-auto">
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
