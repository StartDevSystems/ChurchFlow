
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
            document.documentElement.style.setProperty('--brand-primary', settings.primaryColor);
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
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/logo de los jovenes.jpeg" />
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
