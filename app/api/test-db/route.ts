import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Intentamos una operación simple
    const userCount = await prisma.user.count();
    return NextResponse.json({ 
      status: '✅ Conexión Exitosa', 
      users: userCount,
      database: 'PostgreSQL (Supabase)',
      env: {
        has_db_url: !!process.env.DATABASE_URL,
        has_direct_url: !!process.env.DIRECT_URL,
        node_env: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error('Test-DB Error:', error);
    return NextResponse.json({ 
      status: '❌ Error de Conexión', 
      message: error.message,
      code: error.code,
      meta: error.meta,
      hint: 'Verifica las variables DATABASE_URL y DIRECT_URL en Vercel.'
    }, { status: 500 });
  }
}
