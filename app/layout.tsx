'use client';

import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SessionProvider, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Toaster } from '@/components/ui/toaster';
import { CommandPalette } from '@/components/CommandPalette';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

function AppStructure({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname?.startsWith(path + '/'));

  useEffect(() => {
    if (status === 'loading') return;

    if (!session && !isPublicPath) {
      router.push('/login');
    }
    if (session && isPublicPath) {
        router.push('/');
    }
  }, [session, status, isPublicPath, router]);

  if (status === 'loading' && !isPublicPath) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c14] text-white">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)] mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Cargando Sistema Pro...</p>
      </div>
    );
  }

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (session) {
    return (
      <div className="flex min-h-screen bg-[#0a0c14]">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 mt-14 lg:mt-0 relative overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <CommandPalette />
      </div>
    );
  }
  
  return null;
}

function ConfigProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function applySettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          if (settings.primaryColor) {
            const hex = settings.primaryColor;
            document.documentElement.style.setProperty('--brand-primary', hex);
            
            // --- Lógica de Contraste Inteligente ---
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            // Solo usar texto negro si el color es MUY claro (cerca del blanco)
            const contrastText = brightness > 210 ? '#000000' : '#ffffff';
            document.documentElement.style.setProperty('--brand-text-on-primary', contrastText);

            // --- Lógica de Bi-Color Dinámico (Más sutil) ---
            // Si es naranja oficial, lo dejamos sólido o casi sólido
            const isDefaultOrange = hex.toLowerCase() === '#ff6b1a' || hex.toLowerCase() === '#e85d26';
            const secondaryHex = isDefaultOrange ? hex : (brightness > 155 ? 
              `#${Math.max(0, r-30).toString(16).padStart(2,'0')}${Math.max(0, g-30).toString(16).padStart(2,'0')}${Math.max(0, b-30).toString(16).padStart(2,'0')}` :
              `#${Math.min(255, r+30).toString(16).padStart(2,'0')}${Math.min(255, g+30).toString(16).padStart(2,'0')}${Math.min(255, b+30).toString(16).padStart(2,'0')}`);
            
            document.documentElement.style.setProperty('--brand-secondary', secondaryHex);
          }
        }
      } catch (error) {
        console.error('Error applying brand settings:', error);
      }
    }
    applySettings();
  }, []);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <head>
        {/* ── Favicon ── */}
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />

        {/* ── iOS / Apple ── */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Finanzas Jóvenes" />

        {/* ── PWA Manifest ── */}
        <link rel="manifest" href="/manifest.json" />
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#e85d26" />

        {/* ── Viewport ── */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={cn(inter.className, "bg-[#0a0c14] text-white selection:bg-[var(--brand-primary)] selection:text-white overflow-x-hidden")}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
            <ConfigProvider>
              <AppStructure>{children}</AppStructure>
            </ConfigProvider>
          </ThemeProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}