import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith("/api");
  const userAgent = req.headers.get("user-agent") || "";

  // 1. CAPA DE PROTECCIÓN ANTI-BOTS (Prioridad Máxima)
  const botPatterns = ["bot", "spider", "crawl", "headless", "puppeteer", "selenium"];
  if (botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    console.log(`[SECURITY] Bot bloqueado: ${userAgent}`);
    return new NextResponse(
      JSON.stringify({ error: "Acceso denegado: Bot detectado" }), 
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. VERIFICACIÓN DE SESIÓN
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Si no hay sesión y la ruta está protegida
  const protectedPaths = ["/admin", "/members", "/events", "/transactions", "/reports", "/api"];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected && !token) {
    // Si es una ruta de API, devolvemos 401 Unauthorized (JSON)
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado. Inicie sesión." }), 
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // Si es una página, redirigimos al login (HTML)
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configuramos el matcher para que el middleware se ejecute en las rutas correctas
export const config = {
  matcher: [
    "/admin/:path*",
    "/members/:path*",
    "/events/:path*",
    "/transactions/:path*",
    "/reports/:path*",
    "/api/:path*",
  ],
};
