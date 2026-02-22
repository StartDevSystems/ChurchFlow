
'use client';

import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SessionProvider, useSession } from 'next-auth/react'; // Import SessionProvider and useSession
import { usePathname, useRouter } from 'next/navigation'; // Import usePathname and useRouter
import { useEffect } from 'react';

import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });



// AuthWrapper component to handle client-side redirection
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading

    if (!session && !isPublicPath) {
      router.push('/login');
    }
    // If authenticated and on a public path, redirect to dashboard
    if (session && isPublicPath) {
        router.push('/');
    }
  }, [session, status, isPublicPath, pathname, router]);


  // Only render children if session is loaded or on a public path
  if (status === 'loading' && !isPublicPath) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p>Cargando sesión...</p>
      </div>
    );
  }

  // If on a public path, render immediately.
  // If session exists, render children.
  // Otherwise, user is unauthenticated and not on a public path, so the useEffect will redirect.
  // In this case, we don't render children to prevent flicker before redirect.
  if (isPublicPath || (session && status === 'authenticated')) {
    return <>{children}</>;
  }
  
  return null; // Don't render anything if not authenticated and not on a public path, as a redirect is happening
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo de los jovenes.jpeg" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthWrapper>
              <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
                <Sidebar />
                <main className="flex-1 p-4 md:p-8 h-screen overflow-y-auto mt-14 lg:mt-0">
                  <div className="max-w-7xl mx-auto">
                    {children}
                  </div>
                </main>
              </div>
            </AuthWrapper>
          </ThemeProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
